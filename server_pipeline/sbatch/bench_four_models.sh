#!/bin/bash
#SBATCH --job-name=ocr-bench
#SBATCH --output=logs/bench_%A_%a.out
#SBATCH --error=logs/bench_%A_%a.err
#SBATCH --array=0-3%4              # 4 models, all in parallel (normal account allows 4 concurrent jobs)
#SBATCH -p gpu-H200
#SBATCH -A H200
#SBATCH -q h200_qos
#SBATCH --gres=gpu:1
#SBATCH --cpus-per-task=8
#SBATCH --mem=96G
#SBATCH --time=16:00:00            # qwen36 needs ~10h on the 46 samples; limit is 3 days anyway

# ---------------------------------------------------------------------------
# Re-runs the 4-model benchmark over the 46 sample PDFs (one model per array task).
# Submit from /export/home/oalsumaitti/ocr-test :
#   sbatch server_pipeline/sbatch/bench_four_models.sh
# Outputs are drop-in compatible with kitab_eval.py / score_ocr.py locally.
# ---------------------------------------------------------------------------
set -euo pipefail

ROOT=/export/home/oalsumaitti/ocr-test
PDF_DIR=$ROOT/pdfs/benchmark_samples
OUT_ROOT=$ROOT/results/bench_rerun
PIPE=$ROOT/server_pipeline

MODELS=(ain gemma4_26b gemma4_31b qwen36)
MODEL=${MODELS[$SLURM_ARRAY_TASK_ID]}

mkdir -p "$ROOT/logs" "$OUT_ROOT/$MODEL"

# --- environment ------------------------------------------------------------
module load cuda12.6/toolkit/12.6.2
source $ROOT/venv/bin/activate
export HF_HOME=$ROOT/hf_cache
# 403 on gated models: HF reads HUGGING_FACE_HUB_TOKEN, not only HF_TOKEN
export HUGGING_FACE_HUB_TOKEN=${HUGGING_FACE_HUB_TOKEN:-${HF_TOKEN:-}}
export TOKENIZERS_PARALLELISM=false
export PYTHONUNBUFFERED=1

echo "=== node $(hostname) | model $MODEL | $(date) ==="
nvidia-smi --query-gpu=name,memory.total --format=csv

python $PIPE/scripts/run_ocr.py \
    --model  "$MODEL" \
    --pdf-dir "$PDF_DIR" \
    --out    "$OUT_ROOT/$MODEL"

# integrity gate: job fails loudly if output is incomplete
python $PIPE/scripts/check_results.py \
    --results "$OUT_ROOT/$MODEL" \
    --pdf-dir "$PDF_DIR"

echo "=== done $MODEL | $(date) ==="
