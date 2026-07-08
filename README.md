# Arabic Cybersecurity OCR Benchmark

Choosing the best OCR / vision-language model for extracting text from **Arabic
cybersecurity books**, evaluated with a multi-axis methodology inspired by
[KITAB-Bench](https://mbzuai-oryx.github.io/KITAB-Bench/).

![status](https://img.shields.io/badge/status-complete-02C39A)
![license](https://img.shields.io/badge/license-MIT-1C7293)
![python](https://img.shields.io/badge/python-3.10%2B-0F4C63)
![models](https://img.shields.io/badge/models-4%20VLMs-534AB7)
![pages](https://img.shields.io/badge/benchmark-276%20pages-BA7517)

---

## TL;DR — the winner

**`gemma4_31b`** is the recommended production engine: best core-text accuracy,
decisively best table structure, and the safest failure modes. Full reasoning in
[docs/report_en.md](docs/report_en.md).

| # | Model | Core-text CER ↓ | chrF ↑ | Table cell-F1 ↑ | Security score ↑ | s/page |
|---|-------|:---:|:---:|:---:|:---:|:---:|
| 🏆 | **gemma4_31b** | **16.3%** | **89.3%** | **69.3%** | **0.706** | 42.1 |
| 2 | gemma4_26b | 16.9% | 88.1% | 52.1% | 0.647 | 39.7 |
| 3 | qwen36 (cleaned) | 45.0% | 57.3% | 0.5% | 0.643 | 124.8 |
| 4 | ain | 44.3% | 61.5% | 0.0% | 0.454 | 14.7 |
| — | qwen36 (raw) | 99.8% | 49.1% | 2.3% | 0.409 | 124.8 |

<sub>Core-text = 208 body-text pages. CER/chrF Arabic-normalized. Full tables, per-type
breakdowns and significance tests in [`results/scores/`](results/scores) and the report.</sub>

> ### ⚠️  Note — read this first
> The 276 ground-truth pages were **transcribed by Claude Opus 4.8 and given a light
> human review**, then accepted — there was no time to hand-write or line-by-line
> validate 276 pages. So every score measures **agreement with a strong-model
> reference, not a gold human transcription**. This is the study's biggest validity
> caveat and it is stated openly throughout. The sampling and ground truth were also
> built **before** the KITAB-Bench paper was read; its metrics were retrofitted
> afterward — this is KITAB-*aligned* work, not a from-scratch replication.

---

## What this project is

A real, end-to-end model-selection study on one hard corpus: **46 Arabic
cybersecurity books (5,434 pages)** distilled to a **276-page benchmark**, run through
**four vision-language models on an NVIDIA H200**, and scored on six axes
(CER/WER, chrF, table structure, hallucination, robustness, efficiency) plus a
security-specific **IOC layer** (exact-match recall/precision on CVEs, IPs, hashes…).

- **Full English report** → [docs/report_en.md](docs/report_en.md)
- **التقرير الكامل بالعربية** → [docs/report_ar.md](docs/report_ar.md)
- **How the 6 pages per book were chosen** → [docs/sample_selection.md](docs/sample_selection.md)
- **Everything that went wrong (challenge log)** → [docs/log_of_challenges.md](docs/log_of_challenges.md)
- **Slide decks** (journey + results) → [docs/slides/](docs/slides)

---

## Repository layout

```
.
├── benchmark/            The dataset
│   ├── samples/          46 six-page sample PDFs + manifest
│   └── ground_truth/     276 reference .txt + gt_manifest
├── evaluation/           The scorers (kitab_eval.py, ioc_eval.py, score_ocr.py)
├── results/
│   ├── model_outputs/    Raw OCR output of all 4 models (per book + stats)
│   └── scores/           Published scores: per_page_scores.csv, model_summary.json, leaderboard.json
├── docs/                 Reports (EN/AR), sample-selection write-up, challenge log, slides
├── server_pipeline/      SLURM package to (re)run OCR + evaluation on the Panther/H200 cluster
├── experiment_archive/   Real Panther artifacts: the OCR runner + prompt, early attempts, evidence logs
├── experiments/          Follow-up experiments (see Markdown follow-up below)
└── tools/                Source scripts that generate the slide decks
```

---

## Quickstart — reproduce the scores

Scoring is CPU-only (no GPU needed); it re-derives every published number from the
model outputs already in this repo.

```bash
pip install -r requirements.txt

# 1) KITAB-style metrics (CER/WER/chrF/table-F1/hallucination/robustness)
python evaluation/kitab_eval.py
#    -> writes results/scores/{per_page_scores.csv, model_summary.json, hyp_pages/}

# 2) security IOC leaderboard (needs step 1's output)
python evaluation/ioc_eval.py
#    -> writes results/scores/leaderboard.json

# optional: the original simple CER/WER scorer on one model's pages
python evaluation/score_ocr.py results/scores/hyp_pages/gemma4_31b --loose
```

All three scripts accept `--help` and CLI overrides (`--results`, `--gt`, `--out`,
`--eval-dir`, `--models`) so they run unchanged on the cluster too.

---

## Re-running OCR on the cluster (optional)

You do **not** need a GPU to reproduce the scores — the model outputs ship in
`results/model_outputs/`. If you want to regenerate them (or run the full 5,434-page
production job), the `server_pipeline/` package has ready SLURM scripts for a
Panther/H200 environment with anti-repetition guards, resume, and integrity checks.
See [server_pipeline/GUIDE.md](server_pipeline/GUIDE.md) and
[server_pipeline/EVAL_GUIDE.md](server_pipeline/EVAL_GUIDE.md).

---

## Follow-up: Markdown output experiment

A lightweight **visual sanity check** that patches two honest gaps in the main study —
there was **no real human ground truth**, and outputs were scored as **flat text, not
Markdown**, so document structure was invisible to the metrics. Instead of trusting a
number against an imperfect reference, this experiment re-runs the same 4 models on an
11-page mixed sample with a **Markdown-forcing prompt**, then places each **original
PDF page next to the model's rendered Markdown** for direct eye comparison — no ground
truth required.

It serves the core mission (choosing the OCR model for Arabic cybersecurity books): it
confirms **visually** that `gemma4_31b` rebuilds page structure — especially tables —
faithfully, reinforcing the earlier choice rather than resting on CER alone. If
Markdown clearly helps, the production prompt should switch to it before the full run.

→ [experiments/markdown_followup/](experiments/markdown_followup) ·
deck: [docs/slides/markdown_compare.pptx](docs/slides/markdown_compare.pptx)

## Methodology in one paragraph

Each book is distilled to its **6 most informative pages** (heuristics propose
candidates by content type; a vision LLM judge confirms them), giving a text-dominant
276-page set that still exercises tables, figures, formulas and blank pages. Every
model gets the **same prompt, 320-DPI renders and 4,096-token cap**. Outputs are split
per page (`=== Page N ===`), Arabic-normalized, and scored against the ground truth on
each axis independently — because a single average hides how unevenly OCR quality
collapses across content types. Two models tie on raw character accuracy, so the
decision moves to tables, a page-level win-rate matrix, a paired bootstrap test, and
the security IOC layer.

## Key limitations (stated openly)

- **Model-made ground truth** — Opus 4.8 transcription, lightly reviewed (see honesty note).
- **One corpus** — 276 pages of one library; generalization is unproven.
- **Structure-blind** — plain-text GT + a text-only prompt, so document hierarchy is
  untested and table-F1 is partly a prompt artifact. Partly addressed by the
  [Markdown follow-up](experiments/markdown_followup) (visual, no ground truth needed).
- **Thin tails / single run** — 4 formula pages, 2 blank probes, 2 hashes, 1 CVE; one
  deterministic pass per model; TEDS is approximated on plain text.

---

## Citation

```bibtex
@misc{alsumaitti2026arabicocr,
  author = {Alsumaitti, Osamah},
  title  = {Arabic Cybersecurity OCR Benchmark},
  year   = {2026},
  note   = {A KITAB-Bench-aligned model-selection study on Arabic cybersecurity documents}
}
```

## License

Code and documentation are released under the [MIT License](LICENSE). The sample PDFs
are excerpts of third-party books included for research/benchmarking; rights remain
with their original authors.
