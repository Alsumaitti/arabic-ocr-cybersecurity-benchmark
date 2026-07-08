#!/usr/bin/env python3
"""
Markdown OCR runner - sanity-test variant of run_ocr.py.

Same model registry, same guards (loop/runaway retry), same page-render
pipeline, but:
  1. the prompt asks explicitly for Markdown structure (headings, lists,
     tables) instead of flat text
  2. output is written as {stem}.md instead of {stem}.txt

Contract:
  input : one PDF (or --pdf-dir of PDFs)
  output: <out>/{stem}.md    pages joined with "=== Page N ===" markers
          <out>/{stem}_stats.json   per-page seconds / tokens / chars

Usage:
  python run_ocr_md.py --model gemma4_31b --pdf pdfs/sample.pdf --out results/md10_test/gemma4_31b
  python run_ocr_md.py --model ain        --pdf pdfs/sample.pdf --out results/md10_test/ain
"""
import argparse, gc, io, json, os, re, sys, time

import fitz  # PyMuPDF
import torch
from PIL import Image

DPI = 320
MAX_NEW_TOKENS = 4096
REP_PENALTY = 1.15
RETRY_PENALTY = 1.3
LOOP_5GRAM = 0.5
RUNAWAY_TOKENS = 3800

# ---------------------------------------------------------------------------
# Markdown-forcing prompt. Same transcription rules as the original prompt,
# but now explicitly asks the model to preserve structure with real Markdown
# syntax instead of collapsing everything into flat lines.
# ---------------------------------------------------------------------------
MD_PROMPT = (
    "Extract ALL text from this page exactly as written, and format your output "
    "as clean Markdown. Preserve the natural reading order (Arabic is "
    "right-to-left). Use Markdown headings (# for a main title, ## for a "
    "section heading) if the page shows a title or section header. Use "
    "Markdown bullet lists (-) or numbered lists (1.) for any list items. "
    "Serialize any table as a GitHub-flavored Markdown table with | separators "
    "and a header divider row. Wrap any code or terminal output in a fenced "
    "code block (```). Transcribe only text that is visible on the page - do "
    "not describe images, do not add commentary. If the page is blank, output "
    "nothing."
)

# --------------------------------------------------------------------------
# MODEL REGISTRY - identical to run_ocr.py, edit paths to match your checkpoints.
# --------------------------------------------------------------------------
def load_gemma(model_id):
    from transformers import AutoProcessor, AutoModelForImageTextToText
    proc = AutoProcessor.from_pretrained(model_id)
    model = AutoModelForImageTextToText.from_pretrained(
        model_id, torch_dtype=torch.bfloat16, device_map="cuda")
    model.eval()

    def gen(img, rp):
        msgs = [{"role": "user", "content": [
            {"type": "image", "image": img}, {"type": "text", "text": MD_PROMPT}]}]
        inputs = proc.apply_chat_template(
            msgs, add_generation_prompt=True, tokenize=True,
            return_dict=True, return_tensors="pt").to("cuda")
        with torch.inference_mode():
            out = model.generate(**inputs, max_new_tokens=MAX_NEW_TOKENS,
                                  do_sample=False, repetition_penalty=rp)
        new = out[0][inputs["input_ids"].shape[-1]:]
        return proc.decode(new, skip_special_tokens=True), int(new.shape[-1])
    return gen

def load_qwen(model_id):
    from transformers import AutoProcessor, AutoModelForImageTextToText
    proc = AutoProcessor.from_pretrained(model_id)
    model = AutoModelForImageTextToText.from_pretrained(
        model_id, torch_dtype=torch.bfloat16, device_map="cuda")
    model.eval()

    def gen(img, rp):
        msgs = [{"role": "user", "content": [
            {"type": "image", "image": img}, {"type": "text", "text": MD_PROMPT}]}]
        kw = dict(add_generation_prompt=True, tokenize=True,
                  return_dict=True, return_tensors="pt")
        try:
            inputs = proc.apply_chat_template(msgs, enable_thinking=False, **kw)
        except TypeError:
            inputs = proc.apply_chat_template(msgs, **kw)
        inputs = inputs.to("cuda")
        with torch.inference_mode():
            out = model.generate(**inputs, max_new_tokens=MAX_NEW_TOKENS,
                                  do_sample=False, repetition_penalty=rp)
        new = out[0][inputs["input_ids"].shape[-1]:]
        txt = proc.decode(new, skip_special_tokens=True)
        if "</think>" in txt:
            txt = txt.rsplit("</think>", 1)[1]
        return txt, int(new.shape[-1])
    return gen

MODEL_REGISTRY = {
    # names on disk verified via: ls -la /export/home/oalsumaitti/models/
    "gemma4_26b": (load_gemma, "/export/home/oalsumaitti/models/gemma-4-26B-A4B-it"),
    "gemma4_31b": (load_gemma, "/export/home/oalsumaitti/models/gemma-4-31B-it"),
    "qwen36":     (load_qwen,  "/export/home/oalsumaitti/models/Qwen3.6-35B-A3B"),
    "ain":        (load_qwen,  "/export/home/oalsumaitti/models/AIN"),
}

META_NOTE = re.compile(
    r"^\s*(the (image|page|provided image)[^\n]*?(blank|no text|empty)[^\n]*|"
    r"this page (is|contains)[^\n]*)\s*$", re.I | re.M)

def looks_like_loop(text):
    w = text.split()
    if len(w) < 40:
        return False
    g = [tuple(w[i:i+5]) for i in range(len(w) - 4)]
    return 1 - len(set(g)) / len(g) > LOOP_5GRAM

def render_page(page):
    pix = page.get_pixmap(dpi=DPI)
    return Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")

def ocr_pdf(gen, pdf_path, out_dir, postfilter, overwrite):
    stem = os.path.splitext(os.path.basename(pdf_path))[0]
    md_path = os.path.join(out_dir, stem + ".md")
    stats_path = os.path.join(out_dir, stem + "_stats.json")
    if not overwrite and os.path.exists(md_path) and os.path.getsize(md_path) > 0:
        print(f"[skip] {stem} (exists)", flush=True)
        return

    doc = fitz.open(pdf_path)
    pages_out, stats = [], []
    t0 = time.time()
    for i, page in enumerate(doc, start=1):
        tp = time.time()
        img = render_page(page)
        text, ntok = gen(img, REP_PENALTY)
        if looks_like_loop(text) or ntok >= RUNAWAY_TOKENS:
            print(f"[guard] {stem} p{i}: loop/runaway ({ntok} tok) -> retry", flush=True)
            text2, ntok2 = gen(img, RETRY_PENALTY)
            if not looks_like_loop(text2) and ntok2 < ntok:
                text, ntok = text2, ntok2
        if postfilter:
            text = META_NOTE.sub("", text).strip()
        pages_out.append(f"=== Page {i} ===\n{text.strip()}\n")
        stats.append(dict(page=i, chars=len(text), generated_tokens=ntok,
                           seconds=round(time.time() - tp, 2)))
        print(f"[{stem}] page {i}/{len(doc)} {stats[-1]['seconds']}s {ntok} tok", flush=True)

    body = "\n".join(pages_out)
    tmp = md_path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        f.write(body)
    os.replace(tmp, md_path)

    json.dump(dict(model=ARGS.model, sample=stem, pdf=os.path.abspath(pdf_path),
                    dpi=DPI, max_new_tokens=MAX_NEW_TOKENS,
                    repetition_penalty=REP_PENALTY, prompt=MD_PROMPT,
                    total_seconds=round(time.time() - t0, 2), pages=stats),
              open(stats_path, "w", encoding="utf-8"), indent=1)
    doc.close()

def main():
    global ARGS
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", required=True, choices=MODEL_REGISTRY)
    ap.add_argument("--pdf", help="single PDF")
    ap.add_argument("--pdf-dir", help="directory of PDFs (sorted)")
    ap.add_argument("--out", required=True)
    ap.add_argument("--postfilter", action="store_true")
    ap.add_argument("--overwrite", action="store_true")
    ARGS = ap.parse_args()
    os.makedirs(ARGS.out, exist_ok=True)

    loader, model_id = MODEL_REGISTRY[ARGS.model]
    print(f"loading {ARGS.model} from {model_id} ...", flush=True)
    gen = loader(model_id)

    pdfs = [ARGS.pdf] if ARGS.pdf else sorted(
        os.path.join(ARGS.pdf_dir, f) for f in os.listdir(ARGS.pdf_dir)
        if f.lower().endswith(".pdf"))
    if not pdfs:
        sys.exit("no PDFs found")
    for p in pdfs:
        ocr_pdf(gen, p, ARGS.out, ARGS.postfilter, ARGS.overwrite)
    gc.collect(); torch.cuda.empty_cache()
    print("all done.", flush=True)

if __name__ == "__main__":
    main()
