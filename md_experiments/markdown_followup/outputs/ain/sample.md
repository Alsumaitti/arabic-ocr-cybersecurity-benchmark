=== Page 1 ===
هذه الوحدات لا تكتفي بالدفاع بل تبادر بالهجوم وتستخدم الفضاء السيبراني في
التجسس و إضعاف الأنظمة و شل البنى التحتية وحتى التأثير على الرأي العام.
الواقع اليوم يؤكد أن من لا يمتلك قوة سيبرانية سيظل مكشوفًا وعاجزًا في أي صراع
حديث. لم تعد الجيوش تقاتل وحدها، بل تشاركها خوارزميات وتطبيقات وأجهزة تتسلل
بصمت وتصيب بدقة.
هل نملك نحن هذا الدرع؟ هل نمتلك ما يكفي من كوادر، بنية تحتية، وتشريعات لخوض
هذا الميدان؟
ايها المسؤولون الكرام الجواب على هذه الأسئلة يحدد مستقبلنا الرقمي وموقعنا في
خريطة القوة العالمية.
2 ) حتى الأمم المتحدة، التي تُعد المرجعية الأهم في القانون الدولي، أدركت منذ عام
أن الحروب السيبرانية لم تعد افتراضية أو هامشية، بل باتت تهدد السلم والأمن
الدوليين بشكل مباشر.
• بدأت الأمم المتحدة منذ ذلك العام مناقشات موسمعة عبر "مجموعة الخبراء الحكوميين"
OEWG) و"اللجنة المفتوحة العضوية" (GGE)، لبحث كيفية تطبيق مبادئ القانون الدولي
على الفضاء السيبراني.
• هذه النقاشات تشمل مواضيع مثل:
- هل تعتبر الهجمات السيبرانية على المستشفيات أو محطات الكهرباء عملاً عدوانيًا؟
- متى يُعطى للدول حق الرد؟ وهل الرد بالوسائل العسكرية التقليدية ممكن؟
- كيف نُحقّل الدول مسؤولية الأفعال التي تنطلق من أراضيها؟

=== Page 2 ===
K-6

### 9-7

> القاعدة والقاعدة ونسبة الألف إلى ألفين
>
> النسبات والأعداد والعلاقات بينها وبين بعضها البعض
>
> المثلثات والمربعات ومجموعاتها من النقاط
>

### K-8

> العلاقة بين الخطوط والزوايا والمسافات والزوايا الداخلية للقطع المستطيلة
>
> مسائل تتعلق بالخطوط والزوايا والمسافات والزوايا الداخلية للقطع المستطيلة
>
> قياس الزوايا باستخدام الدرجات والراديان
>

### 13-10

> العلاقات بين القطع المستطيلة والمستقيمات والزوايا والمسافات والزوايا الداخلية للقطع المستطيلة
>
> مسائل تتعلق بالقطوع المستطيلة والمستقيمات والزوايا والمسافات والزوايا الداخلية للقطع المستطيلة
>
> طرق حل المسائل المتعلقة بـ
>

=== Page 3 ===
محاولات تسجيل الدخول الفاشلة ولن يكون هناك سجل لمحاولات المهاجم في اختراق البرنامج من خلال هجوم القوة الغاشمة (Brute Force).
```java
// Example Language: Java
if LoginUser() {
  // Login successful
  RunProgram();
} else {
  // Login unsuccessful
  LoginRetry();
}
```
يوصى بتسجيل عملية تسجيل الدخول الفاشلة، لاحظ أنه لا يجب أن تكون أسماء المستخدمين جزءاً من رسالة السجل، ولا يجب أن تكون كلمات المرور جزءاً من رسالة السجل بأي حال من الأحوال.
```java
// Example Language: Java
if LoginUser() {
  // Login successful
  log.warn("Login by user successful.");
  RunProgram();
} else {
  // Login unsuccessful
  log.warn("Login attempt by user failed, trying again.");
  LoginRetry();
}
```

=== Page 4 ===
Source code for transpositionFileCipher.py

# Transposition Cipher Encrypt/Decrypt File

## http://inventwithpython.com/hacking (BSD Licensed)

4.
import time, os, sys, transpositionEncrypt, transpositionDecrypt

6.
def main():
7.
    inputFilename = 'frankenstein.txt'
8.
    # BE CAREFUL! If a file with the outputFileame name already exists,
9.
    # this program will overwrite that file.
10.
    outputFileame = 'frankenstein.encrypted.txt'
11.
    myKey = 10
12.
    myMode = 'encrypt' # set to 'encrypt' or 'decrypt'
13.

14.
    # If the input file does not exist, then the program terminates early.
15.
    if not os.path.exists(inputFilenname):
16.
        print('The file %s does not exist. Quitting...' % (inputFilenname))
17.
        sys.exit()
18.

19.
    # If the output file already exists, give the user a chance to quit.
20.
    if os.path.exists(outputFilenname):
21.
        print('This will overwrite the file %s. (C)ontinue or (Q)uit?' % 
(ouputFilenname))
22.
        response = input('> ')
23.
        if not response.lower().startswith('c'):
24.
            sys.exit() 
25.

26.
    # Read in the message from the input file
27.
    fileobj = open(inputFilenname)
28.
    content = fileobj.readO
29.
    fileobj.closeO
30.

31.
    print('%sing...' % (myMode.title()))
32.

33.
    # Measure how long the encryption/decription takes.
34.
    startTime = time.timeO
35.

36.
    if myMode = 'encrypt':
37.
        translated = transpositionEncryp encryptMessage(myKey, content)
38.
    elif myMode = 'decrypt':
39.
        translated = transpositionDecryp decryptMessage(myKey, content)
40.
    totalTime = round(time.timeO - startTime, 2)
41.
    print('%sion time: %s seconds' % (myMode.title(), totalTimE))
42.

43.
    # Write out the translated message to the output file.
44.
    ouputFileobj = open(outpuFilenname, 'w')
45.
    ouputFileobj.write(translated)
46.
    ouputFileobj.closoeO
47.

48.
    print('Done %sing %d (%d characters).' % (myMode, inputFilenname, len(content)))
49.

50.
    print('Writed file is %s.' % (outputFilenname))
51.

52.
    # If transpositionCipherFile.py is run (instead of imported as a module)
53.
    if __name__ = '__main__':
54.
        main()

=== Page 5 ===
* نلاحظ أن خدمة Sync Breeze Enterprise هي خدمة شرعية موجودة على النظام. وبعد البحث عبر الإنترنت، تبيّن أن النسخة v10.0.28 من هذه الخدمة مصابة بثغرة CVE-2017-14980. لذلك، فإن الإجراء الأمثل يتضمن تعليق العملية وقطع الاتصال بها، ومن ثم البحث عن ترقيع (Patch) لهذه الثغرة.
## إيقاف العلمية (Kill The Process)
- taskkill /F /PID 2548
	+ يستخدم لإنهاء عمليات العمل في نظام التشغيل Windows من خلال سطر الأوامر.
	- هذا الجزء يُحدد أن الأمر يجب أن يكون قاسياً (forceful)، مما يعني أنه سيُنهي العملية بشكل فوري دون الحاجة للتأكيد من المستخدم. إذا لم يتم تحديد هذا الخيار، فقد يظهر مربع حوار للتأكد من المستخدم قبل إيقاف العملية.
- PID 2548: يُحدد هذا الجزء معرِف العملية (PID) التي تريد إنهاءها. في هذا السياق، يتم إيقاف العملية التي لها معرِف العملية يساوي 2548.
> تم إيقاف العملية.
### قطع الاتصال
- cports /close 192.168.2.14 * 192.168.1.106 * 2548
	+ cports /close <Local Address>* <Local Port>* <Remote Address> <Remote Port>* {Process Name/ID}
	- هذا الأمر يستخدم لإغلاق جميع الاتصالات إلى العنوان البعيد (Remote Address) CurrPorts IP. هو اسم البرنامج الذي يستخدم لإدارة اتصالات الشبكة المصدر للاتصال.
	- 192.168.2.14: العنوان البعيد الذي نريد إغلاق الاتصالات به.
	- 192.168.1.106: العنوان البعيد الذي نريد إغلاق الاتصالات به.
	- *: يُستخدم لتحديد جميع المنافذ البعيدة، مما يعني أن الأمر ينطبق على جميع المنافذ البعيدة.

=== Page 6 ===
خطوات الخوارزمية:

- يُبيّن المخطط التدفقي التالي كيفيّة عمل الخوارزمية:
  # البداية
    مجموعة بيانات

## حساب الانتروبي العام لكل صنف
   * حساب الانتروبي و معدل الربح لكل صفة
     # تحديد عقدة الجذر/الربح الأكبر
       تقسيم البيانات المتبقية
         هل تم التنفيذ على جميع الصفات؟ 
           إنشاء شجرة القرار
             النهاية


#

=== Page 7 ===
# Files With Modified Attributes

| C:\Users\Admin\AppData\Local\Temp\DB.EXE |
| C:\Users\Admin\AppData\Roaming\Microsoft\Windows\IETIdCache|
| C:\Windows\SysWOW64\pt-PT2.exe |
| C:\Documents and Settings\Administrator\Application Data\RtlDriver32.exe |
| C:\WINDOWS\system32;c_10008O.exe |

الشكل (4 _26)، يبيّن الشكل نشاط الملفات حيث العمليّة المُنفذة هي تغيير السمات

> "Files With Modified Attributes" السمات أشياء مثل ما إذا كان الملف مخفيًا أو للقراءة فقط أو تمَّ أرشفته.

## تقييم السلوك:

يُشير هذا النشاط بشكلٍ مشبوه إلى وجود برنامج ضارّ على النظام الهدف وذلك بسبب:
- نسخ ملفات مشبوهة: يتمّ نسخ ملفات مثل RtlDriver32.exe و AV.EXE و SB.EXE، والتي تُستخدم عادةً بواسطة البرامج الضارّة إلى مواقع مُتعدّدة، هذا يُشير إلى محاولة البرنامج الضارّ لضمان بقائه على النظام وتجنب الحذف.
- مواقع النسخ: يتمّ نسخ الملفات إلى مجلّدات مؤقتة ومجلّدات بيانات التطبيقات، والتي تُعتبر مواقع شائعة للبرامج الضارّة لإخفاء نفسها.
- تعديل سِمَات الملفات: قد تقوم البرامج الضارّة بتعديل سِمَات الملفات لإخفاء وجودها أو جعلها أكثر صعوبة في الحذف.

### RtIDriver32.exe
- وجود ملف برنامج تشغيل في مجلّد بيانات التطبيقات يعدُّ أمراً مثيراً للقلق، حيث تعمل برامج التشغيل على مستوى منخفض في النظام، مما يُعطي البرامج الضارّة تحكُماً كبيراً.

---

## Files Deleted

- C:\Users\Admin\AppData\Local\Temp\ndhdrwfo.exe
- C:\Users\Admin\AppData\Local\Temp\ucju.exe
- %USERPROFILE%AppData\Local\Temp\AV2
- %USERPROFILE%AppData\Local\Temp~unins1484.bat
- C:\ProgramData\Microsoft\WindowsWER\Temp\WER1027.tmp.mdmp
- C:\ProgramData\Microsoft\WindowsWER\Temp\WER1113.tmp.WERInternalMetadata.xml
- C:\Users\admin\AppData\Local\Temp\ndhdrwfo.exe
- C:\Users\admin\AppData\Local\Temp\ucju.exe
- C:\Windows\System32\spp\store\2.0\cache\cache.dat

الشكل (4 _27)، يبيّن الشكل نشاط الملفات حيث العمليّة المُنفذة هي الحذف

[70]

=== Page 8 ===
### Ethernet Medium Access Control

This standard explains two methods of access to the medium:

• Half duplex: In this mode, devices can send data but cannot receive it simultaneously.

• Full duplex: This method allows both sending and receiving at the same time.

The control mechanism used by these standards includes:
- Carrier Sense Multiple Access with Collision Detection (CSMA/CD)
- Backoff Algorithm

These mechanisms ensure efficient use of bandwidth while minimizing collisions between transmissions.
25

=== Page 9 ===
# مخطط قاعدة البيانات:

## الشكل 3-24: يوضح مخطط قاعدة البيانات

|    _id_     |   message_time   |      sender       |
|-------------|------------------|-------------------|
|message_text | shared_file      |

| conversations |
|---------------|
| messages      |
| title_text    |
| unread        |
| user_list     |

| users         |
|---------------|
| user_id       |
| password      |
| jwt_id        |
| active        |
| created_date  |
| date_last_updated |

| shared_file   |
| file_name     |
| file_size     |
| file_type     |
| file_uri      |

*الشكل 3-24: يوضح مخطط قاعدة البيانات*

=== Page 10 ===
This appears to be an empty page.
There's no content visible here.

=== Page 11 ===
### الهجمات من طرف الزبون

تهدف الهجمات من طرف الزبون إلى استغلال نقاط ضعف تطبيقات الزبون التي تتفاعل مع مخدم مخترق أو تعالج معطيات خبيثة. في هذه الحالة، يقوم الزبون بفتح اتصال مع مخدم الأمر الذي ينتج عنه الهجوم.

يُعتقد أن مجرد فتح برنامج الزبون وحتى وإن لم يقم بالاتصال ببرنامج التطبيق لا يعرضه للخطر. بيد أن هذا الاعتقاد غير صحيح لأن الزبون عادةً يدخل آلياً إلى مخدم نفاذ بعيد الأمر الذي يعرضه لخطر هجوم محتمل.
- تشمل أهم الهجمات من طرف الزبون على التلاعب بالترويسات والكوكيز والمرفقات واختطاف الجلسة والإضافات الخبيثة.


## التلاعب بالترويسة HTTP

تعتبر ترويسة HTTP جزءًا من طرد HTTP وهي تهتم بخصائص متصفح الزبون ومخدم الويب. يجري نقل المعطيات كنتيجة رسالة طلب HTTP من قبل المتصفح متبوعاً برسالة جواب HTTP من قبل المخدم. يشمل HTTP حقل الترويسة على اسم الحقل متبوعاً بنقطتين :" ومن ثم قيمة الحقل. يبين الجدول التالي بعض حقول وقيمها.



|وصف|
|-|
|عنوان الموقع الذي قدم منه الطلب|
|اللغات المقبولة|
|نوع مخدم الويب|
|إضافة كوكي إلى المتصفح|

يمكن هنا للمهاجم تغيير محتويات الترويسات القادمة من الزبون ليشن الهجوم. من الأمثلة على هجمات التلاعب بترويسة HTTP، نذكر:

• `Referer` المحيل
- يستطيع هنا المهاجم تعديل هذا الحقل لتجاوز إجراء الحماية هذا.
