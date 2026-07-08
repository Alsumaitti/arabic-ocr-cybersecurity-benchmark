#!/bin/bash
#SBATCH --job-name=ocr-prod-g31b
#SBATCH --output=logs/prod_%A_%a.out
#SBATCH --error=logs/prod_%A_%a.err
#SBATCH --array=0-45%4             # one book per task; 4 in parallel = normal-account limit
#SBATCH -p gpu-H200
#SBATCH -A H200
#SBATCH -q h200_qos
#SBATCH --gres=gpu:1
#SBATCH --cpus-per-task=8
#SBATCH --mem=96G
#SBATCH --time=12:00:00            # biggest book (786 p x ~42 s) ~ 9.2h -> 12h is safe

# ---------------------------------------------------------------------------
# PRODUCTION RUN: gemma4_31b over the FULL 46 books (5,434 pages).
#   ~64 GPU-hours total -> ~16-18h wall-clock at 4 GPUs in parallel.
# Per-book array tasks + per-PDF resume => a killed/timed-out/preempted task
# is simply resubmitted and continues where it stopped:
#   sbatch --array=17,39 server_pipeline/sbatch/prod_gemma31b.sh
#
# Faster option (>4 GPUs, PREEMPTABLE after a 6h grace period):
#   change the two lines to:  -A H200_16GPUs  /  -q h200_qos_16_gpus
#   Safe here because resume makes preemption lose at most one book's progress.
# ---------------------------------------------------------------------------
set -euo pipefail

ROOT=/export/home/oalsumaitti/ocr-test
BOOKS_DIR=$ROOT/pdfs/books          # full originals: 0.pdf ... 45.pdf
OUT=$ROOT/results/prod/gemma4_31b
PIPE=$ROOT/server_pipeline

mkdir -p "$ROOT/logs" "$OUT"

module load cuda12.6/toolkit/12.6.2
source $ROOT/venv/bin/activate
export HF_HOME=$ROOT/hf_cache
export HUGGING_FACE_HUB_TOKEN=${HUGGING_FACE_HUB_TOKEN:-${HF_TOKEN:-}}
export TOKENIZERS_PARALLELISM=false
export PYTHONUNBUFFERED=1

BOOK=$SLURM_ARRAY_TASK_ID.pdf
echo "=== node $(hostname) | book $BOOK | $(date) ==="

python $PIPE/scripts/run_ocr.py \
    --model  gemma4_31b \
    --pdf    "$BOOKS_DIR/$BOOK" \
    --out    "$OUT" \
    --postfilter

echo "=== done $BOOK | $(date) ==="

# After ALL array tasks finish, run once (salloc or a cpu-all job, NOT the login node):
#   python $PIPE/scripts/check_results.py --results $OUT --pdf-dir $BOOKS_DIR --review-sample 20
