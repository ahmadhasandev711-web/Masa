# 🍽️ منصة ماسا المتكاملة لإدارة وتشغيل المطاعم والكافيهات
## MASA — Enterprise Restaurant Management & Cloud/Offline POS Ecosystem

منظومة سحابية متطورة مصممة وفق أحدث المعايير الهندسية (Clean Architecture & Domain-Driven Design) لإدارة كافة العمليات التشغيلية للمطاعم والكافيهات متعددة الفروع، مع دعم كامل للعمل دون اتصال بالإنترنت (Offline-First).

---

## ✨ المميزات الرئيسية للمنظومة (Key Modules)

### 1. ⚡ نقطة البيع السريعة (High-Performance POS)
- **العمل دون اتصال (Offline-First Capability):** استمرار عمليات البيع وإصدار الفواتير وطباعتها لحظياً حتى عند انقطاع الإنترنت، مع طابور مزامنة تلقائي فوري (Auto-Sync Queue) عند عودة الاتصال.
- **منع التكرار (Strict Idempotency):** حماية كاملة ضد تكرار حفظ الفواتير أو خصم المخزون مرتين.
- **دعم كافة أنواع الطلبات:** صالة (Dine-In)، سفري (Takeaway)، وتوصيل (Delivery).

### 2. 🪑 خريطة الصالة وإدارة الطاولات (Floor Plan & Table Management)
- تصميم مرئي تفاعلي لصالة المطعم وتوزيع القاعات والأقسام.
- فتح ومتابعة حسابات الطاولات الجارية (Active Table Tabs) وتحويل الطاولات بنقرة واحدة.
- توليد وطباعة بطاقات الـ QR الذكية لكل طاولة للطلب الذاتي من المنيو الإلكتروني.

### 3. 🍳 شاشة المطبخ الذكية وبونات التشغيل (Kitchen Display System - KDS & KOT)
- **شاشة مطبخ رقمية حية (`/admin/kitchen`):** متابعة فورية للطلبات داخل المطبخ مع تنبيهات صوتية وحالات إعداد مرئية (قيد التحضير / جاهز) دون الحاجة للورق.
- **بونات تشغيل المطبخ (Kitchen Order Tickets):** طباعة حرارية دقيقة لبونات المطبخ مع توجيه ذكي يدعم طابعة المطبخ المنفصلة أو الطابعة المشتركة مع الكاشير.

### 4. 🖨️ نظام طباعة حراري متجاوب (72mm Responsive Thermal Shield)
- تصميم قياسي متوافق مع رأس الطباعة الحرارية المعتمد 72mm لمنع أي قص أو تشويه على رولات 80mm أو 76mm.
- دعم طباعة تذكرة متصلة واحدة (الفاتورة + فاصل قص ورقي + بون المطبخ) بضغطة زر واحدة.

### 5. 📦 إدارة المخزون بالتكلفة المرجحة (WAC Inventory Management)
- تتبع دقيق للمواد الخام وحركات الاستلام والهدر.
- احتساب تكلفة الوجبات والبضاعة المباعة (COGS) وفق معادلة المتوسط المرجح المتحرك (Moving Weighted Average Cost) لحماية تقارير الأرباح والخسائر.

### 6. 💼 الرقابة المالية والورديات (Financial Governance & Shifts)
- فتح وإغلاق ورديات الكاشير وتتبع الفروقات النقدية (Cash Variances).
- تقارير مبيعات مجمعة على مستوى قاعدة البيانات وسجلات تدقيق مالي تفصيلية.

---

## 🛠️ البنية التقنية (Technology Stack)

- **Framework:** Next.js 16 (App Router) + React 19
- **Language:** TypeScript 5 (Strict Mode)
- **Database & ORM:** MySQL 8.0+ / MariaDB 10.5+ عبر Prisma ORM
- **Architecture:** Clean Layered Architecture (Domain, Application, Infrastructure, Presentation)
- **Styling:** Tailwind CSS v4 مع دعم كامل للـ RTL والطباعة الحرارية
- **Testing:** حزمة اختبارات شاملة مبنية على Vitest تغطي كافة قواعد الأعمال

---

## 🚀 دليل التثبيت والتشغيل (Deployment Guide)

### 1. المتطلبات الأساسية (Prerequisites)
- **Node.js**: إصدار `v20.x` أو `v22.x`
- **Database**: خادم MySQL 8.0+ أو MariaDB 10.5+

### 2. إعداد ملف البيئة (`.env`)
قم بإنشاء ملف `.env` في المجلد الرئيسي للتطبيق وأدخل الإعدادات التالية:

```env
# رابط الاتصال بقاعدة البيانات
DATABASE_URL="mysql://DB_USER:DB_PASSWORD@localhost:3306/DB_NAME"

# مفتاح تشفير الجلسات (سلسلة عشوائية آمنة لا تقل عن 32 حرفاً)
JWT_SECRET="replace-with-a-very-long-secure-random-secret-key-32chars"

# بيئة التشغيل والمنفذ
NODE_ENV="production"
PORT=3000
TRUSTED_PROXY_HOPS=1

# كلمة المرور الأولية لمدير النظام (تُستخدم فقط عند أول تهيئة)
INITIAL_ADMIN_PASSWORD="ChooseAStrongPassword"

# إعدادات الهوية الافتراضية للمنشأة
RESTAURANT_NAME_AR="اسم المطعم بالعربية"
RESTAURANT_NAME_EN="Restaurant Name"
RESTAURANT_CURRENCY="EGP"
RESTAURANT_CURRENCY_SYMBOL="ج.م"
```

### 3. تثبيت الحزم وتهيئة قاعدة البيانات
في سطر الأوامر (Terminal):
```bash
# تثبيت الحزم المطلوبة
npm install --production=false

# تهيئة الجداول وحقن الإعدادات الأولية
npm run db:setup
```

### 4. التشغيل على استضافات cPanel (Setup Node.js App)
1. ارفع ملف حزمة الإنتاج (`.zip`) إلى مجلد التطبيق في cPanel وفك الضغط.
2. توجه إلى لوحة **Setup Node.js App** في cPanel:
   - **Node.js Version:** اختر `20.x` أو `22.x`.
   - **Application Mode:** اختر `Production`.
   - **Application Root:** مسار مجلد التطبيق (مثال: `resto`).
   - **Application Startup File:** اكتب `server.js`.
3. اضغط **Save** ثم **Run NPM Install** في حال لزم الأمر.
4. اضغط **Restart** لتشغيل التطبيق والبدء بالاستخدام.

---

## 🔐 الأمان وحماية البيانات
- **عزل الفروع:** عزل كامل للبيانات والصلاحيات بين الفروع.
- **حماية الصلاحيات:** نظام أذونات دوري صارم (Role-Based Access Control).
- **حماية الجلسات:** ملفات تعريف ارتباط مؤمنة مع توقيع رقمي عبر JWT.

---

## 📄 الترخيص (License)
جميع الحقوق محفوظة © لمنظومة ماسا (MASA Platform).
