"""
OCR benchmark scorer — CER/WER against the ground truth in ./ground_truth/

Usage:
    python score_ocr.py <hypothesis_dir> [--loose]

<hypothesis_dir> must contain one UTF-8 .txt per page, named like the ground
truth files: {book}_p{slot}.txt  (e.g. 0_p1.txt ... 45_p6.txt).
Missing hypothesis files are scored against an empty string (100% error on
non-empty GT), so partial runs still produce comparable numbers.

--loose applies Arabic-friendly normalization to BOTH sides before scoring:
    - strip tashkeel (diacritics) and tatweel
    - unify alef variants (أإآٱ -> ا), taa marbuta (ة -> ه), alef maqsura (ى -> ي)
    - unify Arabic-Indic digits to ASCII
    - drop punctuation
Use strict (default) for raw fidelity; loose for language-level accuracy.

Outputs per-page CER/WER, per-book averages, and a global summary
(page-macro average + corpus-micro, i.e. weighted by reference length).
Also writes scores.csv next to the hypothesis dir.
"""
import sys, os, io, json, re, csv, unicodedata

try:
    import jiwer
except ImportError:
    sys.exit("pip install jiwer")

GT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "benchmark", "ground_truth")

TASHKEEL = re.compile(r"[ً-ٰٟۖ-ۭ]")
PUNCT = re.compile(r"[^\w\s؀-ۿ]")
AR_DIGITS = str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789")

def norm(t, loose=False):
    t = unicodedata.normalize("NFKC", t)
    t = t.replace("ـ", "")            # tatweel
    if loose:
        t = TASHKEEL.sub("", t)
        t = re.sub("[أإآٱ]", "ا", t)
        t = t.replace("ة", "ه").replace("ى", "ي")
        t = t.translate(AR_DIGITS)
        t = PUNCT.sub(" ", t)
    t = re.sub(r"\s+", " ", t).strip()
    return t

def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    hyp_dir = sys.argv[1]
    loose = "--loose" in sys.argv

    manifest = json.load(open(os.path.join(GT_DIR, "gt_manifest.json"), encoding="utf-8"))
    rows = []
    for m in manifest:
        gt = io.open(os.path.join(GT_DIR, m["file"]), encoding="utf-8").read()
        hp = ""
        hf = os.path.join(hyp_dir, m["file"])
        if os.path.exists(hf):
            hp = io.open(hf, encoding="utf-8").read()
        gt_n, hp_n = norm(gt, loose), norm(hp, loose)
        if not gt_n:                       # EMPTY page: hallucination check
            cer = 0.0 if not hp_n else 1.0
            wer = cer
            nref = 0
        else:
            cer = jiwer.cer(gt_n, hp_n or " ")
            wer = jiwer.wer(gt_n, hp_n or " ")
            nref = len(gt_n)
        rows.append(dict(book=m["book"], slot=m["slot"], page=m["orig_page"],
                         type=m["type"], status=m["status"], ref_chars=nref,
                         cer=round(cer, 4), wer=round(wer, 4)))

    # aggregates
    scored = [r for r in rows if r["ref_chars"] > 0]
    macro_cer = sum(r["cer"] for r in scored) / len(scored)
    macro_wer = sum(r["wer"] for r in scored) / len(scored)
    tot = sum(r["ref_chars"] for r in scored)
    micro_cer = sum(r["cer"] * r["ref_chars"] for r in scored) / tot

    out = os.path.join(hyp_dir, "scores.csv")
    with open(out, "w", newline="", encoding="utf-8") as fp:
        w = csv.DictWriter(fp, fieldnames=list(rows[0].keys()))
        w.writeheader(); w.writerows(rows)

    print(f"pages scored: {len(rows)} ({len(scored)} with text, "
          f"{len(rows)-len(scored)} empty/hallucination checks)")
    print(f"normalization: {'loose' if loose else 'strict'}")
    print(f"macro CER: {macro_cer:.4f}   macro WER: {macro_wer:.4f}")
    print(f"micro CER (char-weighted): {micro_cer:.4f}")
    print(f"per-page detail -> {out}")

    # per content type
    from collections import defaultdict
    by = defaultdict(list)
    for r in scored:
        by[r["type"]].append(r)
    print("\nby content type:")
    for k, v in sorted(by.items()):
        print(f"  {k:12} pages={len(v):3}  CER={sum(x['cer'] for x in v)/len(v):.4f}  "
              f"WER={sum(x['wer'] for x in v)/len(v):.4f}")

if __name__ == "__main__":
    main()
