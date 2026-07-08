# Evaluation

Three CPU-only scorers. They read the model outputs in `../results/model_outputs/` and
the ground truth in `../benchmark/ground_truth/`, and reproduce every published number.

```bash
pip install -r ../requirements.txt
python kitab_eval.py      # step 1 — writes ../results/scores/
python ioc_eval.py        # step 2 — needs step 1's output
```

## `kitab_eval.py` — the main multi-axis scorer

KITAB-Bench-style metrics, computed per page and aggregated:

- **CER / WER** — strict and Arabic-normalized ("loose": strip diacritics/tatweel,
  unify alef/taa-marbuta/ya, unify digits). Same normalization as `score_ocr.py`.
- **chrF** — character 1–6-gram F-score (robust to long insertions).
- **Table cell-F1** — TEDS approximation: markdown cells matched as multisets.
- **Hallucination** — blank pages scored as probes (any output = failure).
- **Robustness** — scanned subset (17/37/39), p90 CER, runaway-length & loop detection.
- **Decision aids** — page-level win-rate matrix + 10,000-sample paired bootstrap.

Outputs → `../results/scores/`: `per_page_scores.csv`, `model_summary.json`, and
`hyp_pages/<model>/` (per-page splits, `score_ocr.py`-compatible; git-ignored, regenerated).

## `ioc_eval.py` — security IOC layer

Exact-match **recall and precision** on CVEs, IPv4, URLs, domains, emails, hashes and
ports (after digit/case normalization), plus a composite **Security OCR Score**
(`½ char-accuracy + ½ IOC-recall`). Outputs → `../results/scores/leaderboard.json`.
Caveat: only 91 IOCs on 34 pages, so it is directional, not load-bearing.

## `score_ocr.py` — the original simple scorer

Plain CER/WER (jiwer) on a folder of per-page hypotheses. Handy for a single model:

```bash
python score_ocr.py ../results/scores/hyp_pages/gemma4_31b --loose
```

## CLI overrides

All scripts default to the repo layout but accept overrides so they also run on the
cluster:

```bash
python kitab_eval.py --results /path/to/outputs --gt /path/to/gt --out /path/to/scores
python ioc_eval.py   --gt /path/to/gt --eval-dir /path/to/scores
```
