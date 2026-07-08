#!/usr/bin/env python3
import argparse
import gc
import json
import time
import traceback
from pathlib import Path

import fitz
import torch
from PIL import Image
from transformers import (
    AutoConfig,
    AutoProcessor,
    AutoModelForCausalLM,
    AutoModelForImageTextToText,
)

try:
    from transformers import AutoModelForVision2Seq
except ImportError:
    AutoModelForVision2Seq = None


torch.backends.cuda.matmul.allow_tf32 = True
torch.backends.cudnn.allow_tf32 = True

MODEL_SPECS = {
    "gemma4_26b": {
        "path": "/export/home/oalsumaitti/models/gemma-4-26B-A4B-it",
        "dpi": 320,
        "max_new_tokens": 4096,
        "prompt": (
            "You are an expert OCR engine for Arabic and English documents. "
            "Extract ALL text exactly as it appears. Preserve line breaks, "
            "paragraphs, punctuation, and reading order. Output only the extracted text."
        ),
    },
    "gemma4_31b": {
        "path": "/export/home/oalsumaitti/models/gemma-4-31B-it",
        "dpi": 320,
        "max_new_tokens": 4096,
        "prompt": (
            "You are an expert OCR engine for Arabic and English documents. "
            "Extract ALL text exactly as it appears. Preserve line breaks, "
            "paragraphs, punctuation, and reading order. Output only the extracted text."
        ),
    },
    "qwen36": {
        "path": "/export/home/oalsumaitti/models/Qwen3.6-35B-A3B",
        "dpi": 320,
        "max_new_tokens": 4096,
        "prompt": (
            "You are an expert OCR engine for Arabic and English documents. "
            "Extract ALL text exactly as it appears. Preserve line breaks, "
            "paragraphs, punctuation, and reading order. Output only the extracted text."
        ),
    },
    "ain": {
        "path": "/export/home/oalsumaitti/models/AIN",
        "dpi": 320,
        "max_new_tokens": 3072,
        "prompt": (
            "You are a bilingual Arabic-English OCR system. "
            "Extract all text from the document image exactly as it appears. "
            "Preserve structure, line breaks, and reading order. Output only the extracted text."
        ),
    },
}

LOADER_CANDIDATES = [
    c for c in [AutoModelForImageTextToText, AutoModelForVision2Seq, AutoModelForCausalLM]
    if c is not None
]

ATTN_CANDIDATES = ["flash_attention_2", "sdpa", "eager", None]


def render_pdf_pages(pdf_path: str, dpi: int):
    doc = fitz.open(pdf_path)
    pages = []
    zoom = dpi / 72.0
    matrix = fitz.Matrix(zoom, zoom)
    for page_idx in range(len(doc)):
        page = doc[page_idx]
        pix = page.get_pixmap(matrix=matrix, colorspace=fitz.csRGB, alpha=False)
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        pages.append(img)
    doc.close()
    return pages


def move_inputs_to_device(inputs, device):
    moved = {}
    for k, v in inputs.items():
        if torch.is_tensor(v):
            if v.dtype.is_floating_point:
                moved[k] = v.to(device=device, dtype=torch.bfloat16, non_blocking=True)
            else:
                moved[k] = v.to(device=device, non_blocking=True)
        else:
            moved[k] = v
    return moved


def build_inputs(processor, image, prompt, device):
    messages = [
        {
            "role": "user",
            "content": [
                {"type": "image", "image": image},
                {"type": "text", "text": prompt},
            ],
        }
    ]
    try:
        inputs = processor.apply_chat_template(
            messages,
            add_generation_prompt=True,
            tokenize=True,
            return_dict=True,
            return_tensors="pt",
        )
    except Exception:
        inputs = processor(images=image, text=prompt, return_tensors="pt")
    return move_inputs_to_device(inputs, device)


def load_best_model(model_path: str):
    config = AutoConfig.from_pretrained(model_path, trust_remote_code=True)
    architectures = getattr(config, "architectures", None)
    processor = AutoProcessor.from_pretrained(model_path, trust_remote_code=True)
    errors = []

    for loader_cls in LOADER_CANDIDATES:
        for attn_impl in ATTN_CANDIDATES:
            kwargs = {
                "torch_dtype": torch.bfloat16,
                "device_map": "auto",
                "trust_remote_code": True,
                "low_cpu_mem_usage": True,
            }
            if attn_impl is not None:
                kwargs["attn_implementation"] = attn_impl
            try:
                model = loader_cls.from_pretrained(model_path, **kwargs)
                model.eval()
                device = next(model.parameters()).device
                return {
                    "processor": processor,
                    "model": model,
                    "device": device,
                    "loader": loader_cls.__name__,
                    "attn_impl": attn_impl or "default",
                    "architectures": architectures,
                }
            except Exception as e:
                errors.append(f"{loader_cls.__name__} / {attn_impl or 'default'} -> {repr(e)}")

    msg = "\n".join(errors[:12])
    raise RuntimeError(
        f"Could not load model from {model_path}\n"
        f"Architectures: {architectures}\n"
        f"Tried:\n{msg}"
    )


def ocr_single_pdf(model, processor, device, spec, pdf_path):
    pages = render_pdf_pages(pdf_path, spec["dpi"])
    all_text = []
    page_stats = []

    for page_num, image in enumerate(pages, start=1):
        t0 = time.time()
        inputs = build_inputs(processor, image, spec["prompt"], device)
        input_len = inputs["input_ids"].shape[-1] if "input_ids" in inputs else 0

        with torch.inference_mode():
            outputs = model.generate(
                **inputs,
                max_new_tokens=spec["max_new_tokens"],
                do_sample=False,
                use_cache=True,
            )

        generated = outputs[0][input_len:] if outputs.dim() == 2 and input_len > 0 else outputs[0]
        text = processor.decode(generated, skip_special_tokens=True).strip()
        elapsed = time.time() - t0

        all_text.append(f"=== Page {page_num} ===\n{text}\n")
        page_stats.append({
            "page": page_num,
            "chars": len(text),
            "generated_tokens": int(len(generated)),
            "seconds": round(elapsed, 2),
        })

        del inputs, outputs, generated
        torch.cuda.empty_cache()
        gc.collect()

    return "\n".join(all_text), page_stats


def run_model_on_all_samples(model_name, spec, pdf_paths, out_root: Path):
    model_out_dir = out_root / model_name
    model_out_dir.mkdir(parents=True, exist_ok=True)

    print(f"\n{'=' * 80}")
    print(f"Loading model: {model_name} ({spec['path']})")
    print(f"{'=' * 80}")

    t_model_start = time.time()
    loaded = load_best_model(spec["path"])
    processor, model, device = loaded["processor"], loaded["model"], loaded["device"]

    print(f"Loader={loaded['loader']} | Attn={loaded['attn_impl']} | Arch={loaded['architectures']}")
    if torch.cuda.is_available():
        print(f"VRAM alloc: {torch.cuda.memory_allocated() / 1e9:.2f} GB")

    all_sample_results = {}

    for pdf_path in pdf_paths:
        sample_name = Path(pdf_path).stem
        txt_path = model_out_dir / f"{sample_name}.txt"

        if txt_path.exists() and txt_path.stat().st_size > 0:
            print(f"SKIP {sample_name} (already done)")
            all_sample_results[sample_name] = {
                "status": "skipped_already_done",
                "text_file": str(txt_path),
            }
            continue

        print(f"\n--- [{model_name}] Processing {sample_name} ---")

        try:
            t_sample = time.time()
            text, page_stats = ocr_single_pdf(model, processor, device, spec, pdf_path)
            elapsed = time.time() - t_sample

            stats_path = model_out_dir / f"{sample_name}_stats.json"
            txt_path.write_text(text, encoding="utf-8")
            stats_path.write_text(json.dumps({
                "model": model_name,
                "sample": sample_name,
                "pdf": pdf_path,
                "dpi": spec["dpi"],
                "max_new_tokens": spec["max_new_tokens"],
                "total_seconds": round(elapsed, 2),
                "pages": page_stats,
            }, indent=2, ensure_ascii=False), encoding="utf-8")

            all_sample_results[sample_name] = {
                "status": "ok",
                "text_file": str(txt_path),
                "stats_file": str(stats_path),
                "seconds": round(elapsed, 2),
            }
            print(f"Done {sample_name}: {len(page_stats)} pages, {elapsed:.1f}s")

        except Exception as e:
            err_path = model_out_dir / f"{sample_name}.ERROR.txt"
            err_path.write_text(
                f"{type(e).__name__}: {e}\n\n{traceback.format_exc()}",
                encoding="utf-8",
            )
            all_sample_results[sample_name] = {
                "status": "failed",
                "error_file": str(err_path),
            }
            torch.cuda.empty_cache()
            gc.collect()

    model_summary_path = model_out_dir / "_model_summary.json"
    model_summary_path.write_text(json.dumps({
        "model": model_name,
        "total_seconds": round(time.time() - t_model_start, 2),
        "samples": all_sample_results,
    }, indent=2, ensure_ascii=False), encoding="utf-8")

    del model, processor
    torch.cuda.empty_cache()
    gc.collect()

    return all_sample_results


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf-dir", required=True, help="Directory containing sample PDFs")
    parser.add_argument("--outdir", required=True, help="Root output directory")
    parser.add_argument("--start", type=int, default=0)
    parser.add_argument("--end", type=int, default=45)
    parser.add_argument(
        "--models",
        nargs="+",
        default=["gemma4_26b", "gemma4_31b", "qwen36", "ain"],
        choices=["gemma4_26b", "gemma4_31b", "qwen36", "ain"],
    )
    args = parser.parse_args()

    out_root = Path(args.outdir)
    out_root.mkdir(parents=True, exist_ok=True)

    pdf_paths = []
    for i in range(args.start, args.end + 1):
        candidate = Path(args.pdf_dir) / f"{i}_sample.pdf"
        if candidate.exists():
            pdf_paths.append(str(candidate))
        else:
            print(f"WARNING: {candidate} not found, skipping.")

    if not pdf_paths:
        raise RuntimeError(f"No PDFs found in {args.pdf_dir} for range {args.start}-{args.end}")

    print(f"Found {len(pdf_paths)} PDFs to process (samples {args.start}-{args.end}).")

    overall_summary = {}
    for model_name in args.models:
        try:
            overall_summary[model_name] = run_model_on_all_samples(
                model_name, MODEL_SPECS[model_name], pdf_paths, out_root
            )
        except Exception as e:
            print(f"\n!!! MODEL {model_name} FAILED TO LOAD/RUN ENTIRELY !!!")
            traceback.print_exc()
            err_path = out_root / model_name / "_MODEL_LOAD_FAILED.txt"
            err_path.parent.mkdir(parents=True, exist_ok=True)
            err_path.write_text(
                f"{type(e).__name__}: {e}\n\n{traceback.format_exc()}",
                encoding="utf-8",
            )
            overall_summary[model_name] = {
                "status": "model_load_failed",
                "error_file": str(err_path),
            }
            torch.cuda.empty_cache()
            gc.collect()
            continue

    (out_root / "overall_summary.json").write_text(
        json.dumps(overall_summary, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    print(f"\nAll done. Overall summary: {out_root / 'overall_summary.json'}")


if __name__ == "__main__":
    main()
