# دليل التقييم فقط — مقارنة النتائج الموجودة بالـ Ground Truth على Panther

**بدون أي إعادة OCR وبدون GPU.** النتائج موجودة أصلاً على السيرفر في
`results/all_samples_four_models/` (نفس التشغيلة التي بُني عليها التقرير).
المطلوب فقط: رفع الـ ground truth وسكربتي التقييم، وتشغيل مهمة sbatch واحدة على `cpu-all`.

> لماذا `cpu-all` وليس `gpu-H200`؟ التقييم كله jiwer + regex — يستهلك CPU لدقائق.
> حجز H200 له يحرق واحدة من مهامك الأربع المتزامنة بلا فائدة. جدولك نفسه يقول:
> `cpu-all` = مهام بدون GPU.

---

## 1) الرفع من جهازك (PowerShell — أمر واحد)

```powershell
cd C:\Users\osama\Downloads\benchmark_samples
scp -r ground_truth kitab_eval.py ioc_eval.py server_pipeline `
      oalsumaitti@panther-login.qcri.org:/export/home/oalsumaitti/ocr-test/
```

يرفع: 276 ملف ground truth + المانيفست، والسكربتين (يقبلان الآن `--results/--gt/--out`
من سطر الأوامر)، وملف `sbatch/eval_benchmark.sh`.

> **انتبه لاختلاف اسم المجلد:** محلياً اسمه `all_results_for_samples_four_models`
> لكن على السيرفر (حسب ملفات stats) هو `results/all_samples_four_models` —
> الـ sbatch مضبوط على اسم السيرفر. لو نقلت المجلد أو أعدت تسميته عدّل سطر
> `RESULTS=` داخل السكربت.

## 2) التشغيل

```bash
ssh oalsumaitti@panther-login.qcri.org
cd /export/home/oalsumaitti/ocr-test
sbatch server_pipeline/sbatch/eval_benchmark.sh
squeue --me                     # ينتهي خلال دقائق
cat logs/eval_<JOBID>.out       # التقرير الكامل يُطبع في اللوج نفسه
```

اللوج سيحوي حرفياً نفس جداول التقرير: اللوحة الرئيسية (CER/WER/chrF/tblF1/hall/loops)،
النص الأساسي (208 صفحات)، التحليل حسب النوع، الكتب الممسوحة، مصفوفة الفوز،
اختبارا الـ bootstrap، ثم لوحة IOC (‏SecScore/Recall/Precision).

**أرقام التحقق** (يجب أن تطابق تشغيلتك المحلية حرفياً — نفس المدخلات نفس الكود):
`gemma4_31b: CERc 24.7% · tblF1 69.3% · SecScore 0.706` و`gemma4_26b: CERc 24.5% · SecScore 0.647`.

## 3) المخرجات وسحبها

```
results/eval_out/
├── per_page_scores.csv    كل مقياس × كل صفحة × كل نموذج (1,380 صفاً)
├── model_summary.json     كل التجميعات
├── leaderboard.json       ترتيب Security OCR Score + مخزون الـ IOC
└── hyp_pages/<model>/     الفرضيات مقسمة صفحة-صفحة ({book}_p{slot}.txt)
```

```powershell
scp -r oalsumaitti@panther-login.qcri.org:/export/home/oalsumaitti/ocr-test/results/eval_out `
      C:\Users\osama\Downloads\benchmark_samples\eval_out_panther
```

## 4) إضافي (اختياري)

- **سكوررك الأصلي** يعمل على الفرضيات المقسمة مباشرة (ارفع `score_ocr.py` ثم):
  ```bash
  python score_ocr.py results/eval_out/hyp_pages/gemma4_31b --loose
  ```
- **نماذج أقل أو أكثر:** `--models gemma4_26b,gemma4_31b` على `kitab_eval.py`
  (و`qwen36_clean` يُشتق تلقائياً من `qwen36` إن كان ضمن القائمة).
- **تشغيلة نتائج أخرى مستقبلاً** (مثل إنتاج أو bench_rerun): نفس السكربت مع تغيير
  `RESULTS=` و`OUT=` فقط — العقد `<stem>.txt + === Page N ===` هو كل ما يلزم.

## 5) مشاكل محتملة

| العرض | العلاج |
|---|---|
| `pip install jiwer` يفشل بصمت | صلاحيات الحساب — `pip install --user jiwer` (السكربت يثبّتها تلقائياً إن كانت ناقصة) |
| `FileNotFoundError: gt_manifest.json` | تأكد أن `ground_truth/` رُفع كاملاً إلى جذر `ocr-test/` |
| `No such file ... all_samples_four_models` | عدّل `RESULTS=` في `eval_benchmark.sh` لمسار نتائجك الفعلي |
| أرقام مختلفة عن المحلي | المدخلات مختلفة (تشغيلة أخرى؟) — قارن عدد الملفات: `ls results/all_samples_four_models/gemma4_31b/*_sample.txt | wc -l` يجب 46 |
