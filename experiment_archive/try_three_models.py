#!/usr/bin/env python3
import argparse
import gc
import json
import os
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
    "gemma4": {
        "path": "/export/home/oalsumaitti/models/gemma-4-26B-A4B-it",
        "dpi": 320,
        "max_new_tokens": 4096,
        "prompt": (
            "You are an expert OCR engine for Arabic and English documents. "
            "Extract ALL text exactly as it appears. Preserve line breaks, "
            "paragraphs, punctuation, and reading order. Output only the extracted text."
        ),
    },
    "baseer": {
        "path": "/export/home/oalsumaitti/models/Baseer-Nakba",
        "dpi": 320,
        "max_new_tokens": 3072,
        "prompt": (
            "You are an expert Arabic document OCR system. "
            "Extract all visible text exactly as written. Preserve reading order, "
            "line breaks, paragraphs, headings, and numbers. Output only the extracted text."
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
    AutoModelForImageTextToText,
    AutoModelForVision2Seq,
    AutoModelForCausalLM,
]
LOADER_CANDIDATES = [c for c in LOADER_CANDIDATES if c is not None]

ATTN_CANDIDATES = [
    "flash_attention_2",
    "sdpa",
    "eager",
    None,
]


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
        inputs = processor(
            images=image,
            text=prompt,
            return_tensors="pt",
        )

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
                first_param = next(model.parameters())
                device = first_param.device
                return {
                    "processor": processor,
                    "model": model,
                    "device": device,
                    "loader": loader_cls.__name__,
                    "attn_impl": attn_impl or "default",
                    "architectures": architectures,
                }
            except Exception as e:
                errors.append(
                    f"{loader_cls.__name__} / {attn_impl or 'default'} -> {repr(e)}"
                )

    msg = "\n".join(errors[:12])
    raise RuntimeError(
        f"Could not load model from {model_path}\n"
        f"Architectures: {architectures}\n"
        f"Tried loaders:\n{msg}"
    )


def run_single_model(model_name: str, spec: dict, pdf_path: str, out_dir: Path):
    print(f"\n{'=' * 80}")
    print(f"Running model: {model_name}")
    print(f"Path        : {spec['path']}")
    print(f"DPI         : {spec['dpi']}")
    print(f"Max tokens  : {spec['max_new_tokens']}")
    print(f"{'=' * 80}")

    t_model_start = time.time()
    loaded = load_best_model(spec["path"])
    processor = loaded["processor"]
    model = loaded["model"]
    device = loaded["device"]

    print(f"Loader      : {loaded['loader']}")
    print(f"Attention   : {loaded['attn_impl']}")
    print(f"Arch        : {loaded['architectures']}")
    if torch.cuda.is_available():
        print(f"CUDA device : {torch.cuda.get_device_name(0)}")
        print(f"VRAM alloc  : {torch.cuda.memory_allocated() / 1e9:.2f} GB")
        print(f"VRAM reserv : {torch.cuda.memory_reserved() / 1e9:.2f} GB")

    pages = render_pdf_pages(pdf_path, spec["dpi"])
    print(f"Pages       : {len(pages)}")

    all_text = []
    page_stats = []

    for page_num, image in enumerate(pages, start=1):
        print(f"\n--- {model_name} | page {page_num}/{len(pages)} ---")
        t0 = time.time()

        inputs = build_inputs(processor, image, spec["prompt"], device)

        input_len = 0
        if "input_ids" in inputs:
            input_len = inputs["input_ids"].shape[-1]

        with torch.inference_mode():
            outputs = model.generate(
                **inputs,
                max_new_tokens=spec["max_new_tokens"],
                do_sample=False,
                use_cache=True,
            )

        if outputs.dim() == 2 and input_len > 0:
            generated = outputs[0][input_len:]
        else:
            generated = outputs[0]

        text = processor.decode(generated, skip_special_tokens=True).strip()
        elapsed = time.time() - t0

        all_text.append(f"=== Page {page_num} ===\n{text}\n")
        page_stats.append({
            "page": page_num,
            "chars": len(text),
            "generated_tokens": int(len(generated)),
            "seconds": round(elapsed, 2),
        })

        print(
            f"chars={len(text)} | tokens={len(generated)} | "
            f"time={elapsed:.2f}s"
        )

        del inputs, outputs, generated
        torch.cuda.empty_cache()
        gc.collect()

    total_elapsed = time.time() - t_model_start

    txt_path = out_dir / f"sample0_{model_name}.txt"
    stats_path = out_dir / f"sample0_{model_name}_stats.json"

    txt_path.write_text("\n".join(all_text), encoding="utf-8")
    stats_path.write_text(
        json.dumps(
            {
                "model": model_name,
                "model_path": spec["path"],
                "loader": loaded["loader"],
                "attention": loaded["attn_impl"],
                "architectures": loaded["architectures"],
                "dpi": spec["dpi"],
                "max_new_tokens": spec["max_new_tokens"],
                "total_seconds": round(total_elapsed, 2),
                "pages": page_stats,
            },
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    del model, processor
    torch.cuda.empty_cache()
    gc.collect()

    return {
        "text_file": str(txt_path),
        "stats_file": str(stats_path),
        "total_seconds": round(total_elapsed, 2),
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="Path to input PDF")
    parser.add_argument("--outdir", required=True, help="Output directory")
    parser.add_argument(
        "--models",
        nargs="+",
        default=["gemma4", "baseer", "ain"],
        choices=["gemma4", "baseer", "ain"],
        help="Models to run",
    )
    args = parser.parse_args()

    pdf_path = args.input
    out_dir = Path(args.outdir)
    out_dir.mkdir(parents=True, exist_ok=True)

    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"PDF not found: {pdf_path}")

    summary = {}

    for model_name in args.models:
        try:
            summary[model_name] = run_single_model(
                model_name=model_name,
                spec=MODEL_SPECS[model_name],
                pdf_path=pdf_path,
                out_dir=out_dir,
            )
        except Exception as e:
            err_path = out_dir / f"sample0_{model_name}.ERROR.txt"
            err_path.write_text(
                f"{type(e).__name__}: {e}\n\n{traceback.format_exc()}",
                encoding="utf-8",
            )
            summary[model_name] = {
                "error_file": str(err_path),
                "status": "failed",
            }
            torch.cuda.empty_cache()
            gc.collect()

    summary_path = out_dir / "sample0_summary.json"
    summary_path.write_text(
        json.dumps(summary, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    print(f"\nDone. Summary saved to: {summary_path}")


if __name__ == "__main__":
    main()
