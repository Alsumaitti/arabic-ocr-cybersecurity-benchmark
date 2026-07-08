# Results

## `model_outputs/` — raw OCR (the inputs to scoring)

One subfolder per model (`ain`, `gemma4_26b`, `gemma4_31b`, `qwen36`). For each book:

- `{book}_sample.txt` — all 6 pages, joined with `=== Page N ===` markers
- `{book}_sample_stats.json` — per-page seconds, generated tokens, char count
- `_model_summary.json` — per-model run summary
- `overall_summary.json` (top level) — timing across all models

These are the actual H200 outputs and the fixed input contract every scorer reads.
`qwen36_clean` (chain-of-thought stripped after `</think>`) is derived on the fly by
`kitab_eval.py`; it is not a separate folder.

## `scores/` — published numbers

| File | Contents |
|------|----------|
| `per_page_scores.csv` | every metric for every (model × page) — 1,380 rows |
| `model_summary.json` | all aggregates: per-type, scanned subset, win-rate matrix, bootstrap |
| `leaderboard.json` | security IOC leaderboard + IOC inventory |

Regenerate all of the above with `python ../evaluation/kitab_eval.py` then
`python ../evaluation/ioc_eval.py`. The regenerated `scores/hyp_pages/` (per-page
splits) is git-ignored because it is derived.

## Headline numbers

`gemma4_31b` wins: core-text CER **16.3%**, table cell-F1 **69.3%**, Security OCR Score
**0.706**. `gemma4_26b` ties on character accuracy (bootstrap CI crosses zero) but loses
decisively on table structure (11–4 head-to-head). Full interpretation in
[../docs/report_en.md](../docs/report_en.md).
