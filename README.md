# قهوة كايرو (Qahwet Cairo) - نظام إدارة وتشغيل الكافيه والمتجر الرقمي
العاشر من رمضان - ستريب مول | مفتوح 24 ساعة

---

## متطلبات التشغيل (Requirements)
- **Node.js**: v20+ أو v22
- **Database**: MySQL 8.0+ أو MariaDB 10.5+

---

## خطوات التشغيل على cPanel (Deployment Guide)

### 1. رفع الملفات وفك الضغط
- ارفع ملف `qahwet-cairo-deploy.zip` إلى مسار المشروع (مثل `~/resto` أو مجلد التطبيق في cPanel).
- قم بفك الضغط (Extract).

### 2. إعداد ملف البيئة (.env)
تأكد من وجود ملف `.env` في المجلد الرئيسي يحتوي على:
```env
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/DATABASE_NAME"
JWT_SECRET="your-secure-random-jwt-secret-at-least-32-chars"
NODE_ENV="production"
PORT=3000
TRUSTED_PROXY_HOPS=1
INITIAL_ADMIN_PASSWORD="admin@password123"
RESTAURANT_NAME_AR="قهوة كايرو"
RESTAURANT_NAME_En="Qahwet Cairo"
RESTAURANT_CURRENCY="EGP"
RESTAURANT_CURRENCY_SYMBOL="ج.م"
```

### 3. تثبيت الحزم وتهيئة قاعدة البيانات
افتح الـ Terminal في cPanel أو شغّل الأوامر:
```bash
npm install --production=false
npm run db:setup
```
> سيقوم أمر `db:setup` بإنشاء الجداول وحقن بيانات قهوة كايرو (الأصناف، الأقسام، الطاولات، الإعدادات، وفرع ستريب مول).

### 4. إعادة تشغيل التطبيق (Restart)
من لوحة **Setup Node.js App** في cPanel:
- Application Root: مسار المجلد (مثلاً `resto`)
- Application Startup File: `server.js`
- اضغط **Restart** أو انقر على رابط التطبيق.

---

## الحساب الافتراضي للمدير (Super Admin)
- **اسم المستخدم**: `admin`
- **كلمة المرور الافتراضية**: `admin@password123` (أو القيمة المحددة في `INITIAL_ADMIN_PASSWORD`)
- **لوحة التحكم**: `/admin`
- **نقطة البيع (الكاشير)**: `/pos`
