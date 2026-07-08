#!/bin/bash
#SBATCH --job-name=ocr-eval
#SBATCH --output=logs/eval_%j.out
#SBATCH --error=logs/eval_%j.err
#SBATCH -p cpu-all
#SBATCH --cpus-per-task=4
#SBATCH --mem=16G
#SBATCH --time=00:30:00

# ---------------------------------------------------------------------------
# EVALUATION ONLY - no OCR, no GPU. Compares the EXISTING model outputs in
# results/all_samples_four_models/ against ground_truth/ and produces the full
# KITAB-style report + the security IOC leaderboard.
#
# cpu-all on purpose: the scoring is jiwer + regex (pure CPU, ~2-5 min);
# reserving an H200 for it would waste your 4-job H200 quota for nothing.
#
# Submit from /export/home/oalsumaitti/ocr-test :
#   sbatch server_pipeline/sbatch/eval_benchmark.sh
# ---------------------------------------------------------------------------
set -euo pipefail

ROOT=/export/home/oalsumaitti/ocr-test
RESULTS=$ROOT/results/all_samples_four_models    # the outputs you already have (no re-run)
GT=$ROOT/ground_truth
OUT=$ROOT/results/eval_out

mkdir -p "$ROOT/logs"
source $ROOT/venv/bin/activate
export PYTHONUNBUFFERED=1
python -c "import jiwer" 2>/dev/null || pip install --quiet jiwer

echo "=== KITAB-style evaluation | $(date) ==="
python $ROOT/kitab_eval.py --results "$RESULTS" --gt "$GT" --out "$OUT"

echo ""
echo "=== Security IOC layer | $(date) ==="
python $ROOT/ioc_eval.py --gt "$GT" --eval-dir "$OUT"

echo ""
echo "=== outputs ==="
ls -lh "$OUT"
echo "done -> $OUT  (per_page_scores.csv, model_summary.json, leaderboard.json, hyp_pages/)"
