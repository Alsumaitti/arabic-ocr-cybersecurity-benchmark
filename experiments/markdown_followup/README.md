# Follow-up experiment — Markdown output

A quick, deliberately lightweight follow-up to the main benchmark. **Not** a new
scored benchmark — a **visual sanity check** to address two known weaknesses of the
main study and to double-check the `gemma4_31b` choice from a different angle.

## Why this exists (the honest gap it patches)

The main benchmark has two limitations it never hid:

1. **No real human ground truth** — the 276 reference pages were transcribed by
   Claude Opus 4.8 with only a light review, so CER/WER measure agreement with a
   strong model, not gold truth.
2. **Plain-text outputs** — models were asked for flat text and scored as `.txt`, so
   **document structure (headings, lists, tables) was invisible** to the metrics, and
   `table-F1` was partly a prompt artifact.

This experiment sidesteps both: instead of trusting a number against an imperfect
reference, it puts the **original page image next to the model's rendered Markdown**
and lets a human judge structure fidelity directly — no ground truth required.

## What was run

- **Same** 4 models, same pipeline as the main run (320 DPI, 4,096 tokens, greedy,
  the loop/runaway guards), on one **11-page mixed sample** (`sample.pdf`) chosen to
  carry different scenarios (dense body text, multi-column tables, headers, lists).
- **Different prompt**: `run_ocr_md.py` uses `MD_PROMPT`, which explicitly asks for
  Markdown — `#`/`##` headings, `-`/`1.` lists, GitHub-flavored `|` tables, fenced code
  blocks — instead of collapsing everything into flat lines.

## Contents

| Path | What it is |
|------|-----------|
| `run_ocr_md.py` | the Markdown-prompt OCR runner (holds the exact `MD_PROMPT`) |
| `check_results.py` | output integrity checker |
| `sample.pdf` | the 11-page mixed test document |
| `outputs/<model>/sample.md` | each model's Markdown output (pages split by `=== Page N ===`) |
| `outputs/<model>/sample_stats.json` | per-page seconds / tokens / chars (+ the prompt) |
| `../../docs/slides/markdown_compare.pptx` | **the deliverable**: page-by-page PDF-vs-Markdown side-by-side, all 11 pages × 4 models, for eye comparison |

## How to read it

Open [`markdown_compare.pptx`](../../docs/slides/markdown_compare.pptx): slide 1 is the
prompt, then each model gets 11 slides — **original PDF page on the left, rendered
Markdown on the right**. No scores, no commentary; the comparison is meant to be made
by eye.

## What it serves

The core mission was always **choosing the right OCR model for Arabic cybersecurity
books**. This follow-up supports that decision: it confirms — visually, without relying
on the model-made ground truth — that `gemma4_31b` reconstructs page structure
(especially tables) faithfully when asked for Markdown, reinforcing the earlier choice
rather than resting on CER alone. If the Markdown format clearly helps, the production
prompt should switch from flat text to Markdown before the full 5,434-page run.
