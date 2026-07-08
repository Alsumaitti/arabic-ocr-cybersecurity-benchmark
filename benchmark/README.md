# Benchmark dataset

The 276-page test set: 46 Arabic cybersecurity books, each distilled to its 6 most
informative pages. See [../docs/sample_selection.md](../docs/sample_selection.md) for
the full selection methodology.

## Contents

| Path | What it is |
|------|-----------|
| `samples/*_sample.pdf` | 46 six-page PDFs (`0_sample.pdf` … `45_sample.pdf`), pages copied verbatim from the source books |
| `samples/manifest.csv` / `.json` | Per book: the 6 original page numbers + a content-type label per page |
| `ground_truth/{book}_p{slot}.txt` | 276 reference transcriptions (e.g. `21_p3.txt` = book 21, sample page 3) |
| `ground_truth/gt_manifest.csv` / `.json` | Per page: source book, original page, content type, status, char counts |

## Content-type distribution

| Type | Pages | What it tests |
|------|:---:|---|
| text (body + fill) | 208 | core Arabic reading accuracy |
| image / figure | 33 | figures, diagrams, screenshots |
| table | 25 | row/column structure |
| empty | 6 | hallucination resistance |
| formula | 4 | equations / technical math |

## ⚠️ How the ground truth was made (important)

The reference text was **transcribed by Claude Opus 4.8** from high-resolution page
renders and given a **light human review** before being accepted — not hand-written
or line-by-line validated, because there was no time to do so for 276 pages. Treat it
as a **strong-model reference, not gold human truth**. Raw PDF text layers were
genuinely broken (reversed ligatures, kashida bytes, fused words, scanned pages),
which is *why* a model transcription was used instead of a raw text dump. See the
honesty note in [../docs/report_en.md](../docs/report_en.md) §6.

## Notes

- Page numbers in the manifests are 1-based PDF positions in the original books.
- Books 17, 37, 39 are scanned / broken-encoding — the intentional hard subset.
- The first and last 12% of every book were excluded from sampling (covers, ToC, indexes).
