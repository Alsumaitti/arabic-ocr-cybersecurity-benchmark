# Experiment archive

Real artifacts from the Panther/H200 runs, kept as evidence behind the
[challenge log](../docs/log_of_challenges.md). This folder is **not** part of the
scoring pipeline — it documents what actually happened.

## The real OCR runner + prompt

- `run_four_models_ocr.py` — the exact script that produced `results/model_outputs/`.
  Its `MODEL_SPECS` block holds the **verbatim OCR prompt**, DPI (320), token cap
  (4,096) and per-model loader logic.
- `try_three_models.py` — the earlier 3-model attempt, including the dropped 5th
  contender **Baseer-Nakba**.

## Evidence

| File | What it proves |
|------|----------------|
| `evidence/sample0_baseer.txt` | Baseer-Nakba's multilingual-gibberish output → why it was dropped |
| `evidence/sample0_baseer.ERROR.txt` | its processor crash (broken `AutoProcessor`) |
| `evidence/sample0_gemma4.ERROR.txt` | `Gemma4Processor` import failure (transformers too old) |
| `evidence/sample0_ain.ERROR.txt` | AIN needing Torchvision (a video processor) just to OCR images |
| `logs/eval_341379.out` | cross-verification: cluster scores identical to the local run |
| `logs/bench_341352_0.out` | the anti-loop guard firing and retrying (`[guard] … -> retry`) |

See [../docs/log_of_challenges.md](../docs/log_of_challenges.md) for how each of these
maps to a lesson learned.
