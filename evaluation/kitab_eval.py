"""
KITAB-Bench-style evaluation of 4 OCR/VLM models on the Arabic cybersecurity
benchmark set (46 books x 6 pages = 276 pages).

Methodology mapped from KITAB-Bench (Heakl et al., 2025):
  - Core OCR fidelity ......... CER / WER (strict + Arabic-normalized "loose")
  - Text similarity ........... chrF (character n-gram F-score, as used in
                                KITAB's PDF-to-Markdown MARS metric family)
  - Table recognition ......... cell-level F1 on markdown-serialized tables
                                (TEDS-approximation on plain-text GT)
  - Hallucination resistance .. EMPTY pages: any non-empty output = failure
                                (KITAB reports VLM hallucination on blank inputs)
  - Robustness ................ scanned/degraded subset (books 17, 37, 39),
                                worst-decile CER (p90), length-ratio runaway
                                & repetition-loop detection
  - Efficiency ................ seconds/page on H200 from run stats
  - Decision .................. page-level win-rate matrix + paired bootstrap
                                significance test between the top two models

Outputs -> kitab_eval_out/
  per_page_scores.csv        all metrics for every (model, page)
  model_summary.json         aggregate numbers used in the report
  hyp_pages/<model>/         per-page hypothesis files (score_ocr.py compatible)
"""
import sys, os, io, re, json, csv, unicodedata, random, argparse
from collections import Counter, defaultdict

sys.stdout.reconfigure(encoding="utf-8")

BASE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(BASE)   # repo root (script lives in evaluation/)
_ap = argparse.ArgumentParser(description=__doc__)
_ap.add_argument("--results", default=os.path.join(ROOT, "results", "model_outputs"),
                 help="dir with one subfolder per model containing {book}_sample.txt")
_ap.add_argument("--gt", default=os.path.join(ROOT, "benchmark", "ground_truth"))
_ap.add_argument("--out", default=os.path.join(ROOT, "results", "scores"))
_ap.add_argument("--models", default="ain,gemma4_26b,gemma4_31b,qwen36")
_A = _ap.parse_args()
RES, GT_DIR, OUT = _A.results, _A.gt, _A.out
MODELS = [m.strip() for m in _A.models.split(",") if m.strip()]
PAGE_RE = re.compile(r"^=== Page (\d+) ===\s*$", re.M)

import jiwer

# ---------------- normalization (identical to score_ocr.py) ----------------
TASHKEEL = re.compile(r"[ً-ٰۖ-ۭ]")
PUNCT = re.compile(r"[^\w\s؀-ۿ]")
AR_DIGITS = str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789")

def norm(t, loose=False):
    t = unicodedata.normalize("NFKC", t)
    t = t.replace("ـ", "")  # tatweel
    if loose:
        t = TASHKEEL.sub("", t)
        t = re.sub("[أإآٱ]", "ا", t)
        t = t.replace("ة", "ه").replace("ى", "ي")
        t = t.translate(AR_DIGITS)
        t = PUNCT.sub(" ", t)
    t = re.sub(r"\s+", " ", t).strip()
    return t

# ---------------- chrF (sacrebleu-style: char 1..6-grams, beta=2) ----------
def chrf(ref, hyp, max_n=6, beta=2.0):
    ref = re.sub(r"\s+", "", ref)
    hyp = re.sub(r"\s+", "", hyp)
    if not ref and not hyp:
        return 1.0
    if not ref or not hyp:
        return 0.0
    scores = []
    for n in range(1, max_n + 1):
        rg = Counter(ref[i:i+n] for i in range(len(ref) - n + 1))
        hg = Counter(hyp[i:i+n] for i in range(len(hyp) - n + 1))
        if not rg or not hg:
            continue
        overlap = sum((rg & hg).values())
        prec = overlap / max(sum(hg.values()), 1)
        rec = overlap / max(sum(rg.values()), 1)
        if prec + rec == 0:
            scores.append(0.0)
        else:
            scores.append((1 + beta**2) * prec * rec / (beta**2 * prec + rec))
    return sum(scores) / len(scores) if scores else 0.0

# ---------------- table cell F1 (TEDS approximation on markdown rows) ------
def table_cells(t):
    cells = []
    for line in t.splitlines():
        if "|" in line:
            for c in line.split("|"):
                c = norm(c, loose=True)
                if c and not re.fullmatch(r"[-: ]+", c):
                    cells.append(c)
    return Counter(cells)

def table_f1(gt, hyp):
    g, h = table_cells(gt), table_cells(hyp)
    if not g:
        return None
    if not h:
        # model produced no pipe-delimited structure; fall back to matching
        # GT cells against raw hyp text so content-without-structure gets
        # partial credit at 0 structure? No: cell F1 measures structured cells.
        h = Counter()
    overlap = sum((g & h).values())
    prec = overlap / sum(h.values()) if h else 0.0
    rec = overlap / sum(g.values())
    return 0.0 if prec + rec == 0 else 2 * prec * rec / (prec + rec)

# ---------------- repetition-loop detector ----------------------------------
def repetition_score(t):
    words = t.split()
    if len(words) < 20:
        return 0.0
    n = 5
    grams = [tuple(words[i:i+n]) for i in range(len(words) - n + 1)]
    return 1.0 - len(set(grams)) / len(grams)

# ---------------- load ------------------------------------------------------
manifest = json.load(open(os.path.join(GT_DIR, "gt_manifest.json"), encoding="utf-8"))
gt_texts = {m["file"]: io.open(os.path.join(GT_DIR, m["file"]), encoding="utf-8").read()
            for m in manifest}

# per-page timing from each model's *_sample_stats.json
page_secs = {}   # (model, book, slot) -> seconds
for model in MODELS:
    for f in os.listdir(os.path.join(RES, model)):
        if f.endswith("_stats.json") and not f.startswith("_"):
            book = int(f.split("_")[0])
            st = json.load(open(os.path.join(RES, model, f), encoding="utf-8"))
            for p in st.get("pages", []):
                page_secs[(model, book, p["page"])] = p.get("seconds")

# split sample txts into pages
hyps = {}        # (model, book, slot) -> text
for model in MODELS:
    d = os.path.join(RES, model)
    for f in os.listdir(d):
        if f.endswith("_sample.txt"):
            book = int(f.split("_")[0])
            txt = io.open(os.path.join(d, f), encoding="utf-8").read()
            parts = PAGE_RE.split(txt)
            # parts = [pre, '1', text1, '2', text2, ...]
            for i in range(1, len(parts) - 1, 2):
                hyps[(model, book, int(parts[i]))] = parts[i + 1].strip()

# derived model: qwen36 with chain-of-thought stripped (sensitivity analysis).
# 216/276 qwen pages contain a closing </think>; the transcription follows it.
# Pages without the tag were truncated mid-reasoning -> no usable answer.
qwen_clean_missing = 0
for (m, book, slot), t in list(hyps.items()):
    if m != "qwen36":
        continue
    if "</think>" in t:
        cleaned = t.rsplit("</think>", 1)[1].strip()
    else:
        cleaned = ""          # truncated during thinking: no final answer
        qwen_clean_missing += 1
    hyps[("qwen36_clean", book, slot)] = cleaned
    page_secs[("qwen36_clean", book, slot)] = page_secs.get((m, book, slot))
MODELS = MODELS + ["qwen36_clean"]

os.makedirs(OUT, exist_ok=True)
for model in MODELS:
    hd = os.path.join(OUT, "hyp_pages", model)
    os.makedirs(hd, exist_ok=True)
    for (m, book, slot), t in hyps.items():
        if m == model:
            io.open(os.path.join(hd, f"{book}_p{slot}.txt"), "w", encoding="utf-8").write(t)

# ---------------- score every page -----------------------------------------
rows = []
for m in manifest:
    gt = gt_texts[m["file"]]
    gt_strict, gt_loose = norm(gt), norm(gt, loose=True)
    for model in MODELS:
        hp = hyps.get((model, m["book"], m["slot"]), "")
        hp_strict, hp_loose = norm(hp), norm(hp, loose=True)
        r = dict(model=model, book=m["book"], slot=m["slot"], type=m["type"],
                 status=m["status"], ref_chars=len(gt_loose),
                 hyp_chars=len(hp_loose),
                 seconds=page_secs.get((model, m["book"], m["slot"])))
        if not gt_loose:  # EMPTY page -> hallucination check
            r.update(cer=None, wer=None, cer_loose=None, wer_loose=None,
                     chrf=None, table_f1=None,
                     halluc=int(bool(hp_loose)), halluc_chars=len(hp_loose),
                     len_ratio=None, rep=repetition_score(hp_loose))
        else:
            r.update(
                cer=jiwer.cer(gt_strict, hp_strict or " "),
                wer=jiwer.wer(gt_strict, hp_strict or " "),
                cer_loose=jiwer.cer(gt_loose, hp_loose or " "),
                wer_loose=jiwer.wer(gt_loose, hp_loose or " "),
                chrf=chrf(gt_loose, hp_loose),
                table_f1=table_f1(gt, hp) if m["type"] == "table" else None,
                halluc=None, halluc_chars=None,
                len_ratio=len(hp_loose) / len(gt_loose),
                rep=repetition_score(hp_loose))
        rows.append(r)

with open(os.path.join(OUT, "per_page_scores.csv"), "w", newline="", encoding="utf-8") as fp:
    w = csv.DictWriter(fp, fieldnames=list(rows[0].keys()))
    w.writeheader(); w.writerows(rows)

# ---------------- aggregates ------------------------------------------------
def agg(rs):
    scored = [r for r in rs if r["cer"] is not None]
    if not scored:
        return {}
    tot = sum(r["ref_chars"] for r in scored)
    cers = sorted(r["cer_loose"] for r in scored)
    clip = [min(c, 1.0) for c in cers]
    def mean(k): return sum(r[k] for r in scored) / len(scored)
    empt = [r for r in rs if r["halluc"] is not None]
    tabs = [r for r in rs if r["table_f1"] is not None]
    return dict(
        pages=len(scored),
        macro_cer=mean("cer"), macro_wer=mean("wer"),
        macro_cer_loose=mean("cer_loose"), macro_wer_loose=mean("wer_loose"),
        macro_cer_clip=sum(clip)/len(clip),
        macro_wer_clip=sum(min(r["wer_loose"], 1.0) for r in scored)/len(scored),
        micro_cer_loose=sum(r["cer_loose"] * r["ref_chars"] for r in scored) / tot,
        chrf=mean("chrf"),
        p50_cer=cers[len(cers)//2], p90_cer=cers[int(len(cers)*0.9)],
        pct_pages_cer_gt_50=100*sum(c > 0.5 for c in cers)/len(cers),
        len_ratio=mean("len_ratio"),
        runaway_pages=sum(1 for r in scored if r["len_ratio"] > 1.5),
        loop_pages=sum(1 for r in scored if r["rep"] > 0.5),
        table_f1=(sum(r["table_f1"] for r in tabs)/len(tabs)) if tabs else None,
        halluc_rate=(sum(r["halluc"] for r in empt)/len(empt)) if empt else None,
        halluc_chars=(sum(r["halluc_chars"] for r in empt)) if empt else None,
        mean_sec_page=(sum(r["seconds"] for r in scored if r["seconds"]) /
                       max(1, sum(1 for r in scored if r["seconds"]))),
    )

summary = {}
for model in MODELS:
    mrows = [r for r in rows if r["model"] == model]
    s = dict(overall=agg(mrows))
    s["by_type"] = {t: agg([r for r in mrows if r["type"] == t])
                    for t in ["normal_text", "text_extra", "table", "image", "formula"]}
    # headline axis: core body text only (208 pages), the collection's dominant content
    s["core_text"] = agg([r for r in mrows if r["type"] in ("normal_text", "text_extra")])
    s["scanned_subset"] = agg([r for r in mrows if r["book"] in (17, 37, 39)])
    s["born_digital"] = agg([r for r in mrows if r["book"] not in (17, 37, 39)])
    # timing across ALL sample runs (per _model_summary.json)
    msf = os.path.join(RES, model.replace("_clean", ""), "_model_summary.json")
    ms = json.load(open(msf, encoding="utf-8"))
    s["total_gpu_seconds"] = ms.get("total_seconds")
    summary[model] = s

summary["_qwen_clean_truncated_pages"] = qwen_clean_missing

# ---------------- page-level win-rate matrix (loose CER) --------------------
keys = [(m["book"], m["slot"]) for m in manifest
        if norm(gt_texts[m["file"]], loose=True)]
bym = {model: {(r["book"], r["slot"]): r["cer_loose"]
               for r in rows if r["model"] == model and r["cer_loose"] is not None}
       for model in MODELS}
win = {a: {b: 0 for b in MODELS} for a in MODELS}
for a in MODELS:
    for b in MODELS:
        if a == b: continue
        w = sum(1 for k in keys if bym[a][k] < bym[b][k] - 1e-9)
        win[a][b] = round(100 * w / len(keys), 1)
summary["_win_rate_pct"] = win

# ---------------- paired bootstrap: top-2 models on clipped loose CER -------
order = sorted((m for m in MODELS if not m.endswith("_clean")),
               key=lambda m: summary[m]["core_text"]["macro_cer_clip"])
a, b = order[0], order[1]

def paired_bootstrap(a, b, subset_keys):
    diffs = [min(bym[b][k], 1.0) - min(bym[a][k], 1.0) for k in subset_keys]
    random.seed(0)
    n = len(diffs)
    boots = []
    for _ in range(10000):
        s = sum(diffs[random.randrange(n)] for _ in range(n)) / n
        boots.append(s)
    boots.sort()
    return dict(better=a, versus=b, pages=n,
                mean_cer_gap=sum(diffs)/n,
                ci95=[boots[249], boots[9749]],
                p_better=sum(1 for x in boots if x > 0)/len(boots))

type_of = {(m["book"], m["slot"]): m["type"] for m in manifest}
core_keys = [k for k in keys if type_of[k] in ("normal_text", "text_extra")]
summary["_bootstrap_top2_all"] = paired_bootstrap(a, b, keys)
summary["_bootstrap_top2_core"] = paired_bootstrap(a, b, core_keys)

# ---------------- sensitivity: human_reviewed-only pages --------------------
for model in MODELS:
    mrows = [r for r in rows if r["model"] == model and r["status"] == "ok"]
    summary[model]["reviewed_only"] = agg(mrows)

json.dump(summary, open(os.path.join(OUT, "model_summary.json"), "w", encoding="utf-8"),
          ensure_ascii=False, indent=1)

# ---------------- console report -------------------------------------------
def pct(x): return f"{100*x:.1f}%" if x is not None else "  -  "
print(f"{'model':<14}{'CERc':>7}{'WERc':>7}{'chrF':>7}{'p50':>7}{'p90':>7}"
      f"{'>50%':>6}{'tblF1':>7}{'hall':>7}{'loops':>6}{'s/page':>8}")
for model in MODELS:
    o = summary[model]["overall"]
    print(f"{model:<14}{pct(o['macro_cer_clip']):>7}{pct(o['macro_wer_clip']):>7}"
          f"{pct(o['chrf']):>7}{pct(o['p50_cer']):>7}{pct(o['p90_cer']):>7}"
          f"{o['pct_pages_cer_gt_50']:>5.1f}{pct(o['table_f1']):>7}"
          f"{o['halluc_rate']*6:>6.0f}/6{o['loop_pages']:>5}"
          f"{o['mean_sec_page']:>8.1f}")
print("\ncore body text only (208 pages, clipped loose CER/WER + chrF):")
for model in MODELS:
    c = summary[model]["core_text"]
    print(f"  {model:<14} CER={pct(c['macro_cer_clip'])}  WER={pct(c['macro_wer_clip'])}"
          f"  chrF={pct(c['chrf'])}  p90={pct(c['p90_cer'])}")
print("\nby type (loose CER):")
for t in ["normal_text", "text_extra", "table", "image", "formula"]:
    line = f"  {t:<12}"
    for model in MODELS:
        v = summary[model]["by_type"][t].get("macro_cer_loose")
        line += f"{pct(v):>10}"
    print(line + "    (" + ", ".join(MODELS) + ")")
print("\nscanned/degraded books 17,37,39 (loose CER): " +
      ", ".join(f"{m}={pct(summary[m]['scanned_subset']['macro_cer_loose'])}" for m in MODELS))
print("born-digital only (loose CER):               " +
      ", ".join(f"{m}={pct(summary[m]['born_digital']['macro_cer_loose'])}" for m in MODELS))
print("\nwin-rate % (row beats col, loose CER):")
print("             " + "".join(f"{m:>12}" for m in MODELS))
for a2 in MODELS:
    print(f"{a2:<12} " + "".join(f"{win[a2][b2]:>12}" for b2 in MODELS))
for tag in ("_bootstrap_top2_all", "_bootstrap_top2_core"):
    bt = summary[tag]
    print(f"\nbootstrap {tag[15:]}: {bt['better']} vs {bt['versus']} ({bt['pages']} pages): "
          f"gap={pct(bt['mean_cer_gap'])} CI95=[{pct(bt['ci95'][0])},{pct(bt['ci95'][1])}] "
          f"P({bt['better']} better)={bt['p_better']:.4f}")
print("\nDone ->", OUT)
