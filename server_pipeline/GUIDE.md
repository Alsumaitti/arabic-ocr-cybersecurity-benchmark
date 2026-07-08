# دليل التشغيل الكامل على Panther (QCRI) — sbatch + سكربتات + فحص النتائج

مكتوب على **بيئتك الفعلية**: حساب `oalsumaitti`، partition ‏`gpu-H200` (H200 ‏141GB)، حساب `H200` مع `h200_qos`، حد 4 مهام متزامنة و3 أيام للمهمة، venv (لا conda)، والمشروع في `/export/home/oalsumaitti/ocr-test/`.

الدورة الكاملة: تجهيز → بنشمارك (4 نماذج × 46 عينة) → فحص السلامة → تقييم محلي → إنتاج `gemma4_31b` على 5,434 صفحة.

**العقد الثابت** (لا يُكسر — كل أدوات التقييم تعتمد عليه):

```
لكل <stem>.pdf :  <stem>.txt          صفحات مفصولة بـ  === Page N ===
                  <stem>_stats.json   لكل صفحة: seconds, generated_tokens, chars
```

---

## 0) محتويات الحزمة وقواعدها

| الملف | الدور |
|---|---|
| `scripts/run_ocr.py` | المشغّل: PDF ← نص + stats، بحارس الحلقات وإعادة المحاولة والاستئناف و`enable_thinking=False` لعائلة Qwen |
| `scripts/check_results.py` | فاحص السلامة بعد كل تشغيلة (تغطية/علامات/ترميز/حلقات/توقيت) |
| `sbatch/bench_four_models.sh` | البنشمارك: مصفوفة 4 مهام `%4` — النماذج الأربعة بالتوازي |
| `sbatch/prod_gemma31b.sh` | الإنتاج: مصفوفة 46 مهمة (كتاب/مهمة) `%4` |
| `env/requirements.txt` | حزم الاستدلال |

**نقطة تكييف وحيدة متبقية:** جدول `MODEL_REGISTRY` أعلى `run_ocr.py` — ضع مسارات الـ checkpoints المحلية لديك (نفس ما تستخدمه في `run_four_models_ocr.py`).

**القواعد الإلزامية المطبّقة في كل الملفات** (ولأي سكربت جديد مستقبلاً):
1. القراءة من `pdfs/benchmark_samples/` أو `pdfs/books/` فقط، والكتابة في `results/...` بنفس عقد التسمية.
2. هيدر SLURM الثابت: `-p gpu-H200` + `-A H200` + `-q h200_qos` + `--gres=gpu:1`، مع `module load cuda12.6/toolkit/12.6.2` في الجسم.
3. `source venv/bin/activate` قبل أي بايثون — لا conda.
4. **لا شيء ثقيل على login node** — بايثون فقط عبر `salloc` أو `sbatch` (حتى `check_results.py` بعد الإنتاج: شغّله في `salloc` أو مهمة `cpu-all`).
5. مساحة مؤقتة سريعة عند الحاجة: `/scratch` (NVMe حتى 3TB) — انقل النتائج للـ home بعدها وامسح المؤقت.

---

## 1) التحضير (مرة واحدة)

### 1.1 الرفع من جهازك (PowerShell)

```powershell
scp -r C:\Users\osama\Downloads\benchmark_samples\server_pipeline `
      oalsumaitti@panther-login.qcri.org:/export/home/oalsumaitti/ocr-test/
```

### 1.2 البيئة (على login node — أوامر خفيفة فقط، الـ pip يُفضَّل داخل salloc)

```bash
ssh oalsumaitti@panther-login.qcri.org
cd /export/home/oalsumaitti/ocr-test
# pip لا يحتاج GPU — جلسة cpu-all قصيرة تكفي وتترك login node مرتاحاً:
salloc -p cpu-all --time=00:45:00 --mem=16G -c 4
python3 -m venv venv && source venv/bin/activate
pip install torch --index-url https://download.pytorch.org/whl/cu124
pip install -r server_pipeline/env/requirements.txt
exit
```

فحص `torch.cuda.is_available()` يتم في اختبار الدخان (§1.4) لأنه يحتاج GPU فعلياً.

> لو فشل `pip install` بصمت فهي غالباً **صلاحيات حساب** لا مشكلة شبكة (حدث معك سابقاً) — جرّب `pip install --user` أو راجع الدعم.

### 1.3 توكن HuggingFace (علاج الـ 403 الذي واجهته)

بعض بيئات HF تقرأ `HUGGING_FACE_HUB_TOKEN` وليس `HF_TOKEN` فقط. ملفات sbatch تصدّر الاثنين تلقائياً، لكن ثبّت القيمة في `~/.bashrc`:

```bash
echo 'export HF_TOKEN=hf_xxxx' >> ~/.bashrc
echo 'export HUGGING_FACE_HUB_TOKEN=$HF_TOKEN' >> ~/.bashrc
```

### 1.4 اختبار دخان قبل أي sbatch (جلسة تفاعلية على H200)

```bash
cd /export/home/oalsumaitti/ocr-test
salloc -p gpu-H200 --gres=gpu:1 -A H200 -q h200_qos --time=00:30:00 --mem=64G -c 8
module load cuda12.6/toolkit/12.6.2
source venv/bin/activate
export HF_HOME=$PWD/hf_cache
python server_pipeline/scripts/run_ocr.py --model gemma4_31b \
    --pdf pdfs/benchmark_samples/0_sample.pdf --out /tmp/smoke
python server_pipeline/scripts/check_results.py --results /tmp/smoke \
    --pdf-dir pdfs/benchmark_samples    # سيشتكي عن 45 ملفاً ناقصاً — المهم أن 0_sample يمر
exit
```

إن خرج `0_sample.txt` بست صفحات نظيفة فالبنية سليمة.

---

## 2) البنشمارك — 4 نماذج × 46 عينة

```bash
cd /export/home/oalsumaitti/ocr-test
sbatch server_pipeline/sbatch/bench_four_models.sh
```

المصفوفة `0-3%4`: النماذج الأربعة تعمل **بالتوازي** (ضمن حدّك 4 مهام). المهمة 0=ain، 1=gemma4_26b، 2=gemma4_31b، 3=qwen36.

**المراقبة:**

```bash
squeue --me                          # الحالة؛ PENDING طويل = الـ partition مزدحم، ليس خطأك
tail -f logs/bench_<JOBID>_2.out     # تتبّع gemma4_31b حيّاً
sacct -j <JOBID> --format=JobID,JobName,Elapsed,State,MaxRSS
scancel <JOBID>                      # إلغاء عند الحاجة (أو scancel <JOBID>_3 لمهمة واحدة)
```

**الأزمنة المتوقعة** (من تشغيلتك السابقة): ain ‏1.2h، gemma4_26b ‏3.1h، gemma4_31b ‏3.3h، qwen36 ‏9.6h — والحارس الجديد غالباً يقلّصها (يقصّ الحلقات).

كل مهمة تختم بـ `check_results.py` تلقائياً: **إن نقص أي ملف تفشل المهمة** (تظهر FAILED في `sacct`) بدل نجاح كاذب.

---

## 3) قراءة تقرير الفحص

```bash
# داخل salloc قصيرة أو مهمة cpu-all — ليس على login node
python server_pipeline/scripts/check_results.py \
    --results results/bench_rerun/gemma4_31b --pdf-dir pdfs/benchmark_samples
```

| سطر التقرير | معناه | متى تقلق |
|---|---|---|
| `hard failures` | ملف ناقص / ترميز تالف / علامات مكسورة | أي رقم غير صفر ⇒ أعد المهمة قبل التقييم |
| `loop?` | نسبة تكرار 5-grams > 0.5 | 0–4 صفحات طبيعي؛ عشرات ⇒ مشكلة فك ترميز |
| `runaway?` | صفحة أطول 4× من وسيط كتابها | راجعها — غالباً وصف صورة |
| `empty pages` | صفحات بلا نص | يجب أن تقارب الصفحات الفارغة الحقيقية |
| `timing` | إجمالي GPU-h وأبطأ 5 صفحات | صفحة > 500s ⇒ افحص هل نجت حلقة من الحارس |

التقرير يُحفظ أيضاً `check_report.json` داخل مجلد النتائج.

---

## 4) السحب والتقييم محلياً

```powershell
scp -r oalsumaitti@panther-login.qcri.org:/export/home/oalsumaitti/ocr-test/results/bench_rerun `
      C:\Users\osama\Downloads\benchmark_samples\
cd C:\Users\osama\Downloads\benchmark_samples
python kitab_eval.py      # عدّل RES أعلى الملف نحو bench_rerun لمقارنة قبل/بعد الحُرّاس
python ioc_eval.py        # طبقة IOC + leaderboard.json
```

**معيار القبول:** CER الأساسي لكل نموذج ضمن ±2 نقطة من تقرير البنشمارك، واختفاء (أو شبه اختفاء) صفحات الحلقات عند gemma ⇒ الحُرّاس تعمل، جاهز للإنتاج.

---

## 5) الإنتاج — gemma4_31b على 5,434 صفحة

```bash
cd /export/home/oalsumaitti/ocr-test
sbatch server_pipeline/sbatch/prod_gemma31b.sh
```

- **الحساب:** ‏5,434 × ~42.1s ≈ **64 GPU-h** ⇒ على 4 GPUs متوازية ≈ **16–18 ساعة حائطية**. أكبر كتاب (786 صفحة) ≈ 9.2h، لذلك `--time=12:00:00`.
- **الاستئناف مجاني:** مهام per-book وكتابة atomic؛ مهمة سقطت/انتهى وقتها:
  ```bash
  sbatch --array=17,39 server_pipeline/sbatch/prod_gemma31b.sh
  ```
  والكتب المكتملة تُتخطى (`[skip] ... (exists)`).
- **خيار التسريع** (مذكور داخل السكربت): `-A H200_16GPUs` + `-q h200_qos_16_gpus` لرفع التوازي فوق 4 — لكنه **قابل للإزاحة بعد مهلة 6 ساعات**؛ مقبول هنا تحديداً لأن الاستئناف يجعل أقصى خسارة تقدّمَ كتابٍ واحد. إن أردت النوم مرتاحاً، ابقَ على `%4` العادي.
- `--postfilter` مفعّل: يحذف الملاحظات الوصفية على الصفحات الفارغة (توصية التقرير §5.2).

**بعد الاكتمال:**

```bash
salloc -p cpu-all --time=00:30:00 -c 4 --mem=16G
source venv/bin/activate
python server_pipeline/scripts/check_results.py \
    --results results/prod/gemma4_31b --pdf-dir pdfs/books --review-sample 20
exit
```

`review_sample/` سيحوي 20 صفحة عشوائية — **راجعها بشرياً قبل الاعتماد** (§5.4 من التقرير)، وأضف تدقيقاً يدوياً للصفحات الحاوية IOCs حرجة (هاشات/IPs) بسبب اكتشاف انعكاس الـ RTL‏ (`40.80.148.42` ← `42.148.40.42`).

---

## 6) استكشاف الأخطاء (يشمل ما واجهته فعلاً)

| العرض | السبب الحقيقي | العلاج |
|---|---|---|
| PENDING لساعات | الـ partition مزدحم بمستخدم آخر | `squeue -p gpu-H200` لترى الطابور؛ انتظر أو جزّئ؛ ليست مشكلة سكربت |
| `403` عند تحميل موديل | التوكن لا يُلتقط من `HF_TOKEN` وحده | صدّر `HUGGING_FACE_HUB_TOKEN` أيضاً (§1.3 — مضمَّن في sbatch) |
| تعارض PyTorch/CUDA | torch لا يدعم الكرت/الـ CUDA | أعد تثبيت torch بـ index الـ cu124 + `module load cuda12.6/toolkit/12.6.2` |
| `pip install` يفشل بصمت | صلاحيات الحساب | `pip install --user` أو الدعم — ليست شبكة |
| Out of Memory | DPI عالٍ أو كرت قديم (gpu-dev يعطي P100!) | تأكد أنك على `gpu-H200`؛ وإلا قلّل `DPI` إلى 280 في `run_ocr.py` |
| رفض `gpu-A100` | لا صلاحية لحسابك أصلاً | لا تستخدمه — `gpu-H200` فقط |
| TIMEOUT | كتاب أطول من التقدير | أعد المهمة — الاستئناف يتكفّل |
| حلقات رغم الحارس | النموذج يقاوم `repetition_penalty` | ارفع `RETRY_PENALTY` إلى 1.4 وأضف `no_repeat_ngram_size=12` في `generate()` |
| `</think>` يظهر مجدداً | معالج قديم يتجاهل `enable_thinking` | القصّ الاحتياطي في الكود يتكفّل؛ حدّث transformers |

---

## 7) الترتيب التنفيذي

1. ارفع الحزمة واضبط `MODEL_REGISTRY` (§1.1) وجهّز venv والتوكن (§1.2–1.3).
2. اختبار دخان على `0_sample.pdf` في `salloc` على H200 (§1.4).
3. `sbatch bench_four_models.sh` → مراقبة → فحص (§2–3).
4. اسحب محلياً → `kitab_eval.py` + `ioc_eval.py` → ±2 نقطة = قبول (§4).
5. `sbatch prod_gemma31b.sh` → فحص + عينة مراجعة 20 صفحة → اعتماد (§5).
