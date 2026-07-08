# Arabic Cybersecurity OCR Benchmark — Sample Extraction Report

**Author:** Osamah Alsumaitti
**Date:** 2026-06-25
**Dataset:** 46 Arabic-language cybersecurity books (`0.pdf` … `45.pdf`)
**Deliverable:** 46 six-page sample PDFs + ground-truth manifest for OCR benchmarking

> **⚠️ Correction (2026-07-08).** This is the original sample-extraction report. Its
> §7 describes the ground truth as text-layer extraction with deterministic repairs and
> a small set of vision transcriptions — that framing **overclaims**. The accurate
> account: the 276 reference pages were **transcribed by Claude Opus 4.8 and given only
> a light human review** before being accepted, because there was no time to hand-write
> or validate 276 pages. Read §7 below as historical context; the authoritative,
> corrected version is the honesty note in [report_en.md](report_en.md) §6 and
> [log_of_challenges.md](log_of_challenges.md) C1. The page-*selection* method in §1–§6
> is accurate as written.

---

## 1. Objective

I needed a compact, representative benchmark set to evaluate OCR/document-understanding
models on **Arabic** documents. Running OCR over 5,434 full pages is wasteful and
redundant, so my goal was to distil each of the 46 books down to **the 6 most
informative pages** — a sample that exercises the full range of content an OCR model
must handle (dense body text, tables, figures, equations, and blank pages) while staying
small enough to label and score by hand.

The result is **276 carefully chosen pages (46 × 6)** with a per-page content label that
serves as the ground-truth key.

---

## 2. Dataset at a glance

| Metric | Value |
|---|---|
| Books | 46 |
| Total pages | 5,434 |
| Pages per book | 15 – 786 |
| Pages inside the analysis window (see §4) | 4,140 |
| Born-digital (text-layer) books | 44 |
| Scanned / image-only books | 2 (books 17, 39) |

---

## 3. Method overview — heuristics first, **LLM-as-judge** second

I deliberately did **not** rely on a single signal. I used a two-stage pipeline:

1. **Programmatic candidate generation** — cheap, deterministic features over every page
   to *propose* candidates for each content type.
2. **LLM-as-a-judge adjudication** — I rendered the proposed pages to images and had a
   large multimodal model **look at them and rule on each one**, because page geometry
   lies (e.g. `====` separators look like equations to a regex; flowchart boxes look like
   tables to a line-counter). The judge resolved exactly these ambiguities.

### LLM judge

| Item | Detail |
|---|---|
| Model | **Claude Opus 4.8** (`claude-opus-4-8`) — multimodal, used for visual page adjudication |
| Role | Inspect rendered page thumbnails and confirm/reject/relabel each candidate |
| Why a judge (not a generator) | The features find *candidates*; the model's vision is used only to **verify** them against the actual rendered page, which is far more reliable than trusting the PDF's internal structure |

This is the classic **LLM-as-a-judge** pattern: a fast retrieval/heuristic stage proposes,
and a stronger model evaluates the shortlist instead of scoring everything blindly.

### Tooling

- Python 3.13, **PyMuPDF 1.27** (text, image, vector and `find_tables` extraction; page rendering)
- **NumPy + Pillow** (pixel-level page analysis: ink density, white-space, line/solid-block detection)

---

## 4. Selection rules I enforced

- **Trim the edges.** I skipped the first 12% and last 12% of every book to avoid covers,
  tables of contents, prefaces, bibliographies and indexes. Only the middle **76%** is eligible.
- **No page reused** within a book — the 6 pages are always distinct.
- **Be conservative.** A page is only labelled as a special type (table/figure/formula/empty)
  when both the features *and* the visual judge agree. When in doubt, it is treated as text or dropped.

### Content taxonomy (the 5 "difficulty" types I look for)

| Type | What it tests | How a candidate is proposed | How the judge confirms |
|---|---|---|---|
| **NORMAL_TEXT** | Core Arabic text accuracy | High char/word density, no dominant image, no grid | Reads as clean body paragraphs |
| **TABLE** | Structured row/column parsing | `find_tables()` returns ≥3 rows × ≥2 cols | Visually a ruled data table (not a diagram/border) |
| **IMAGE** | Figures, diagrams, charts, screenshots | ≥30% raster coverage, large solid block, or vector chart | Figure dominates, text minimal |
| **FORMULA** | Equations / technical math | Real math symbols (mod, ^, ×, Greek, sub/superscript) — **not** plain `=` | Multiple genuine equations, not code/`====` |
| **EMPTY** | Hallucination resistance | Near-100% white, no ink | Blank or page-number-only when rendered |

### Building the 6-page sample

For each book I:

1. **Seed** the sample with the verified special-type pages, in priority order
   `NORMAL_TEXT → TABLE → IMAGE → FORMULA → EMPTY` (only the ones that exist).
2. **Fill** the remaining slots with clean body-text pages chosen by a **max-spread**
   rule — each new page is taken as far as possible (by page number) from the ones already
   picked, so I cover different chapters, layouts and fonts rather than six adjacent pages.
3. **Fallback for scanned/graphic books** (no text layer): pick the **densest readable
   pages** by pixel ink, so I never select a blank or pure-image page as "text".

This guarantees 6 pages for every book, biased toward the content types that actually exist
in that book.

---

## 5. What the LLM judge actually changed

The adjudication step was not cosmetic — it overturned a meaningful number of
feature-based guesses:

- **FORMULA:** demoted dozens of "equation" candidates that were really **terminal output
  (`====` separators), SQL injection (`OR 1=1`), Python/JS code, and `chmod` arithmetic**.
  Only **4 books** survived as containing genuine cryptographic equations (21, 32, 33, 36).
- **TABLE:** rejected pages that my line-counter flagged but were actually **flowcharts,
  pie/bar charts, decorative page borders, or hex dumps**; kept only real ruled grids
  (and recovered one raster table the structural detector missed, book 19 p40).
- **IMAGE:** swapped text-heavy "banner" pages for cleaner figure-dominated pages
  (e.g. preferring a near-text-free screenshot over a decorated header).
- **EMPTY:** restricted to truly blank / page-number-only pages, excluding chapter-divider
  pages that carry a visible title.

---

## 6. Outputs

```
benchmark_samples/
├── 0_sample.pdf  …  45_sample.pdf   # 46 files, exactly 6 pages each (extracted from originals,
│                                    # content pixel-identical — safe to OCR directly)
├── manifest.csv                     # book, source, sample file, page numbers + per-page type label
├── manifest.json                    # same, machine-readable
├── ground_truth/                    # reference Arabic text for every sample page (see §7)
│   ├── {book}_p{slot}.txt           # 276 files, e.g. 21_p3.txt = book 21, sample page 3
│   ├── gt_manifest.csv / .json      # per-page provenance: source, status, char counts
├── score_ocr.py                     # CER/WER scorer (jiwer) — run OCR, drop outputs in a
│                                    # folder with the same file names, then score
└── README.md                        # this report
```

- **Sample PDFs:** pages are copied verbatim from the source PDFs (no re-encoding), so the
  OCR sees exactly what the original page looks like.
- **Manifest:** for every sample it lists `p1…p6` (original page numbers) and
  `p1_type…p6_type` (the content label). Use the labels as the ground-truth category and the
  original page numbers for traceability back to the source book.

---

## 7. Ground truth for CER/WER scoring

Every one of the 276 sample pages has a reference-text file in `ground_truth/`, built to
be scored with the **jiwer** library (`score_ocr.py` is included). The reference text
preserves reading order and logical structure; ruled tables are serialized as
markdown-style rows so structure survives in a plain-text metric.

Extraction of a trustworthy reference was **not** a plain text-dump — the embedded text
layers had systematic defects that I detected and repaired:

| Defect found | Books affected | Repair |
|---|---|---|
| Reversed ligature pairs (`الأول` stored as `األول`, `عشر` as `عرش`) — the classic visual-order ToUnicode bug | 8, 20, 22, 32, 33, 36 and others | Deterministic glyph-geometry fix: zero-width letters stored before their full-width ligature partner are swapped back into logical order |
| Unmapped kashida glyphs leaking control bytes into words | 36 | Stripped; words re-join correctly |
| Missing space glyphs — words visually spaced but fused in the text layer | 21 | Word boundaries recovered from inter-glyph gaps (geometric respacing) |
| No text layer at all (scanned) | 17, 39 | Full-page **vision transcription** (see below) |
| Custom font encoding, text layer unrecoverable garbage | 37 | Full-page **vision transcription** |
| Legible text inside a raster figure with empty text layer | 6 (code screenshot) | Vision transcription |

**Vision transcriptions (18 pages)** were produced with the multimodal LLM judge
(Claude Opus 4.8) reading high-resolution page renders, and are tagged
`source=vision_draft`, `status=review` in `gt_manifest.csv` — they should get a human
proofread before being treated as gold. Everything else is `text_layer` /
`text_layer_geo` with `status=ok` or `review`.

**Scoring:**

```
# run your OCR over the 46 sample PDFs, write one UTF-8 txt per page
# named {book}_p{slot}.txt into some folder, then:
python score_ocr.py <hypothesis_dir>            # strict fidelity
python score_ocr.py <hypothesis_dir> --loose    # Arabic-normalized (no tashkeel,
                                                # unified alef/taa/ya, no punctuation)
```

The scorer reports per-page CER/WER, per-content-type breakdown, macro (page-average)
and micro (character-weighted) aggregates, and writes `scores.csv`. EMPTY pages are
scored as **hallucination checks**: any non-empty OCR output on them counts as failure.

---


## 8. Results

**276 sample pages** across the 46 books. Content-type distribution:

| Type | Pages | Books containing it |
|---|---|---|
| Text (primary + fill) | 208 | 46 |
| Image / figure / chart | 33 | 33 |
| Table | 25 | 25 |
| Empty | 6 | 6 |
| Formula | 4 | 4 |

**Interpretation.** This collection is overwhelmingly practical, code- and prose-heavy
security material. Genuine **tables (25 books)** and **figures (33 books)** are common, but
**equation pages are rare (4 books)** and **blank pages rarer still (6 books)** — which is
why the sample is text-dominant by design. Every book still contributes 6 pages; text-only
books (e.g. 0, 2, 3, 4, 10, 30) are sampled with six well-spread body-text pages, which is
the correct behaviour for measuring core Arabic OCR accuracy on those titles.

---

## 9. Notes & limitations

- The 12%/88% trim means front/back matter is intentionally excluded; the benchmark measures
  performance on **body content**, not covers or indexes.
- Books 17 and 39 are scanned; their "text" pages are page images, which is exactly the
  hard case I want an OCR engine to be scored on.
- Page numbers in the manifest are **1-based PDF page positions** in the original files, not
  the printed page numbers (which carry a front-matter offset).
- "Formula" is deliberately strict: a page qualifies only if it shows multiple real
  mathematical equations, not inline symbols or source code.
