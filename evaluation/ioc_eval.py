"""
Security-aware IOC layer on top of kitab_eval.py results.

Implements the "Security OCR Score" idea (0.5 * char accuracy + 0.5 * IOC recall)
proposed for benchmark_ocr_cybersecurity.py, with two methodological additions:
  1. IOC *precision* as well as recall — a model that fabricates CVE numbers or
     IPs is dangerous in a security corpus, and recall alone cannot see that.
  2. Reliability reporting — how many IOCs actually exist in the ground truth,
     per type, so we know how much weight the metric can honestly carry.

Matching is exact-string after normalization (NFKC, Arabic-Indic digits -> ASCII,
lowercase) — an IP transcribed with Arabic digits still counts as correct.

Outputs -> kitab_eval_out/leaderboard.json
"""
import io, os, re, json, sys, unicodedata, argparse
from collections import Counter, defaultdict

sys.stdout.reconfigure(encoding="utf-8")
BASE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(BASE)   # repo root (script lives in evaluation/)
_ap = argparse.ArgumentParser(description=__doc__)
_ap.add_argument("--gt", default=os.path.join(ROOT, "benchmark", "ground_truth"))
_ap.add_argument("--eval-dir", default=os.path.join(ROOT, "results", "scores"),
                 help="kitab_eval.py output dir (hyp_pages/ + model_summary.json); leaderboard.json written here")
_ap.add_argument("--models", default="ain,gemma4_26b,gemma4_31b,qwen36,qwen36_clean")
_A = _ap.parse_args()
GT_DIR = _A.gt
EVAL_DIR = _A.eval_dir
HYP_ROOT = os.path.join(EVAL_DIR, "hyp_pages")
MODELS = [m.strip() for m in _A.models.split(",") if m.strip()]

AR_DIGITS = str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789")

def norm(t):
    t = unicodedata.normalize("NFKC", t).translate(AR_DIGITS)
    return t.lower()

TLDS = ("com|net|org|io|gov|edu|info|biz|mil|int|co|uk|us|ru|cn|de|fr|sa|ae|eg|ye|onion")
PATTERNS = {
    "cve":    re.compile(r"\bcve-\d{4}-\d{4,7}\b"),
    "url":    re.compile(r"\bhttps?://[^\s\"'<>()\]\[]+"),
    "email":  re.compile(r"\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b"),
    "ipv4":   re.compile(r"\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b"),
    "hash":   re.compile(r"\b(?:[a-f0-9]{64}|[a-f0-9]{40}|[a-f0-9]{32})\b"),
    "domain": re.compile(r"\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:%s)\b" % TLDS),
    "port":   re.compile(r"(?:\bport\s*:?\s*|منفذ\s*:?\s*|:)(\d{2,5})\b"),
}

def extract(t):
    """Return {type: multiset of IOC strings} from normalized text."""
    out = {}
    urls = PATTERNS["url"].findall(t)
    emails = PATTERNS["email"].findall(t)
    covered = " ".join(urls + emails)
    for k, rx in PATTERNS.items():
        found = rx.findall(t)
        if k == "domain":
            # don't double-count domains that only appear inside a URL/email
            found = [d for d in found if t.count(d) > covered.count(d)]
        if k == "port":
            found = [p for p in found if 1 <= int(p) <= 65535]
        if found:
            out[k] = Counter(x.rstrip(".,;:!") for x in found)
    return out

# ---------------- load ------------------------------------------------------
manifest = json.load(open(os.path.join(GT_DIR, "gt_manifest.json"), encoding="utf-8"))
gt_iocs = {}          # file -> {type: Counter}
for m in manifest:
    gt_iocs[m["file"]] = extract(norm(io.open(os.path.join(GT_DIR, m["file"]), encoding="utf-8").read()))

# GT inventory (metric reliability)
inv = Counter()
pages_with = 0
for f, d in gt_iocs.items():
    n = sum(sum(c.values()) for c in d.values())
    if n:
        pages_with += 1
    for k, c in d.items():
        inv[k] += sum(c.values())
total_gt = sum(inv.values())
print(f"GT IOC inventory: {total_gt} IOCs on {pages_with}/276 pages")
for k, v in inv.most_common():
    print(f"  {k:<8} {v}")

# ---------------- score models ---------------------------------------------
results = {}
for model in MODELS:
    matched = Counter(); total = Counter()
    hyp_total = 0; hyp_matched = 0
    for m in manifest:
        gt = gt_iocs[m["file"]]
        hp_path = os.path.join(HYP_ROOT, model, m["file"])
        hp_text = norm(io.open(hp_path, encoding="utf-8").read()) if os.path.exists(hp_path) else ""
        hp = extract(hp_text)
        for k, c in gt.items():
            for s, n in c.items():
                total[k] += n
                matched[k] += min(n, hp.get(k, Counter()).get(s, 1 if s in hp_text else 0))
        for k, c in hp.items():
            for s, n in c.items():
                hyp_total += n
                gt_text_has = s in norm(io.open(os.path.join(GT_DIR, m["file"]), encoding="utf-8").read())
                hyp_matched += n if (gt.get(k, Counter()).get(s) or gt_text_has) else 0
    rec = sum(matched.values()) / total_gt
    prec = hyp_matched / hyp_total if hyp_total else 1.0
    results[model] = dict(
        ioc_recall=round(rec, 4),
        ioc_precision=round(prec, 4),
        spurious_iocs=hyp_total - hyp_matched,
        recall_by_type={k: round(matched[k] / total[k], 4) for k in total},
    )

# ---------------- composite Security OCR Score ------------------------------
summ = json.load(open(os.path.join(EVAL_DIR, "model_summary.json"), encoding="utf-8"))
board = []
for model in MODELS:
    char_acc = 1.0 - summ[model]["overall"]["macro_cer_clip"]
    r = results[model]
    score = 0.5 * char_acc + 0.5 * r["ioc_recall"]
    board.append(dict(model=model, security_ocr_score=round(score, 4),
                      char_accuracy=round(char_acc, 4), **r,
                      sec_per_page=round(summ[model]["overall"]["mean_sec_page"], 1)))
board.sort(key=lambda x: -x["security_ocr_score"])
for i, b in enumerate(board):
    b["rank"] = i + 1

out = dict(
    formula="security_ocr_score = 0.5*(1 - clipped macro loose CER) + 0.5*IOC_recall (micro, exact match after digit/case normalization)",
    gt_ioc_inventory=dict(total=total_gt, pages_with_iocs=pages_with, by_type=dict(inv)),
    caveat=("IOC recall is computed over the ground-truth IOC inventory above; "
            "with this corpus size treat per-type numbers with few instances as indicative only. "
            "ioc_precision/spurious_iocs flag fabricated indicators, which recall cannot see."),
    leaderboard=board,
)
json.dump(out, open(os.path.join(EVAL_DIR, "leaderboard.json"), "w", encoding="utf-8"),
          ensure_ascii=False, indent=1)

print(f"\n{'rank':<5}{'model':<14}{'SecScore':>9}{'charAcc':>9}{'IOC-R':>8}{'IOC-P':>8}{'spurious':>9}{'s/page':>8}")
for b in board:
    print(f"{b['rank']:<5}{b['model']:<14}{b['security_ocr_score']:>9.3f}{b['char_accuracy']:>9.3f}"
          f"{b['ioc_recall']:>8.3f}{b['ioc_precision']:>8.3f}{b['spurious_iocs']:>9}{b['sec_per_page']:>8.1f}")
print("\nrecall by type:")
for b in board:
    print(f"  {b['model']:<14} " + "  ".join(f"{k}={v:.2f}" for k, v in sorted(b['recall_by_type'].items())))
print("\n-> kitab_eval_out/leaderboard.json")
