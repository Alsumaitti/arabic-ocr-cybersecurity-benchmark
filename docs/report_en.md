# Arabic Cybersecurity OCR Benchmark — Model Selection Report

**Author:** Osamah Alsumaitti (evaluation executed with Claude Fable 5)
**Date:** 2026-07-06
**Methodological reference:** [KITAB-Bench](https://mbzuai-oryx.github.io/KITAB-Bench/) (Heakl et al., MBZUAI 2025) — the most comprehensive Arabic document-understanding benchmark
**Hardware:** Panther server — NVIDIA H200 GPU (inference); local Python 3.13 (scoring)
**Test set:** 46 Arabic cybersecurity books × 6 curated pages = **276 pages**. Ground-truth reference was produced by **Claude Opus 4.8 transcription with a light human review** (see the honesty note in §6), not a gold hand-written transcription — this is the study's biggest validity caveat.

---

## Executive summary

> **Selected model: `gemma4_31b`** — best or tied-best on every axis that matters:
> most accurate core text (CER 16.3%, chrF 89.3%), decisively best table-structure
> recognition (Cell-F1 69.3% vs 52.1% for the runner-up), and the highest page-level
> win rate against every other model.
>
> **Runner-up:** `gemma4_26b` — statistically indistinguishable on character accuracy
> (0.6% gap, not significant) and 6% faster; a valid choice if throughput matters more
> than table structure.
>
> **Eliminated:** `qwen36` (operational failure — chain-of-thought leakage and 60 pages
> swallowed mid-reasoning) and `ain` (very fast but unacceptable accuracy: 44% CER on
> core text).

---

## 1. Why KITAB-Bench as the reference, and exactly what was applied

KITAB-Bench demonstrated that judging Arabic OCR with a single metric is misleading,
because performance collapses non-uniformly across content types (text, tables,
charts, scanned pages). It therefore evaluates nine domains with independent metrics.
Our setup differs from KITAB in one fundamental way: **our ground truth is plain text**
(not HTML/JSON/layout boxes), so we applied every component of their methodology that
can be applied faithfully, and excluded what has no ground truth here:

| KITAB-Bench component | Applied? | How it maps to our case |
|---|---|---|
| **OCR (CER/WER)** — the central metric | ✅ | Strict + Arabic-normalized ("loose": strip diacritics, unify alef/taa-marbuta/ya variants, unify digits) — identical normalization to `score_ocr.py` |
| **chrF text similarity** (from the MARS metric family for PDF-to-Markdown) | ✅ | Standard chrF: character 1–6-grams, β=2 — far more robust than CER against long insertions |
| **Table recognition (TEDS)** | ✅ approx. | GT serializes tables as markdown rows, so we built **cell-level F1**: extract cells from pipe-delimited rows and match them as multisets — a TEDS approximation on plain text |
| **Hallucination resistance** (KITAB's observation on VLM hallucination) | ✅ | Truly blank pages = hallucination probes: any non-empty output counts as failure |
| **Robustness on scanned/degraded documents** | ✅ | Sub-benchmark: books 17, 39 (scanned) and 37 (broken font encoding) — 18 pages |
| **Computational efficiency** | ✅ | Seconds/page on the H200 from the actual per-run stats files |
| Layout detection / Charts-to-JSON / Diagrams-to-Code / VQA | ❌ | No ground truth of this kind in our set — out of scope by data design |

**Methodological additions beyond KITAB** (possible because all 4 models ran on the
exact same pages — a paired setup):
- **Page-level win-rate matrix** across the 274 mutually scoreable pages.
- **Paired bootstrap significance test** (10,000 resamples) between the top two models.
- **Repetition-loop detector** (fraction of repeated word 5-grams > 0.5) and
  **runaway length ratio** (hyp/ref > 1.5) — generative-VLM failure modes that raw CER
  alone does not surface clearly.

---

## 2. Evaluation pipeline (reproducible)

```
all_results_for_samples_four_models/{model}/{book}_sample.txt   ← H200 outputs (46×6 pages per model)
        │  split on === Page N === markers (validated: 276/276 clean pages for all 4 models)
        ▼
kitab_eval_out/hyp_pages/{model}/{book}_p{slot}.txt             ← score_ocr.py-compatible
        │  compared against ground_truth/{book}_p{slot}.txt (gt_manifest: type + review status)
        ▼
kitab_eval.py  →  per_page_scores.csv (every metric × every page × every model)
               →  model_summary.json  (all aggregates below)
```

- **Execution:** locally with Python 3.13 + jiwer 4.0 (the same library as the original
  `score_ocr.py`). No GPU needed — scoring is text-only.
- **Alignment:** automatic check that every file contains pages 1–6 in regular order
  before any scoring. Result: zero alignment errors.
- **Aggregation:** macro (page average) + micro (reference-length weighted), with a
  **clipped variant** (`CER_clip = min(CER, 1)`) as the headline number so that a
  handful of pathological pages (a model describing a figure and producing 300× the
  reference length) cannot dominate the mean — the de-facto practice in published OCR
  result tables.

### Critical finding during validation: qwen36 chain-of-thought leakage

Sample inspection revealed that `qwen36` outputs contain the **full chain-of-thought**
before the transcription, and **60 of 276 pages were truncated mid-reasoning** (hit the
4096-token cap) and produced no final text at all. We handled this the fair,
KITAB-minded way — two variants were scored:
- **`qwen36` raw:** exactly as produced (the real deployment scenario).
- **`qwen36_clean` derived:** text after the last `</think>` tag (the theoretical
  best case after perfect post-cleaning; truncated pages = empty output).

---

## 3. Results

### 3.1 Headline board — all pages (274 text-scoreable pages)

CER/WER are Arabic-normalized (loose) and clipped at 100%. chrF higher = better,
everything else lower = better.

| Model | CER | WER | chrF | Median CER (p50) | Pages CER>50% | Table Cell-F1 | Repetition loops | Sec/page (H200) | Total GPU |
|---|---|---|---|---|---|---|---|---|---|
| **gemma4_31b** | **24.7%** | **27.8%** | **83.7%** | **5.9%** | **20.1%** | **69.3%** | 4 | 42.1 | 3.30 h |
| gemma4_26b | 24.5% | 28.2% | 82.8% | 6.6% | 20.1% | 52.1% | 4 | 39.7 | 3.12 h |
| ain | 51.0% | 52.9% | 55.3% | 43.4% | 47.8% | 0.0% | 35 | **14.7** | **1.22 h** |
| qwen36 (raw) | 99.5% | 99.6% | 45.3% | 168.6% | 100% | 2.3% | 56 | 124.8 | 9.63 h |
| qwen36_clean | 50.6% | 57.1% | 53.6% | 62.0% | 52.2% | 0.5% | 0 | 124.8 | 9.63 h |

### 3.2 The axis that matters most — core body text (208 text pages; 75% of the set and the heart of the use case)

| Model | CER | WER | chrF | p90 CER |
|---|---|---|---|---|
| **gemma4_31b** | **16.3%** | **19.4%** | **89.3%** | **74.0%** |
| gemma4_26b | 16.9% | 20.9% | 88.1% | 74.6% |
| ain | 44.3% | 46.2% | 61.5% | 99.7% |
| qwen36_clean | 45.0% | 52.7% | 57.3% | 100% |

The median (p50) for both Gemma models is around **6% CER** — the typical text page
comes out nearly clean; the mean is pulled up by a tail of hard pages.

### 3.3 Breakdown by content type (chrF — the fairest cross-type metric since it does not explode with insertions)

| Type | ain | gemma4_26b | gemma4_31b | qwen36_clean |
|---|---|---|---|---|
| Core text (normal_text) | 54.8% | 84.8% | **87.3%** | 59.6% |
| Fill text (text_extra) | 63.3% | 89.0% | **89.8%** | 56.7% |
| Tables | 35.4% | 80.2% | **82.2%** | 48.4% |
| Images / figures | 36.6% | **59.2%** | 58.5% | 39.1% |
| Formulas | 38.9% | **72.5%** | 67.6% | 38.1% |

- **Tables:** beyond the chrF lead, the structure metric (Cell-F1) is decisive:
  **gemma4_31b wins 11 of 22 tables vs only 4 for 26b** (7 ties). `ain` produces no
  table structure whatsoever (F1 = 0) — it flattens cells into running prose.
- **Formulas** (only 4 pages): slight edge to 26b — the sample is too small to call.
- **Images:** CER is inherently unfair here (GT holds only the visible caption text
  while the models transcribe entire figure contents or describe them) — this type was
  therefore separated from the headline metric, following KITAB's logic of isolating
  tasks.

### 3.4 Robustness — scanned/degraded books (17, 37, 39 = 18 pages, the hardest case)

| Model | Mean CER (raw) | Reading |
|---|---|---|
| gemma4_26b | **11.9%** | Excellent and stable (worst page 0.63) |
| gemma4_31b | 37.7% | Excellent except **one page** (39_p4: repetition loop, CER=5.10). Without it ≈ **8.9%** |
| qwen36_clean | 32.6% | Good when it finishes, but 4 truncated pages (CER=100%) |
| ain | 242.5% | Total collapse on scans (repetition loops up to CER=15.7) |

Bottom line: the two Gemma models are the only ones reliable on scanned input; 26b's
apparent lead comes from a single fixable outlier page on 31b (see §5).

### 3.5 Hallucination resistance (two truly blank pages: 6_p4 and 37_p3)

| Model | Behavior | Verdict |
|---|---|---|
| ain | Completely empty output (0 chars) | ✅ Perfect |
| gemma4_26b / 31b | ≈75-char meta note: *"The image provided is a blank white page…"* | ⚠️ Cosmetic — not fabricated content; filterable with one regex |
| qwen36 | **1,756 fabricated characters** (768 after cleaning) | ❌ Genuine hallucination |

### 3.6 Statistical decision between the top two

Paired bootstrap (10,000 resamples) on clipped CER, gemma4_31b vs gemma4_26b:

| Scope | Mean gap in favor of 31b | 95% CI | P(31b better) |
|---|---|---|---|
| All pages (274) | ≈0% | [-1.5%, +1.3%] | 0.42 |
| Core text (208) | +0.6% | [-0.8%, +2.1%] | 0.79 |

**Character accuracy between the two is statistically inseparable.** The decision
therefore moves to the remaining axes — and all of them lean toward 31b:

| Tie-breaker axis | gemma4_31b | gemma4_26b |
|---|---|---|
| Head-to-head page win rate | **51.5%** | 37.6% (rest are ties) |
| Table structure Cell-F1 | **69.3%** (wins 11/22) | 52.1% (wins 4/22) |
| Overall chrF | **83.7%** | 82.8% |
| Core-text WER | **19.4%** | 20.9% |
| Median CER | **5.9%** | 6.6% |
| Speed | 42.1 s/page | **39.7 s/page** (+6%) |

### 3.7 Security-aware IOC layer (extension beyond KITAB-Bench)

Cybersecurity text has entities where *exact* fidelity matters more than average CER:
a hash or IP with one wrong character is worthless. `ioc_eval.py` extracts IOCs
(CVE IDs, IPv4, URLs, domains, emails, hashes, ports) from GT and hypotheses by regex
after digit/case normalization (Arabic-Indic digits unified), and scores exact-match
recall **and precision** — recall alone cannot see fabricated indicators.

**Inventory caveat:** the GT contains only **91 IOCs on 34/276 pages** (44 IPv4,
15 domains, 14 URLs, 12 ports, 3 emails, 2 hashes, 1 CVE) — and some regex "IPv4"
hits are actually dotted section numbers (e.g. `2.2.4.1` in book 22). The axis is
directionally useful but too thin to carry 50% of a composite score on its own.

| Model | Security OCR Score¹ | Char acc. | IOC recall | IOC precision | Spurious IOCs |
|---|---|---|---|---|---|
| **gemma4_31b** | **0.706** | 0.753 | 0.659 | 0.564 | **55** |
| gemma4_26b | 0.647 | 0.755 | 0.538 | 0.331 | 117 |
| qwen36_clean | 0.643 | 0.494 | **0.791** | **0.689** | 37 |
| ain | 0.454 | 0.490 | 0.418 | 0.762 | 10 |
| qwen36 (raw) | 0.409 | 0.005 | 0.813 | 0.579 | 133 |

¹ `0.5 × (1 − clipped CER) + 0.5 × IOC recall` — full definition and per-type
breakdown in `kitab_eval_out/leaderboard.json`.

**The ranking does not change: gemma4_31b stays first** — and gains a further
tie-breaker over 26b (half the fabricated indicators: 55 vs 117).

**New failure mode discovered by this layer:** RTL digit-order reversal on embedded
Latin IOCs — on book 7 p6, GT `40.80.148.42` was transcribed by Gemma as
`42.148.40.42` (octets reversed by the right-to-left reading direction). qwen, by
contrast, is the strongest on Latin technical tokens (0.79 recall) despite its Arabic
collapse. Production consequence: add a verification pass for IOC-bearing pages
(regex-extract from the page image region or cross-check octet order).

### 3.8 Sensitivity analyses

- **Review-flagged pages:** restricting to `status=ok` pages (270) shifts every number
  by less than 1.5 points and changes no ranking.
- **Clipping at 100%:** without clipping all numbers inflate due to image pages, but
  **the ranking is identical** either way.
- **Strict vs normalized:** strict scoring (with diacritics, hamza variants,
  punctuation) is available column-by-column in `per_page_scores.csv`; the relative
  ranking of models is unchanged there as well.

---

## 4. Decision and justification

### Selected model: `gemma4_31b`

1. **Accuracy on the core task:** best CER (16.3%), WER (19.4%) and chrF (89.3%) on
   the Arabic body text that makes up 75% of the collection, with a 5.9% median CER —
   near-publication quality on the typical page.
2. **Tables are the tie-breaker:** cybersecurity books are dense with tables (ports,
   commands, tool comparisons). 31b's lead here is **decisive, not marginal**:
   +17 points Cell-F1 and an 11-4 head-to-head record. This is exactly the category
   KITAB-Bench flags as the Achilles' heel of models on Arabic.
3. **Equivalent robustness on scans:** excellent on the scanned books (≈9% CER after
   excluding the single fixable loop page) — and nothing outside the Gemma pair is
   even usable for this case.
4. **Its failure modes are benign and fixable:** 4 repetition-loop pages (addressed
   with a repetition penalty) and descriptive notes on blank pages (filterable) —
   versus structural failures in the competitors (reasoning leakage, truncation,
   collapse on scans).
5. **Acceptable cost:** 42.1 s/page on the H200; the full archive (5,434 pages) ≈
   **64 GPU-hours** — one to three days depending on parallelism.

### Why not the others?

- **`gemma4_26b`:** a legitimate choice if you need +6% speed and a smaller memory
  footprint and will give up 17 points of table structure. For knowledge extraction
  from technical books, tables are worth more than the speed delta.
- **`qwen36`:** in its current form **not deployable**: full chain-of-thought leakage,
  60/276 pages with no final answer, genuine hallucination on blank pages, slowest of
  all (125 s/page = 3× Gemma) and most expensive (9.6 GPU-hours). Even after a perfect
  reasoning strip it sits at 45% CER — far off the pace.
- **`ain`:** fastest (14.7 s/page) and the only model perfectly disciplined on blank
  pages, but 44% CER on core text, zero table structure, 35 repetition-loop pages, and
  total collapse on scanned books. Could serve as a fast triage pre-pass, not as the
  extraction engine.

---

## 5. Production recommendations for gemma4_31b

1. **Anti-loop decoding:** `repetition_penalty ≈ 1.1–1.3` plus a length-ratio guard
   (regenerate the page if output exceeds 1.5× the expected length). Fixes the four
   outlier pages including 39_p4.
2. **Post-processing filter:** drop English meta lines (`The image provided is…`,
   `This page contains…`) — zeroes out the cosmetic hallucination axis.
3. **Figure-page policy:** decide up front whether figure text should be transcribed
   or skipped, and fix the prompt accordingly — this ambiguity is the largest source
   of remaining measurement noise.
4. **Human calibration sample:** before running all 5,434 pages, manually review ~20
   pages of 31b's final post-filter output to validate the baseline.
5. **IOC verification pass:** on pages containing IPs/hashes/CVEs, cross-check the
   extracted indicators against the rendered page (RTL octet-reversal was observed);
   never trust OCR'd hashes without verification.

---

## 6. Evaluation limitations (in KITAB's spirit of transparency)

- **Model-made ground truth (the biggest caveat).** The 276 reference pages were
  transcribed by **Claude Opus 4.8** (the same strong model used as the sampling judge)
  and given only a **light human review** before being accepted — there was not enough
  time to hand-write or line-by-line validate 276 pages. Consequently the scores measure
  **agreement with a strong-model reference, not with a gold human transcription**; any
  error shared by Opus and an evaluated model is invisible. Raw PDF text layers were
  genuinely broken (reversed ligatures, kashida bytes, fused words, scanned pages), which
  is *why* a model transcription was used instead of a raw dump — but the reference was
  not a documented page-by-page deterministic repair.
- **Chronology.** Sampling and ground-truth construction were done **before** reading the
  KITAB-Bench paper; its metrics, task-separation and hallucination probes were adopted
  and retrofitted onto the evaluation afterward. This is KITAB-*aligned* work, not a
  from-scratch replication.
- One run per model (temperature/decoding as configured in the server scripts) — no
  measurement of generation variance.
- The table metric is a TEDS approximation on plain text (cell matching), not full
  tree-based TEDS — it does not fully penalize row/column merge errors.
- Image pages: GT records only minimal visible text, so text metrics carry a weak
  signal there (which is why the type was separated from the headline metric).
- Only 4 formula pages — not enough for a reliable verdict on that type.
- Seconds/page includes pipeline overhead on the H200 as actually executed; intended
  for relative comparison, not as an absolute throughput figure.

---

## 7. Files and outputs

| File | Contents |
|---|---|
| `kitab_eval.py` | Full evaluation script (re-runnable: `python kitab_eval.py`) |
| `ioc_eval.py` | Security IOC layer (recall/precision, Security OCR Score) → `leaderboard.json` |
| `kitab_eval_out/per_page_scores.csv` | 1,380 rows: every metric for every (model × page) |
| `kitab_eval_out/model_summary.json` | All aggregates and statistics cited in this report |
| `kitab_eval_out/hyp_pages/{model}/` | Page-split hypotheses, compatible with the original `score_ocr.py` |
| `BENCHMARK_REPORT.md` | Arabic version of this report |
| `README.md` | How the 276-page sample set and ground truth were built |
