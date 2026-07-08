#!/usr/bin/env python3
"""
Post-run integrity checker — run this on the server right after a job finishes,
BEFORE pulling results down for scoring. It answers: "did the run actually
produce complete, sane output?" (It does NOT measure accuracy — that is
kitab_eval.py / score_ocr.py against the ground truth, done locally.)

Checks per results directory:
  coverage   every expected PDF has a .txt + _stats.json
  markers    page markers are exactly === Page 1..N === in order (N from the PDF)
  encoding   valid UTF-8, non-empty file
  empties    pages with 0 chars (list them - some are legitimately blank)
  loops      pages whose repeated word-5gram ratio > 0.5
  runaway    pages with chars > 4x the median page of the same book
  timing     total GPU seconds, mean s/page, slowest 5 pages

Exit code 1 if coverage/markers/encoding fail (hard failures); loops/runaway
are reported as warnings.

Usage:
  python check_results.py --results results/prod/gemma4_31b --pdf-dir pdfs/books
  python check_results.py --results results/bench_rerun/gemma4_31b --pdf-dir pdfs/benchmark_samples
  # add --review-sample 20 to export 20 random pages for human spot-review
"""
import argparse, io, json, os, random, re, statistics, sys

PAGE_RE = re.compile(r"^=== Page (\d+) ===\s*$", re.M)

def pdf_page_count(pdf):
    try:
        import fitz
        d = fitz.open(pdf); n = d.page_count; d.close()
        return n
    except Exception:
        return None

def rep_ratio(text):
    w = text.split()
    if len(w) < 40:
        return 0.0
    g = [tuple(w[i:i+5]) for i in range(len(w) - 4)]
    return 1 - len(set(g)) / len(g)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--results", required=True)
    ap.add_argument("--pdf-dir", required=True)
    ap.add_argument("--review-sample", type=int, default=0)
    a = ap.parse_args()

    pdfs = sorted(f for f in os.listdir(a.pdf_dir) if f.lower().endswith(".pdf"))
    hard_fail, warn = [], []
    all_pages = []          # (book, page, chars, rep)
    timing = []

    for pdf in pdfs:
        stem = os.path.splitext(pdf)[0]
        txt_p = os.path.join(a.results, stem + ".txt")
        st_p = os.path.join(a.results, stem + "_stats.json")
        if not os.path.exists(txt_p):
            hard_fail.append(f"MISSING txt: {stem}"); continue
        if not os.path.exists(st_p):
            warn.append(f"missing stats: {stem}")
        try:
            raw = io.open(txt_p, encoding="utf-8", errors="strict").read()
        except UnicodeDecodeError as e:
            hard_fail.append(f"BAD UTF-8: {stem} ({e})"); continue
        if not raw.strip():
            hard_fail.append(f"EMPTY FILE: {stem}"); continue

        nums = [int(x) for x in PAGE_RE.findall(raw)]
        expected = pdf_page_count(os.path.join(a.pdf_dir, pdf))
        if expected and nums != list(range(1, expected + 1)):
            hard_fail.append(f"MARKERS {stem}: got {len(nums)} pages "
                             f"(expect {expected}); head={nums[:8]}")
            continue
        parts = PAGE_RE.split(raw)
        texts = {int(parts[i]): parts[i + 1].strip()
                 for i in range(1, len(parts) - 1, 2)}
        chars = [len(t) for t in texts.values()]
        med = statistics.median(chars) if chars else 0
        for pno, t in texts.items():
            r = rep_ratio(t)
            all_pages.append((stem, pno, len(t), r))
            if r > 0.5:
                warn.append(f"loop? {stem} p{pno} rep={r:.2f} chars={len(t)}")
            if med > 200 and len(t) > 4 * med:
                warn.append(f"runaway? {stem} p{pno} chars={len(t)} (median {med:.0f})")
        if os.path.exists(st_p):
            st = json.load(open(st_p, encoding="utf-8"))
            timing.extend((stem, p["page"], p["seconds"]) for p in st.get("pages", []))

    empties = [(b, p) for b, p, c, _ in all_pages if c == 0]
    print(f"books checked : {len(pdfs)}")
    print(f"pages parsed  : {len(all_pages)}")
    print(f"hard failures : {len(hard_fail)}")
    for f in hard_fail[:20]:
        print("  !!", f)
    print(f"warnings      : {len(warn)}")
    for w in warn[:20]:
        print("  ~", w)
    print(f"empty pages   : {len(empties)}  {empties[:10]}")
    if timing:
        secs = [s for _, _, s in timing]
        print(f"timing        : total {sum(secs)/3600:.2f} GPU-h, "
              f"mean {statistics.mean(secs):.1f}s/page")
        for b, p, s in sorted(timing, key=lambda x: -x[2])[:5]:
            print(f"  slowest: {b} p{p} {s:.0f}s")

    json.dump(dict(books=len(pdfs), pages=len(all_pages),
                   hard_failures=hard_fail, warnings=warn,
                   empty_pages=empties),
              open(os.path.join(a.results, "check_report.json"), "w",
                   encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"-> {os.path.join(a.results, 'check_report.json')}")

    if a.review_sample and all_pages:
        rd = os.path.join(a.results, "review_sample")
        os.makedirs(rd, exist_ok=True)
        random.seed(0)
        pick = random.sample([x for x in all_pages if x[2] > 0],
                             min(a.review_sample, len(all_pages)))
        for stem, pno, _, _ in pick:
            raw = io.open(os.path.join(a.results, stem + ".txt"), encoding="utf-8").read()
            parts = PAGE_RE.split(raw)
            texts = {int(parts[i]): parts[i + 1] for i in range(1, len(parts) - 1, 2)}
            io.open(os.path.join(rd, f"{stem}_p{pno}.txt"), "w",
                    encoding="utf-8").write(texts[pno])
        print(f"-> {len(pick)} random pages exported to {rd}/ for human review")

    sys.exit(1 if hard_fail else 0)

if __name__ == "__main__":
    main()
