<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->


# Restaurant Platform — Product & Engineering Constitution
> **Next.js 16 Full-Stack Edition (Next.js 16 + TypeScript + MySQL + Prisma + Zod + JWT)**  
> **Source of Truth:** This file is the binding contract and single source of truth for every engineer, architect, and AI agent working on this system. Read it before planning, coding, reviewing, or generating database schemas. All rules in this document are mandatory.

---

# 📜 ميثاق العمل والقواعد الذهبية لمنظومة MASA (GOLDEN CHARTER)

> **القاعدة الحاكمة والأولى (The Sovereign Rule):**  
> **ممنوع منعاً باتاً كتابة أي سطر كود أو تشغيل أي أداة تعديل أو تثبيت أي حزمة قبل:**  
> 1. التفكير والتحليل المشترك مع المستخدم.  
> 2. وضع خطة معمارية واضحة ومناقشتها تفصيلياً.  
> 3. أخذ رأي وموافقة المستخدم الصريحة (المشاركة الحقيقية وعدم التهميش).

---

## 🏆 القواعد الذهبية (Clean Code + SOLID + OOP) — معايير إلزامية

> تُفرض هذه القواعد صراحةً على منظومة الـ Next.js 16 Full-Stack (معمارية Modular Clean Architecture) بكافة طبقاتها: الـ Domain، الـ Application (Server Actions / Use Cases)، الـ Infrastructure (Prisma & MySQL)، وواجهات الـ App Router (الموقع العام، لوحة الإدارة، والـ POS).  
> **تعريف الإنجاز (Definition of Done):** أي ميزة لا تُعتبر مكتملة إلا بعد الامتثال الصارم للقواعد وفحصها في المراجعة واجتياز الاختبارات.  
> **الفلسفة:** الكود يُقرأ أكثر مما يُكتب — فالنظافة، الأمان المالي، التسميات الواضحة، والوقار البصري ليست ترفاً، بل صلب النظام.

### القواعد الأساسية + أعمدة SOLID + Clean Code

| ID | القاعدة | المبدأ | المعنى العملي في بيئة Next.js & TypeScript |
|---|---|---|---|
| **GR-1** | **DRY — لا تكرار** | DRY + SRP | ممنوع تكرار منطق واحد (مثل حساب الأسعار، الضرائب، أو الخصومات). أي منطق يتكرر >2 مرات يتحول لـ Service / Value Object / Use Case موحد. |
| **GR-2** | **YAGNI — ما تبنيش اللي مش محتاجه** | YAGNI | ممنوع الـ stubs والراوترات الوهمية والميزات التخمينية (مثل Pickup أو Marketplace). أي route أو Server Action معلن يجب أن يعمل فعلياً. |
| **GR-3** | **SoC — فصل المسؤوليات (SRP)** | SRP | الـ Route Handlers والـ Server Actions نحيفة جداً (≤ 30 سطر). العمليات توكل لـ Application Use Cases مستقلة ومختبرة. |
| **GR-4** | **الأمان والدقة** | Idempotency + Security + 12-Factor | عمليات إنشاء الطلبات، المدفوعات، وتعديل المخزون متكررة بأمان (Idempotent). بيانات العملاء (PII) مشفرة ومحجوبة في الـ Logs. قراءة المتغيرات حصراً عبر Config موحد ومدعوم بـ Zod validation وليس `process.env` العشوائي. |
| **GR-5** | **الأداء** | Batch + Index + Async | ممنوع N+1 في استعلامات Prisma. استخدام `include` و `select` الموجه وفهارس MySQL الصريحة. العمليات الثقيلة (إشعارات، فواتير، تقارير) تتم في الخلفية أو كـ Async Tasks. |
| **GR-6** | **OCP — مفتوح للامتداد، مغلق للتعديل** | OCP | إضافة بوابة دفع جديدة، حالة طلب جديدة، أو طريقة إشعار = **إضافة كود جديد فقط** عبر Interfaces / Strategies / Registries دون المساس بالكود المستقر. |
| **GR-7** | **DIP — الاعتماد على التجريد** | DIP | طبقة الـ Domain والـ Application تعتمد على **Contracts / Interfaces** (مثل `PaymentGateway`، `ReceiptPrinter`) لسهولة الـ Mocking والاختبار وتبديل المزودين. |
| **GR-8** | **OOP — Enums + Value Objects + Branch Scopes** | OOP | ممنوع الـ magic strings (كل الحالات معرفة كـ TypeScript Enums)، المبالغ كائن `Money` حصراً، سياق الفروع منضبط عبر Branch Context دون أي multi-tenant أو restaurant_id. |
| **GR-9** | **Clean Code — أخطاء موحدة** | Clean Code | تسلسل أخطاء صريح (`DomainError`, `NotFoundError`, `ValidationError`) مع ردود منضبطة للـ Actions والـ APIs. |
| **GR-10** | **Clean Code — دوال صغيرة وتسمية** | Clean Code | الدوال ≤ ~30 سطر، أسماء معبرة بالإنجليزية البرمجية، كود خالٍ من التعليقات الزائدة أو الـ dead code. |

---

### مصفوفة الامتثال للهندسة والـ Full-Stack (إلزامية التنفيذ)

| القاعدة الهندسية | مبدأ SOLID | التطبيق في بيئة Next.js + MySQL | الملفات والأنماط المطلوبة |
|---|---|---|---|
| **GR-1.1** — تطبيع مالي مكرر | DRY + SRP | كل الأسعار والمبالغ تمر عبر **كائن Money واحد** — ممنوع استخدام float أو دوال تقريب عشوائية | `src/domain/shared/value-objects/money.ts` |
| **GR-1.2** — مفتاح Rate Limiter مكرر | DRY | مفاتيح الـ rate limiting (لطلبات الويب، تسجيل الدخول، إنشاء الطلبات) في مرجع موحد | `src/infrastructure/security/rate-limiter-keys.ts` |
| **GR-1.3** — سياسة المخزون والمكونات مكررة | DRY + SRP | استهلاك المكونات وفق الوصفات (BOM) وقواعد النواقص في Domain Service موحد | `src/domain/inventory/services/inventory-consumption.service.ts` |
| **GR-1.4** — فحص الصلاحيات مكرر | OCP + DRY | فحص الصلاحيات ونطاق الفرع عبر Guards و Middlewares مركزية تعتمد على JWT والـ Capabilities | `src/infrastructure/auth/rbac-guard.ts` |
| **GR-2.1** — Routes وهمية | YAGNI | ممنوع الـ routes غير المكتملة أو الـ stubs — أي route يضاف ينفذ وظيفته فوراً | `src/app/**/page.tsx` & `src/app/api/**` |
| **GR-2.2** — ميزات تخمينية | YAGNI | تطبيق نطاق العمل المحدد فقط (Delivery للموقع العام، بدون Pickup أو Multi-vendor) | الالتزام بحدود المنتج |
| **GR-3.1** — Action أو Route Handler سمين | SRP | الـ Server Actions والـ Route Handlers لا تتعدى 30 سطر؛ تفويض المهام لـ Application Use Cases | `src/application/**/use-cases/*` |
| **GR-3.2** — منطق تسعير في الواجهة | SRP | السيرفر يحسب إجمالي الطلب بشكل حتمي؛ لا ثقة بحسابات المتصفح إطلاقاً | `src/domain/ordering/services/order-pricing.service.ts` |
| **GR-3.3** — تشفير الحسابات والبيانات | SRP | تشفير مفاتيح الربط الخارجي وكلمات المرور عبر Bcrypt/Argon2 والبيانات الحساسة بتشفير AES | `src/infrastructure/security/crypto.service.ts` |
| **GR-4.1** — حماية تكرار العمليات | Idempotency | اعتماد Idempotency Keys لإنهاء الطلبات عبر الإنترنت ودفعات الـ POS | `src/infrastructure/security/idempotency.service.ts` |
| **GR-4.2** — خصوصية بيانات الزبائن (PII) | Data Protection | حجب أرقام هواتف وعناوين الزبائن في الـ Logs لمنع تسرب البيانات | `src/infrastructure/logging/log-masker.ts` |
| **GR-4.3** — `process.env` المباشر | 12-Factor | ممنوع استدعاء `process.env` في الكود مباشرة؛ القراءة حصراً عبر كائن إعدادات مدعوم بـ Zod | `src/infrastructure/config/env.ts` |
| **GR-5.1** — N+1 في استعلامات Prisma | Batch + Index | استخدام `include` و `select` الموجه وفهارس MySQL على المفاتيح الأجنبية | Prisma Schema Indexes + Queries |
| **GR-5.2** — استعلامات الفروع والمخزون | Index + Scopes | فهارس MySQL صريحة على `branch_id` وحالات الطلبات للوصول السريع | `prisma/schema.prisma` |
| **GR-5.3** — Blocking في معالجة الطلبات | Async | إرسال الإشعارات والطباعة الخارجية داخل Background Tasks | `src/infrastructure/jobs/*` |
| **GR-5.4** — حزم الفرونت إند | Code Splitting | دعم الـ React Dynamic Imports والتحميل التدريجي للمكونات الثقيلة | `next/dynamic` |
| **GR-6.1** — معالجة الدفع المتعدد | OCP | معالجة بوابات الدفع المختلفة عبر Strategy/Registry من الـ Handlers | `PaymentGatewayRegistry` |
| **GR-6.2** — دورة حياة الطلب | OCP | الانتقال بين حالات الطلب عبر State Machine / Event Handlers صريحة | `OrderStatus` Enums & Transitions |
| **GR-7.1** — بوابات خارجية معتمدة على التجريد | DIP | بوابات الدفع وقنوات الرسائل مبنية عبر Interfaces واضحة | `src/domain/shared/contracts/*` |
| **GR-8.1** — Magic Strings | OOP | جميع الحالات والمصادر معرفة كـ TypeScript Enums | `src/domain/**/enums/*` |
| **GR-8.2** — معالجة الأموال | OOP | `Money` كـ Value Object يحظر الـ float ويضمن الحسابات بالـ Minor Units | `src/domain/shared/value-objects/money.ts` |
| **GR-8.3** — سياق الفروع (Branch Scope) | OOP | عزل نطاق الفرع للعمليات الميدانية (وردية، مخزن، POS) بدون فرض tenant_id | `BranchContextService` |
| **GR-9.1** — تشتت معالجة الأخطاء | Clean | فئات `DomainError` متخصصة مع معالجة مركزية موحدة | `src/domain/shared/errors/*` |
| **GR-10.1** — جودة ونظافة الدوال | Clean | دوال مركزة وصغيرة (≤ 30 سطر)، تسميات معبرة، بدون dead code | Clean Code Standards |

---

# 🎨 ميثاق الهوية البصرية وتصميم الواجهات (UI/UX CONSTITUTION)

> **قاعدة الوقار والاحترافية (The Professional Dignity Rule):**  
> النظام هو منصة أعمال ومطاعم احترافية من الطراز الأول (Enterprise Restaurant Platform)، وليس قالباً تجريبياً أو مساحة للألعاب.

### 1. حظر تام للرموز التعبيرية (STRICT BAN ON CARTOON EMOJIS)
- **ممنوع منعاً باتاً** استخدام أي Emoji (مثل 🍽️, 🏢, 👥, ⚙️, 📊, ➕, ✏️, etc.) داخل الواجهات أو العناوين أو الأزرار أو القوائم أو الجداول.
- البديل الإلزامي والوحيد هو: **أيقونات متجهة احترافية دقيقة (SVG Icons)** عبر مكتبة **`lucide-react`** بضربات خط نظيفة (stroke width: 1.5 - 2px) وقياسات منضبطة.

### 2. فلسفة الألوان المعتمدة (Sophisticated Muted Palette)
- **منع الألوان الفاقعة والطفولية:** حظر استخدام البرتقالي الفاقع الصارخ أو الألوان النيون التي توحي بقوالب الهواة وتجهد أعين الموظفين أثناء ساعات العمل الطويلة.
- **الأساس اللوني (Neutral Foundation):** استخدام لوحة ألوان راقية وهادئة قائمة على درجات الـ **Zinc / Slate** (من الرمادي الخافت للخلفيات `#f8fafc` / `#f4f4f5`، إلى الفحم العميق للنصوص `#09090b` / `#0f172a`).
- **اللمسات اللونية المدروسة (Accent Tokens):**
  - الإجراءات الأساسية: لون هادئ وأنيق مثل الكحلي العميق (Deep Navy / Indigo) أو الرمادي الفحمي الراقي، مع تباين واضح ومريح.
  - حالات النجاح: أخضر زمردي هادئ ومريح (`emerald-600` / `emerald-700`).
  - حالات التنبيه: كهرماني هادئ (`amber-700`).
  - حالات الخطر: أحمر قرميدي منضبط (`rose-600` / `rose-700`).

### 3. دعم العربية والأبعاد (Native RTL First)
- النظام موجه للمطاعم العربية أولاً؛ واجهات الإدارة والموقع العام مصممة بـ `dir="rtl"` أصيل.
- استخدام خطوط عربية حديثة وعالية المقروئية (مثل Cairo أو IBM Plex Sans Arabic).
- التباعدات (Padding & Margins) مدروسة بدقة وتناسق هندسي متزن.

---

# 1. Product Vision & Architecture

Build a single-tenant, multi-branch, high-performance restaurant platform:

1. **Branded Public Website & Digital Menu:**
   - Server-rendered with Next.js App Router for optimal SEO.
   - Digital menu at `/menu` (the exact destination for in-restaurant QR codes).
   - Cart and Guest Checkout for **Delivery Orders Only** (no pickup, no forced account registration).
2. **Online Order Center:**
   - Central operational cockpit receiving web delivery orders, with full lifecycle management and manual/auditable branch assignment.
3. **Touch-Optimized POS:**
   - Ultra-fast, touch-friendly POS interface for cashiers at physical branches, tied directly to cash shifts.
4. **CRM & Customers:**
   - Automatically builds normalized customer profiles based on standardized phone numbers and order history at the business level.
5. **Multi-Branch Operations:**
   - Single restaurant business with multiple physical branches.
   - Core catalog, brand, and customer database exist centrally.
   - Branch-level scoping: POS transactions, assigned orders, stock/warehouses, cash shifts, local expenses, and product availability.
   - **NO multi-tenant SaaS architecture. NO `tenant_id` or `restaurant_id` isolation layer.**
6. **Ingredient-Aware Inventory & BOM Recipes:**
   - Stock deducted per ingredient/recipe (Bill of Materials) when dishes are sold.
   - Immutable movement ledger for inventory adjustments, purchases, and waste.
7. **Operational Finance & Cash Shifts:**
   - Cash shifts management (Opening cash, cash in/out, closing counts, variance analysis).
   - Expenses tracking and gross profit reporting.

---

# 2. Technical Stack (Next.js 16 Full-Stack)

- **Framework:** Next.js 16 (App Router, React 19, React Server Components, Server Actions, Route Handlers)
- **Language:** TypeScript in Strict Mode (`strict: true`, no `any`)
- **Database:** MySQL
- **ORM / Database Client:** Prisma ORM (`prisma`, `@prisma/client`)
- **Data Validation & DTOs:** Zod
- **Authentication & Security:** JWT (`jose`) in httpOnly, secure, sameSite cookies + `bcryptjs` for password hashing
- **Styling:** Tailwind CSS (v4)
- **Iconography:** `lucide-react` (Strictly no cartoon emojis)
- **Testing:** Vitest / Jest for unit and domain tests, Playwright for E2E
- **Architecture:** Modular Clean Architecture (Domain, Application, Infrastructure, Presentation)

---

# 3. Layer Responsibilities & Directory Structure

```text
src/
├── domain/                      # Pure Business Rules (Zero framework dependencies)
│   ├── shared/                  # Value Objects (Money), Result types, Domain contracts
│   │   ├── value-objects/       # money.ts (Strict integer minor units, NO floats)
│   │   └── contracts/           # Repository & Gateway interfaces
│   ├── branches/                # Branch entities & domain rules
│   ├── staff/                   # Staff, Role, Permission entities & Enums
│   ├── catalog/                 # Menu, Categories, Products, Sizes, Modifiers
│   ├── ordering/                # Order aggregate, OrderStatus, OrderPricingService
│   ├── inventory/               # InventoryItem, Recipe (BOM), InventoryConsumptionService
│   ├── finance/                 # CashShift, Expense entities
│   └── customers/               # Customer, Address, CustomerMatchingService
│
├── application/                 # Use Cases, Orchestration, DTOs, Zod Schemas
│   ├── branches/                # CreateBranchUseCase, UpdateBranchUseCase
│   ├── staff/                   # StaffUseCases, AuthenticateStaffUseCase
│   ├── catalog/                 # ManageMenuUseCases
│   ├── ordering/                # PlaceOnlineOrderUseCase, AssignOrderToBranchUseCase
│   └── shared/                  # Common DTOs and Zod validation utilities
│
├── infrastructure/              # Framework details, DB persistence, Adapters
│   ├── db/                      # prisma.ts (Singleton Prisma client), seeds
│   ├── auth/                    # jwt.service.ts, password.service.ts, session.ts
│   ├── security/                # rate-limiter.ts, idempotency.service.ts
│   ├── logging/                 # log-masker.ts (PII protection)
│   └── config/                  # env.ts (Type-safe Zod-validated environment config)
│
└── app/                         # Next.js 16 App Router Presentation Layer
    ├── (storefront)/            # Branded Public Website & QR Menu
    │   ├── page.tsx             # Homepage
    │   ├── menu/page.tsx        # Public Menu & QR Destination
    │   ├── cart/page.tsx        # Delivery Cart
    │   ├── checkout/page.tsx    # Guest Delivery Checkout
    │   └── order/[code]/page.tsx# Public Safe Order Tracker
    │
    ├── (admin)/admin/           # Back-Office Management ERP
    │   ├── layout.tsx           # Admin layout (Clean sidebar, BranchSwitcher, no emojis)
    │   ├── page.tsx             # Operations Dashboard
    │   ├── branches/page.tsx    # Branch Management
    │   ├── staff/page.tsx       # Staff & RBAC Management
    │   ├── menu/page.tsx        # Menu & Catalog Management
    │   ├── orders/page.tsx      # Online Order Operations Center
    │   ├── inventory/page.tsx   # Ingredients & BOM Recipes
    │   ├── finance/page.tsx     # Cash Shifts & Expenses
    │   └── settings/page.tsx    # Restaurant Profile & Settings
    │
    ├── (pos)/pos/               # High-Speed Touch POS Interface
    │   └── page.tsx             # Cashier POS Interface
    │
    └── api/                     # Route Handlers for Webhooks & Background Tasks
```

---

# 🗺️ خارطة الطريق التنفيذية وسجل التقدم (Master Roadmap & Progress Tracker)

> **قاعدة التسليم والاستلام المستمر (Continuous Handoff Rule):**  
> بعد إنهاء كل مرحلة من مراحل هذا المشروع، **يجب إلزامياً** تحديث هذا الميثاق لتوثيق:  
> 1. **ما تم إنجازه بدقة:** جداول Prisma، كائنات المجال (Domain Models/Enums/Value Objects)، العمليات (Use Cases/Actions)، والواجهات.  
> 2. **الحالة الراهنة للمشروع (Current System State):** أين يقف النظام الآن؟ وما هي الأجزاء الحية القابلة للتشغيل؟  
> 3. **نتائج الفحص والاختبارات (Verification):** حالة الـ Tests والبناء للتأكد من عدم ترك أي كسر.  
> 4. **دليل الانتقال للمرحلة التالية (Next Step Handoff):** توجيه واضح ومفصل لأي مطور أو وكيل ذكاء اصطناعي يقرأ هذا الملف ليعرف بالضبط من أين يبدأ في الخطوة القادمة دون أي تضارب أو إعادة اختراع للعجلة.

---

### جدول تتبع إنجاز المراحل (Status Matrix)

| المرحلة | الوصف | الحالة | الملفات المنجزة والملاحظات |
|---|---|---|---|
| **Phase 0** | **تأسيس بيئة Next.js 16 والمعمارية النظيفة** | **[x] مكتملة** | تم تأسيس Next.js 16.3.6، Prisma 7.10، كائن `Money`، Zod، JWT، و 19 اختباراً آلياً ناجحاً بنسبة 100%. |
| **Phase 1** | **النواة، الفروع، والمستخدمين والصلاحيات (RBAC)** | **[x] مكتملة** | بناء جداول Prisma، إعدادات المطعم الديناميكية، عزل الفروع، RBAC، لوحة الإدارة، و 35 اختباراً ناجحاً. |
| **Phase 2** | **الكتالوج، المنيو، والإضافات** | **[x] مكتملة** | تصنيفات وأصناف ومقاسات وإضافات وتوفر على مستوى الفرع، إدارة موبايل فيرست، 39 اختباراً ناجحاً وبناء إنتاجي ناجح. |
| **Phase 3** | **إدارة الزبائن وسجل العناوين (CRM)** | **[x] مكتملة** | جداول Prisma (Customer/CustomerAddress)، تطبيع E.164، خدمة المطابقة، لوحة الإدارة /admin/customers، 59 اختباراً ناجحاً 100%. |
| **Phase 4** | **الموقع العام والمنيو وسلة التوصيل** | **[x] مكتملة** | موقع عام متوافق مع روح Crispy Kitchen وثنائي اللغة (عربي RTL أولاً وإنجليزي)، فيديو وسلايدر تفاعلي، منيو رقمي QR، سلة وتسعير بـ Money، Checkout ضيوف مرتبط بالـ CRM، متتبع طلبات آمن بحجب الهاتف، 70 اختباراً ناجحاً، وبناء إنتاجي 100%. |
| **Phase 5** | **مركز إدارة الطلبات الإلكترونية** | **[x] مكتملة** | قمرة قيادة حية بـ `/admin/orders`، بطاقات تشغيلية سريعة، تحديث تلقائي (20ث) وتنبيه صوتي (Web Audio API)، إسناد الفروع، آلة حالات صارمة (State Machine)، طباعة إيصالات حرارية 80mm، و 12 اختباراً جديداً وبناء 15 مساراً بنجاح. |
| **Phase 6** | **نقطة البيع للمطعم (POS)** | **[x] مكتملة** | واجهة RTL لمسية، مقاسات وإضافات، خصم بصلاحية، نقدي/بطاقة/مختلط، طباعة وإعادة طباعة 80mm، فتح وإغلاق وردية، منع التكرار والتزامن، 103 اختبارات ناجحة وبناء إنتاجي ناجح. |
| **Phase 7** | **المخزون والوصفات والمشتريات** | **[x] مكتملة** | بطاقات المكونات، وصفات BOM اختيارية، خصم آلي بـ POS، رصيد سالب معتمد، صرف تشغيل للمطبخ، عزل الفروع الصارم عبر BranchContextService، موردين وأوامر شراء، سجل حركات محاسبي غير قابل للتعديل، 123 اختباراً ناجحاً 100%، وفحص متصفح Playwright كامل بالصور وبناء إنتاجي ناجح. |
| **Phase 8** | **المالية والورديات والمصروفات** | **[x] مكتملة** | ورديات الكاشير النقدية (إيداع وسحب، إغلاق أعمى، عجز وزيادة)، تسجيل المصروفات الميدانية (درج الوردية مقابل الخزينة)، تقرير مجمل الأرباح وتكلفة المبيعات COGS، واجهة إدارة كاملة بـ 3 تبويبات، 142 اختباراً ناجحاً بنسبة 100%، وفحص متصفح Playwright كامل بالصور. |
| **Phase 9** | **التقارير والتدقيق وجاهزية الإنتاج** | **[x] مكتملة** | قمرة التقارير الإدارية /admin/reports بأربعة أبعاد ومؤشرات مالية دقيقة، تحصين صفحات الإدارة بحراسة RBAC Guard، فلترة الشريط الجانبي ديناميكياً حسب صلاحيات الجلسة، دور المحاسب ACCOUNTANT، فهارس Prisma المحسنة، 155 اختباراً ناجحاً بنسبة 100%، فحص Playwright E2E بالمتصفح، وبناء إنتاجي ناجح لجميع المسارات الـ 18. |
| **Phase 10** | **إدارة الصالة والطاولات (Dine-in & Tables)** | **[x] مكتملة** | أقسام الصالة، طاولات برقم وسعة وشكل وعزل فروع، طلبات مفتوحة (Open Tab)، نقل طاولات، تقسيم الشيك (Split Bill)، طباعة شيك 80mm، خريطة صالة تفاعلية في الـ POS، لوحة إدارة /admin/tables، 176 اختباراً ناجحاً بنسبة 100%، وبناء إنتاجي ناجح لجميع المسارات الـ 17. |
| **Phase 11** | **أسطول التوصيل والطيارين وإقفال العهدة المالية (Fleet Dispatcher & Settlement)** | **[x] مكتملة** | سجل كباتن التوصيل معزول بالفروع، إسناد الطلبات وخروجها للتوصيل مع طيار، عرض كابتن التوصيل برابط اتصال في متتبع الطلب، إقفال عهدة الكاش وتوريدها للوردية النشطة، طباعة إيصال تصفية عهدة 80mm، 189 اختباراً ناجحاً 100%، وبناء إنتاجي ناجح لكافة المسارات. |
| **Phase 12** | **تحسينات تجربة المستخدم للـ POS ومعالجة التسلسل (POS UX Overhaul & Serialization)** | **[x] مكتملة** | إعادة هندسة مساحات السلة والشاشة للدفع والمنتجات، تطبيع Decimal لـ Number في كافة Use Cases، 189 اختباراً ناجحاً 100%. |
| **Phase 13** | **محرك المطبخ وبونات التحضير التفاعلية (Kitchen Engine — KDS & KOT 80mm)** | **[x] مكتملة** | شاشة تفاعلية KDS بـ `/admin/kitchen`، عدادات زمنية حية، تنبيه صوتي للطلبات الجديدة، تفريغ بنقرة واحدة (Bump)، بون مطبخ حراري 80mm خالي من الأسعار مدمج بالـ POS والطلبات، 192 اختباراً ناجحاً 100%، وبناء إنتاجي ناجح لجميع المسارات الـ 18. |
| **Phase 14** | **سجل الفواتير الشامل وتناغم القنوات المتعددة (Unified Invoices & Cross-Flow Integration)** | **[x] مكتملة** | مركز تدقيق ومراجعة الفواتير `/admin/invoices`، دعم مبيعات POS والصالة والسفري والتوصيل في استعلامات الإدارة، فلاتر القناة وطريقة السداد، قفل الطاولات ضد التزامن الذري (SELECT FOR UPDATE)، إشعار كاشير الـ POS بجهوزية الأطباق، 197 اختباراً ناجحاً بنسبة 100%، وبناء إنتاجي لـ 19 مساراً. |
| **Phase 15** | **منظومة الطباعة المزدوجة لبونات المطبخ KOT وإعادة هيكلة KDS للشاشات الميدانية (Dual KOT Printing & KDS Field Overhaul)** | **[x] مكتملة** | نافذة خيارات ما بعد البيع في الـ POS مع خيار الطباعة التلقائية لبون المطبخ KOT وفاتورة العميل، إدخال طلبات الكاشير لصف التحضير، شاشة KDS مستقلة بعرض الشاشة بالكامل دون شريط جانبي مع بطاقات استجابة ديناميكية لمنع التفاف الأرقام، 197 اختباراً ناجحاً وبناء إنتاجي لـ 19 مساراً. |
| **Phase 16** | **الترقيم التسلسلي البشري للطلبات ودرع العزل الشامل للطباعة الحرارية 80mm (Human Order Numbers & Thermal Print Shield)** | **[x] مكتملة** | خدمة توليد أرقام متسلسلة بشرية ذرية تبدأ من 1001 بدلاً من أكواد الـ UUID الطويلة، درع CSS شامل للطباعة يمنع طباعة أي أجزاء من الموقع أو النوافذ المتداخلة، حصر مستند الطباعة النشط لمنع تداخل الوظائف، 201 اختبار ناجح بنسبة 100%، وبناء إنتاجي كامل. |
| **Phase 17** | **إعادة هندسة وتطوير قمرة سجل الفواتير الشاملة `/admin/invoices` (Executive Invoices Cockpit Overhaul)** | **[x] مكتملة** | إعادة تصميم بطاقات المؤشرات بأيقونات وأرقام مونو غير قابلة للالتفاف، تنظيم الفلاتر على مستويين متناسقين، ضبط عروض أعمدة جدول الفواتير لمنع تكسر أرقام الطلبات، إضافة نظام ترقيم الصفحات (Pagination) وأحجام العرض، وتصدير Excel/CSV باللغة العربية، 201 اختبار ناجح وبناء إنتاجي لـ 19 مساراً. |
| **Phase 18** | **تأسيس بيئة العرض التجريبية، الموقع متعدد الصفحات، ومحرك QR المنيو ورفع الصور (Staging Ready, Multi-Page Web, QR Engine & Uploads)** | **[x] مكتملة** | تنظيف وتصفير قاعدة البيانات بـ 3 فروع واقعية (المعادي، التجمع، مدينة نصر)، 5 حسابات تجريبية موحدة بكلمة سر 123456 مع شريط تعبئة سريع في /login، 20 صنفاً فاخراً ومصوراً، صفحات موقع عام مستقلة (/about, /branches, /contact)، محرك توليد وطباعة كود الـ QR للمنيو لستاندات الطاولات وكروت الدعاية، آلية رفع الصور وحفظها محلياً في public/uploads/products/، 208 اختبارات ناجحة وبناء إنتاجي لـ 21 مساراً بنجاح. |
| **Phase 19** | **تحسين الواجهة الأمامية للموقع العام والأنيميشن (Storefront UI Enhancements & Animations)** | **[x] مكتملة** | إصلاح تحذيرات الأداء (LCP و Font Preload)، إضافة تأثيرات CSS وأنيميشن لملف globals.css، إعادة بناء شاشة الصفحة الرئيسية home-client.tsx بالكامل مع أقسام جديدة (Stats, Marquee Reviews, Why Us, Featured Products)، وإضافة شارة "الأكثر طلباً" للمنتجات المميزة في قائمة الطعام menu-client.tsx. تم اجتياز 211 اختبار بنجاح، ونجاح البناء الإنتاجي بالكامل بدون أخطاء. |
| **Phase 20** | **نافذة تفاصيل الوجبة التفاعلية وتبسيط ترقيم الطلبات (Product Detail Modal & Clean Daily Web Orders)** | **[x] مكتملة** | بناء نافذة تفاعلية (Popup Modal) فاخرة ومستجيبة (Bottom Sheet للموبايل ومودال متمركز للديسكتوب) تُفتح عند النقر على صورة أو اسم الوجبة في المنيو مع خيارات المقاسات والإضافات والكمية وإجمالي لحظي، تبسيط وتوحيد صيغة أرقام طلبات الويب لتصبح تسلسلية يومية مقروءة بشرياً (`WEB-YYYYMMDD-NNN`) ذرية داخل المعاملة (FOR UPDATE)، إزالة تنبيهات Preload الخط تماماً. 211 اختباراً ناجحاً بنسبة 100% وبناء إنتاجي ناجح لجميع المسارات الـ 21. |

---

### 📋 تفاصيل المراحل ومحطات التسليم (Phased Milestones)

#### المرحلة 0: تأسيس بيئة Next.js 16 والمعمارية النظيفة (Foundation) — [x] مكتملة
- **الهدف:** بناء الأساس التقني الكامل لمشروع Next.js 16 Full-Stack المتوافق مع معايير المشروع.
- **ما تم إنجازه بدقة:**
  - تهيئة مشروع Next.js 16.3.6 مع React 19 و TypeScript في الوضع الصارم (`strict: true`) و Tailwind CSS v4.
  - تثبيت أحدث الحزم: `@prisma/client 7.10`, `prisma 7.10`, `zod 4.6`, `jose 6.2`, `bcryptjs 3.0`, `lucide-react 1.48`, `vitest 5.0`.
  - إعداد كائن القيمة المالي `Money` (`src/domain/shared/value-objects/money.ts`) بالـ minor units وخوارزمية التوزيع العادل (Hare-Niemeyer).
  - إعداد شجرة أخطاء المجال الموحدة (`src/domain/shared/errors/domain-error.ts`).
  - إعداد الـ Enums الدومينية (`src/domain/ordering/enums/index.ts`).
  - إعداد التحقق من البيئة عبر Zod ومنع `process.env` المباشر (`src/infrastructure/config/env.ts`).
  - إعداد حاجب البيانات الحساسة للسجلات `LogMasker` (`src/infrastructure/logging/log-masker.ts`).
  - إعداد خدمة المصادقة `JwtService` عبر `jose` وخدمة كلمات المرور `PasswordService` عبر `bcryptjs`.
  - إعداد Prisma 7 مع MySQL عبر `prisma.config.ts` و `prisma/schema.prisma` و Singleton Prisma Client.
- **نتائج الفحص والاختبارات:**
  - اجتياز 19 اختباراً آلياً بنسبة 100% عبر `vitest run` تغطي العمليات المالية والحماية والتشفير والـ PII.
  - نجاح البناء الإنتاجي بالكامل عبر `next build` بدون أي أخطاء نوعية أو تحذيرات.

#### المرحلة 1: النواة المشتركة، الفروع، والمستخدمين والصلاحيات (Core, Branches & RBAC) — [x] مكتملة ومراجعة سطرية 100%
- **الهدف:** بناء قاعدة البيانات للمطعم الموحد، الفروع التابعة، المستخدمين، والصلاحيات المنضبطة بسياق الفرع، مع خلو تام من أي هاردكود أو أخطاء.
- **ما تم إنجازه بدقة:**
  - جداول Prisma: `RestaurantSetting`, `Branch`, `Permission`, `Role`, `RolePermission`, `User`, `UserBranch` (مع اعتماد `snake_case` المعياري الصارم لكافة الأعمدة مثل `user_id` و `branch_id`).
  - تفعيل الاتصال مع MySQL عبر محول `@prisma/adapter-mariadb` بنجاح ومزامنة الجداول (`prisma db push`).
  - تغذية البيانات الأولية عبر سكريبت `prisma/seed.ts` (صلاحيات النظام، الأدوار الافتراضية، إعدادات المطعم بالعملة الديناميكية، الفرع الرئيسي، وحساب المدير العام).
  - كائنات المجال والـ Enums: `PermissionCode`, `SystemRole`, `Branch` entity, `RestaurantSetting` entity, `User` entity (مع استكمال دوال التحقق `validate()` لكافة الحقول الإلزامية مثل `phone` و `passwordHash`).
  - خدمات الأمان والبنية التحتية: `BranchContextService` (عزل نطاق الفروع الميدانية بدون فرض tenant_id)، و `RbacGuard` (فحص الصلاحيات المرتكزة على القدرات)، وإلزامية `JWT_SECRET` في البيئة دون أي قيم افتراضية غير آمنة، وحذف `DEFAULT_CURRENCY` من البيئة لكونها خاصية ديناميكية تؤخذ من قاعدة البيانات حصراً.
  - طبقة التطبيق (Use Cases & Server Actions):
    - فروع: `CreateBranchUseCase`, `ListBranchesUseCase`, `ToggleBranchStatusUseCase`, و `branch.actions.ts`.
    - موظفون: `CreateStaffUseCase` (مرتبط بكيان المجال `User.create`), `ListStaffUseCase`, `AuthenticateStaffUseCase`, و `staff.actions.ts`.
    - إعدادات: `GetSettingsUseCase` (يرمي `NotFoundError` النظيف دون أي هاردكود), `UpdateSettingsUseCase`, و `settings.actions.ts`.
    - معيار موحد لخوادم الإجراءات: اعتماد كائن `ActionResult<T>` الموحد ودالة `toActionFailure` لمعالجة أخطاء المجال والتحقق بانضباط تام وفق **GR-9**.
  - واجهات لوحة الإدارة والموقع (App Router):
    - تخطيط الإدارة `admin/layout.tsx` بقائمة جانبية خالية من الروابط الوهمية الميتة (حظر الـ 404 وفق **GR-2.1**).
    - مبدل الفروع التفاعلي `BranchSwitcher` في الشريط العلوي، متصل بسياق الخادم عبر كوكي آمنة `resto_active_branch_id` وسيرفر أكشن سريع.
    - لوحة العمليات المركزية `admin/page.tsx` بشاشات ديناميكية خالية من نصوص الهاردكود للعملة أو الفروع.
    - شاشات الإدارة: `admin/branches/page.tsx` و `admin/staff/page.tsx` و `admin/settings/page.tsx` تعتمد حصرياً على الـ Use Cases (تحقيق **GR-3 SoC**).
    - صفحة البداية `src/app/page.tsx`: واجهة عربية وقورة تعبر عن هوية المنظومة وتوجه إلى لوحة الإدارة.
    - الامتثال التام لميثاق الهوية البصرية: حظر تام للإيموجيز، أيقونات `lucide-react`، ألوان هادئة (Zinc/Slate)، ودعم RTL أصيل بخط Cairo.
- **نتائج الفحص والاختبارات:**
  - اجتياز **35 اختباراً آلياً** بنسبة 100% عبر Vitest تغطي الفروع، الإعدادات، الصلاحيات، وتوثيق الموظفين عبر JWT.
  - نجاح بناء المشروع الإنتاجي بالكامل عبر `next build` بدون أي أخطاء نوعية أو تحذيرات وبأداء كامل لـ Dynamic Server Rendering و Static Pages.
- **دليل الانتقال للمرحلة التالية (Next Step Handoff):**
  - الانتقال إلى **المرحلة 2 (Phase 2: الكتالوج، المنيو، والإضافات Menu, Products & Modifiers)**.
  - البدء بنمذجة جداول الكتالوج في `prisma/schema.prisma` (`Category`, `Product`, `ProductSize`, `ModifierGroup`, `Modifier`, `BranchProductAvailability`).
  - تأسيس خدمات تسعير المنتجات وحساب المقاسات عبر كائن `Money` المالي بالعملة الحية للمطعم.

#### المرحلة 2: الكتالوج، المنيو، والإضافات (Menu, Products & Modifiers) — [x] مكتملة
- **ما تم إنجازه بدقة:**
  - جداول Prisma: `Category`, `Product`, `ProductSize`, `ModifierGroup`, `Modifier`, `ProductModifierGroup`, و `BranchProductAvailability` مع فهارس وعلاقات الحذف المناسبة.
  - تطبيق migration `20260928_phase2_catalog` على MySQL مع إعادة تسمية عمودي `userId` و`branchId` إلى `user_id` و`branch_id` باستخدام `CHANGE COLUMN` للحفاظ على روابط الموظفين بالفروع.
  - طبقة الكتالوج: DTOs والتحقق بـ Zod، قراءة مجمعة للكتالوج والفروع، وحالات حفظ التصنيفات والمنتجات ومجموعات الإضافات والتوفر والأرشفة.
  - حماية عمليات تعديل الكتالوج بصلاحية `MANAGE_MENU` والتحقق من نطاق الفرع قبل تعديل التوفر.
  - تسجيل دخول وخروج للوحة عبر JWT داخل كوكي `HttpOnly` والتحقق من الجلسة وصلاحية `MANAGE_MENU` على الخادم.
  - شاشة `/admin/menu` موبايل فيرست: بطاقات قابلة للمس، بحث، نماذج درج سفلي على الهاتف، وإدارة الأسعار والمقاسات والإضافات والتوفر حسب الفرع.
  - تسجيل مسار `/admin/menu` في التنقل، وإضافة شاشة `/login`.
- **التحقق:**
  - `npx prisma validate` ناجح ومخطط قاعدة البيانات متزامن.
  - `npm run test`: اجتياز 39 اختباراً.
  - `npm run lint`: لا توجد أخطاء؛ بقي تحذيران سابقان في شاشة الإعدادات واختبار الفروع.
  - `npm run build`: ناجح، مع توليد مسارات `/admin/menu` و`/login`.
- **دليل الانتقال للمرحلة التالية:**
  - الانتقال إلى **Phase 3: CRM والعملاء والعناوين**.
  - ربط بيانات العملاء وسجل الطلبات مع الكتالوج ضمن Phase 4، دون إضافة تسجيل إجباري للطلبات.

#### المرحلة 3: إدارة الزبائن وسجل العناوين (Customers & CRM) — [x] مكتملة ومراجعة 100%
- **الهدف:** إدارة مركزية لزبائن المطعم تنتمي للمطعم ككل (Centralized Business-Level CRM) وليس لفرع واحد، ومطابقة الزبائن بأرقام الهواتف المعيارية E.164.
- **ما تم إنجازه بدقة:**
  - جداول Prisma: `Customer` و `CustomerAddress` مع فهارس صريحة على `phone`, `full_name`, `created_at`, `customer_id`, و `(customer_id, is_default)`.
  - كائنات المجال والـ Value Objects:
    - كائن القيمة `PhoneNumber` مع خوارزمية تطبيع وتحويل الأرقام المشرقية/العربية إلى ASCII وتوحيدها لمعيار E.164 (`+20...`).
    - كائن المجال `Customer` المعتمد على كائن `Money` لحساب الإنفاق المالي دون float.
    - كائن المجال `CustomerAddress` للتحقق من تفاصيل العناوين والتوصيل.
    - خدمة المجال `CustomerMatchingService` لمطابقة العناوين وتحديث وإثراء الأسماء بأمان.
  - الصلاحيات وRBAC:
    - إضافة صلاحية `MANAGE_CUSTOMERS` إلى `PermissionCode` وتحديث `SYSTEM_PERMISSIONS` و `SYSTEM_ROLES`.
    - تحديث قاعدة البيانات وسكربت `prisma/seed.ts` لتوزيع الصلاحية.
  - طبقة التطبيق (Use Cases & Server Actions):
    - `CreateCustomerUseCase`, `UpdateCustomerUseCase`, `FindCustomerByPhoneUseCase`, `ListCustomersUseCase`, `GetCustomerDetailsUseCase`, `SaveCustomerAddressUseCase`, `DeleteCustomerAddressUseCase`, `MatchOrCreateCustomerUseCase`.
    - Server Actions نحيفة (≤ 30 سطر) في `src/app/actions/customer.actions.ts` تعيد `ActionResult<T>` مع فحص الصلاحية عبر `SessionService`.
  - واجهة المستخدم ولوحة الإدارة:
    - شاشة تفاعلية متكاملة في `/admin/customers` بالاعتماد على Server Component و Client Component.
    - لوحة إحصائيات سريعة للزبائن والطلبات والمشتريات بالعملة الحية.
    - بحث سريع بالاسم والهاتف، ودرج جانبي تفاعلي لعرض وتعديل العناوين وتعيين العنوان الافتراضي.
    - إضافة رابط "العملاء والعناوين" في القائمة الجانبية مع أيقونة `Contact` من `lucide-react`.
    - الامتثال التام لميثاق الهوية البصرية: حظر الإيموجي، ألوان Zinc/Slate، دعم RTL أصيل.
- **نتائج الفحص والاختبارات:**
  - اجتياز **59 اختباراً آلياً** بنسبة 100% تغطي كائن الهاتف، كيان العميل، خدمة المطابقة، وحالات الاستخدام التطبيقية والتكاملية.
  - فحص `npm run lint` بنتيجة نظيفة 100% (0 errors, 0 warnings).
  - نجاح البناء الإنتاجي بالكامل عبر `npm run build` بنجاح متضمناً مسار `/admin/customers` الديناميكي.
- **دليل الانتقال للمرحلة التالية (Next Step Handoff):**
  - الانتقال إلى **المرحلة 4 (Phase 4: الموقع العام، المنيو الرقمي وسلة التوصيل Storefront & Delivery Checkout)**.
  - بناء صفحات الموقع العام بـ Next.js Server Components (`/`, `/menu`, `/cart`, `/checkout`, `/order/[code]`).
  - ربط عملية الـ Guest Checkout مباشرة بخدمة مطابقة العملاء `MatchOrCreateCustomerUseCase` لإنشاء أو مطابقة العميل تلقائياً بناءً على رقم هاتفه وعنوان التوصيل دون الحاجة لتسجيل حساب مسبق.
  - بناء خدمة تسعير الطلب الحتمية على الخادم `OrderPricingService` بالاعتماد على كائن `Money`.


#### المرحلة 4: الموقع العام، المنيو الرقمي وسلة التوصيل (Storefront & Delivery Checkout) — [x] مكتملة
- **الهدف:** بناء الموقع العام للعلامة التجارية "ماسا" (MASA) مستوحى من روح وتصميم قالب Crispy Kitchen، يدعم التبديل الثنائي الحي بين العربية (RTL أولاً) والإنجليزية (LTR)، مع فيديو خلفية سينمائي، وسلايدر أطباق تفاعلي، ومنيو رقمي متصل بقاعدة البيانات يمثل وجهة الـ QR بالمطعم، وسلة طلبات وتوصيل للضيوف (Guest Checkout - Delivery Only) دون فرض إنشاء حساب، وربط تلقائي مع سجل العملاء (CRM)، ومتتبع عام آمن للطلبات يحجب البيانات الشخصية.
- **ما تم إنجازه بدقة:**
  1. **نماذج وجداول قاعدة البيانات (Prisma Schema & Migrations):**
     - إضافة نماذج `Order`, `OrderItem`, `OrderItemModifier` مع علاقات منضبطة وفهارس تغطي `order_number`, `customer_id`, `branch_id`, `created_at`, `status`.
  2. **خدمات المجال والتسعير الحتمي (Domain Services):**
     - بناء `OrderPricingService` (`src/domain/ordering/services/order-pricing.service.ts`) لاحتساب المجموع الفرعي، فروق أسعار الإضافات، رسوم التوصيل، ضريبة القيمة المضافة، والخصومات حصراً عبر كائن `Money` ووحدات الماينور الصحيحة دون أي تقريب عشوائي أو float.
  3. **طبقة التطبيق والعمليات (Application Use Cases & Server Actions):**
     - بناء `PlaceOnlineOrderUseCase` للتحقق الحتمي من أسعار الأصناف والمقاسات والإضافات من قاعدة البيانات على الخادم، ثم استدعاء `MatchOrCreateCustomerUseCase` (المبني في المرحلة 3) لربط أو إنشاء الزبون وعنوانه بالـ CRM، وحفظ الطلب وتحديث إحصائيات إنفاق الزبون.
     - بناء `GetOrderTrackerUseCase` لاسترجاع بيانات الطلب العمومية مع حجب رقم هاتف العميل عبر `LogMasker`.
     - بناء Server Actions نحيفة (`src/app/actions/order.actions.ts`) تعيد `ActionResult<T>`.
  4. **واجهة المستخدم والموقع العام (App Router Presentation Layer):**
     - سياق السلة وإدارة اللغة: `CartProvider` (`src/app/(storefront)/cart-context.tsx`) لحفظ السلة واللغة المفضلة بـ LocalStorage ودعم التبديل الفوري RTL/LTR.
     - القالب العام `StorefrontShell`, `StorefrontHeader`, `StorefrontFooter` مع روابط تصفح، سلة حية، وقائمة موبايل تفاعلية، وشريط معلومات التواصل وساعات العمل.
     - الصفحة الرئيسية (`/`): تضم هيرو فيديو خلفية عالي الجودة (`/storefront/video/hero.mp4`)، سلايدر أطباق مميزة متدرج بالتقييمات، قسم "قصة وشغف ماسا"، شبكة الأطباق الأكثر طلباً، وعرض فروع المطعم الميدانية.
     - المنيو الرقمي ووجهة الـ QR (`/menu`): استعراض التصنيفات، تصفية الأصناف، بحث لحظي بالاسم والوصف، ونافذة منبثقة تفاعلية لاختيار المقاس والإضافات والملاحظات الخاصة.
     - سلة التوصيل (`/cart`): فحص كميات الطلب، تعديل وحذف العناصر، وحساب التكاليف والضرائب بدقة قبل التوجه لصفحة الدفع.
     - إتمام الطلب كضيف (`/checkout`): نموذج توصيل مبسط بدون تسجيل دخول إجباري، يجمع بيانات العميل والعنوان بدقة، ويوفر إرشادات حية وتأكيد فوري للطلب.
     - صفحة تتبع الطلب الآمنة (`/order/[code]`): مسار مراحل الطلب (قيد المراجعة، تم التأكيد، جاري التجهيز، في الطريق إليك، تم التسليم) مع بيانات الفاتورة والأصناف دون إفشاء بيانات الزبون الشخصية.
     - صفحة 404 مخصصة للموقع العام (`src/app/(storefront)/not-found.tsx`).
- **نتائج الفحص والاختبارات:**
  - اجتياز **70 اختباراً آلياً** بنسبة 100% تغطي مجالات العمليات المالية، كائن الهاتف، كيان العميل، خدمة المطابقة، وتسعير الطلبات وحالات الاستخدام.
  - فحص `npm run lint` بنتيجة نظيفة 100% (0 errors, 0 warnings).
  - نجاح البناء الإنتاجي بالكامل عبر `npm run build` مع Turbopack لجميع المسارات العامة وصفحات الإدارة دون أي أخطاء.
- **دليل الانتقال للمرحلة التالية (Next Step Handoff):**
  - الانتقال إلى **المرحلة 5 (Phase 5: مركز إدارة ومتابعة الطلبات الإلكترونية Online Order Center)**.
  - بناء شاشة التشغيل الحية لإدارة الطلبات الواردة في `/admin/orders` لعرض الطلبات الجديدة مع تنبيه صوتي/بصري، وإسناد الطلبات للفروع يدوياً ومتابعة تحديث حالاتها.

#### المرحلة 5: مركز إدارة ومتابعة الطلبات الإلكترونية (Online Order Center) — [x] مكتملة
- **الهدف:** شاشة تشغيل حية ومحكمة لمتابعة وقبول الطلبات الواردة من الموقع، وإسنادها للفروع يدوياً، ومتابعة دورة حياة الطلب المنضبطة بآلة حالات.
- **ما تم إنجازه بدقة:**
  - **قاعدة البيانات (Prisma):** إضافة حقل `cancelReason` في نموذج `Order` لتوثيق أسباب الإلغاء والرفض للتدقيق، وإضافة فهرس مركب `@@index([status, createdAt])` لدعم سرعة استعلامات مركز العمليات.
  - **طبقة النواة (Domain Layer):** خدمة `OrderStateMachineService` في `src/domain/ordering/services/order-state-machine.service.ts` لضبط مصفوفة الانتقال القانوني بين الحالات، ومنع القفز العشوائي، واشتراط إسناد الفرع قبل بدء التجهيز، واشتراط سبب الإلغاء عند الإلغاء/الرفض، وحظر التعديل بعد الحالات النهائية.
  - **طبقة التطبيق (Application Layer):** 5 حالات استخدام مستقلة ومختبرة:
    - `ListOrdersUseCase`: استعلام وتصفية الطلبات بالحالة والفرع والبحث مع ترقيم الصفحات.
    - `GetOrderDetailUseCase`: جلب تفاصيل الطلب الكاملة مع الأصناف والمقاسات والإضافات وسجل العميل CRM.
    - `AssignOrderBranchUseCase`: إسناد الطلب لفرع نشط مع فحص حالة الطلب.
    - `UpdateOrderStatusUseCase`: انتقال منضبط بين الحالات وتحديث حالة الدفع عند التسليم (COD).
    - `GetOrdersMetricsUseCase`: مؤشرات الأداء اللحظية (طلبات معلقة، تجهيز، توصيل، مبيعات اليوم).
  - **خوادم الإجراءات النحيفة (Thin Server Actions):** في `src/app/actions/order.actions.ts` مع حماية الصلاحيات عبر `SessionService.requirePermission(PermissionCode.MANAGE_ORDERS)` وإرجاع نمط `ActionResult<T>`.
  - **واجهة المستخدم وقمرة القيادة (`/admin/orders`):**
    - بطاقات تشغيلية مريحة للمس والشاشات المتنوعة.
    - كروت مؤشرات الأداء (KPI Counters).
    - تحديث تلقائي دوري كل 20 ثانية مع زر تحديث يدوي فوري.
    - تنبيه صوتي هادئ عند وصول طلبات جديدة عبر Web Audio API دون ملفات خارجية مع زر كتم الصوت وحفظ التفضيل.
    - شاشة تفاصيل وإسناد متكاملة (`OrderDetailModal`) وحوار تسجيل سبب الإلغاء.
    - نمط طباعة إيصالات حرارية 80mm للبونات والمطبخ (`ThermalReceipt`).
    - تفعيل الرابط في الشريط الجانبي للوحة الإدارة وإزالة شارة المرحلة 5.
- **الحالة الراهنة للمشروع (Current System State):**
  - مسار `/admin/orders` يعمل بشكل حي ومتكامل مع كافة الفروع وبيانات العملاء وسلة التوصيل.
- **نتائج الفحص والاختبارات (Verification):**
  - اجتياز اختبارات آلة الحالات (5 اختبارات) بنسبة 100%.
  - اجتياز اختبارات تكامل عمليات الطلبات (7 اختبارات) بنسبة 100%.
  - فحص الأنواع TypeScript (`tsc --noEmit`) خالٍ من أي أخطاء بنسبة 100%.
  - فحص التنسيق والجودة (`npm run lint`) خالٍ من أي أخطاء أو تحذيرات (0 errors, 0 warnings).
  - البناء الإنتاجي (`npm run build`) ناجح بنسبة 100% لكافة المسارات الـ 15 في النظام.
- **دليل الانتقال للمرحلة التالية (Next Step Handoff):**
  - الانتقال إلى **المرحلة 6 (Phase 6: نقطة البيع للمطعم Restaurant POS)**.
  - بناء واجهة الكاشير السريعة في `/pos`، المستقلة عن الموقع العام، والمربوطة بوردية الكاشير وحسابات المبيعات السريعة للصالة والسفري.

#### المرحلة 6: نقطة البيع للمطعم (Restaurant POS) — [x] مكتملة — 2026-09-29
- **الهدف:** واجهة نقطة بيع لمسية فائقة السرعة للكاشير داخل الفروع لتسجيل طلبات الصالة والسفري المباشرة، مستقلة عن مسار الأونلاين.
- **ما تم إنجازه بدقة:**
  - Prisma: جداول `CashShift` و`OrderPayment`، وروابط `Order.cashierId/cashShiftId`، ومفتاح فريد `posIdempotencyKey`، وحفظ عملة الطلب والوردية. بيانات العميل اختيارية للبيع المباشر دون إنشاء عميل CRM وهمي. الأعمدة snake_case والفهارس على الفرع والكاشير والوردية والدفعات.
  - Domain: عقد `PosRepository/PosTransaction` في `src/domain/pos/contracts/pos.repository.ts`، Enums للوردية وأنماط السداد، وخدمتا `PosSaleService` و`PosSettlementService`. تسجيل السداد عبر Strategies/Registry، والطباعة عبر عقد `ReceiptPrinter`.
  - الأموال: `Money.fromDecimal` لتحويل المدخلات العشرية والعربية بوحدات صحيحة، وحساب النسب بـ BigInt داخل Money. الأسعار والضريبة والخصم والإضافات والدفعات والباقي وفرق الوردية تستخدم Money. سياسة الضريبة القائمة محفوظة: ضريبة على المجموع، ثم خصم مبلغ ثابت من الإجمالي، بلا رسوم توصيل للـ POS.
  - Application: حالات استخدام إنشاء البيع، فتح/جلب/إغلاق الوردية، وقراءة الكتالوج، تعتمد على العقود دون Prisma أو Next.js. لا تقبل أسعاراً من المتصفح؛ تتحقق من الأصناف والمقاسات والإضافات والتوفر والتصنيفات النشطة والدفعات.
  - Infrastructure: `PrismaPosRepository` و`PrismaPosTransaction` وMapper للإيصالات. طلب وأصناف وإضافات ودفعات داخل معاملة ذرية. أقفال MySQL على الموظف عند الفتح وعلى الوردية عند البيع والإغلاق، مع ReadCommitted؛ تمنع وردية مزدوجة أو بيعاً لا يدخل في رصيد الإغلاق.
  - Idempotency: إعادة الطلب بنفس المفتاح والمحتوى تعيد الفاتورة نفسها، حتى بعد إغلاق الوردية. تغيير المحتوى أو الكاشير أو نطاق الفرع مرفوض. تحتفظ الواجهة بالطلب عند نتيجة شبكة غير مؤكدة وتمنع تحريره حتى إعادة المحاولة؛ لا تُنشئ مفتاحاً جديداً لتلك المحاولة.
  - RBAC: كل إجراء يفحص POS_ACCESS ونطاق الفرع؛ الخصم يحتاج APPLY_POS_DISCOUNT، أُضيف إلى المدير العام ومدير الفرع فقط عبر `scripts/sync-pos-permission.ts` دون إعادة تشغيل seed أو تغيير حسابات قائمة.
  - واجهة `/pos`: كتالوج وبحث وتصنيفات ومقاسات وإضافات إلزامية واختيار صالة/سفري، كميات وملاحظات، عرض الضريبة، خصم بصلاحية، نقدي وبطاقة ومختلط، حساب الباقي، فتح الوردية وإغلاقها وحساب الفرق. شاشة مستقلة RTL بألوان Zinc/Indigo وأيقونات Lucide وأهداف لمس 44px.
  - إيصال حراري 80mm من بيانات الخادم بعد البيع، وطباعة تلقائية وإعادة طباعة آخر 20 فاتورة خاصة بالكاشير والفرع. وسائل البطاقة تسجل تحصيلاً مؤكداً على الجهاز الخارجي؛ لا توجد بوابة خصم مصرفي وهمية.
  - البيع المباشر يسجل COMPLETED وPAID؛ مركز التوصيل ومؤشراته يعرضان ONLINE فقط، والمتتبع العام لا يكشف فواتير POS. أضيف رابط POS للإدارة وتوجيه تسجيل دخول الكاشير إليه.
  - حماية السجلات: أُوقف تسجيل SQL والقيم الخام من Prisma حتى لا تظهر بيانات العملاء في logs.
- **الحالة الراهنة للمشروع:**
  - مسار `/pos` قابل للتشغيل على قاعدة التطوير المحلية ومتكامل مع الكتالوج والموظفين والفروع. موظف ذو وردية مفتوحة يعود إلى فرع الوردية؛ تغيير فرع الإدارة لا يعيد إسناد مبيعاته.
  - أساس فتح وإغلاق الوردية موجود الآن؛ المصروفات والسحب والإيداع النقدي واعتماد الفروقات والتقارير المالية الموسعة تبقى Phase 8.
- **نتائج الفحص والاختبارات:**
  - 103/103 اختبارات Vitest ناجحة: 83 اختباراً سابقاً و20 اختباراً جديداً للأموال والإضافات والصلاحيات والتكرار والتزامن والعملة والتوفر والإغلاق.
  - TypeScript وESLint بلا أخطاء أو تحذيرات، وPrisma validate ناجح.
  - البناء الإنتاجي Next.js 16.3.6/Turbopack ناجح ويتضمن `/pos` ومسارات النظام الـ16.
  - اختبار المتصفح على البناء الإنتاجي ناجح: فتح، مقاس وإضافة مطلوبة، خصم وضريبة، دفع مختلط، طباعة وإعادة طباعة، موبايل بلا تجاوز أفقي، وإغلاق. صور المراجعة في `artifacts/pos/`، وسكريبت الفحص `scripts/verify-pos-ui.mjs` يستخدم Playwright المتاح في بيئة العمل وينظف بيانات الاختبار المعزولة.
  - فُحص print media في المتصفح؛ لا توجد طابعة حرارية فعلية متصلة للفحص المادي.
- **ملاحظة قاعدة البيانات والتسليم:**
  - تمت مزامنة قاعدة التطوير بموافقة المستخدم عبر Prisma db push. سجل migrations السابق يبدأ بترحيل Phase 2 يفترض جداول سابقة غير مسجلة؛ لذلك migrate dev يفشل على shadow database. لم يُنفّذ reset ولم تُحذف بيانات أعمال. يلزم إعداد baseline صحيح للترحيلات قبل نشر قاعدة جديدة؛ لا يُستعمل db push --accept-data-loss كإجراء نشر إنتاجي.
- **دليل الانتقال للمرحلة التالية:**
  - البدء بـ Phase 7 بعد مناقشة خطتها وموافقة المستخدم: InventoryItem وRecipe/BOM وSupplier وشراء وحركات مخزون غير قابلة للتعديل، وخدمة InventoryConsumptionService موحدة.
  - ربط استهلاك BOM بالبيع ضمن نفس المعاملة وبمفتاح عملية يمنع تكرار الخصم. نقطة الدمج هي `PrismaPosTransaction.saveSale`؛ طبقة Application تبقى معتمدة على العقود. لا تخصم المخزون عند مجرد فتح نافذة الطباعة أو إعادة طباعة/استعادة فاتورة.
  - إعادة استخدام CashShift وOrderPayment في Phase 8، وحساب رصيد النقد من دفعات CASH فقط؛ لا تجمع إجمالي فواتير البطاقة أو المبلغ المستلم قبل رد الباقي.

#### المرحلة 7: المخزون والوصفات والمشتريات (Inventory, BOM Recipes & Purchases) — [x] مكتملة — 2026-09-29
- **الهدف:** بناء منظومة مخزون ومشتريات متكاملة تدعم بطاقات المواد الخام، وحدات القياس، وصفات الأطباق المرنة (BOM اختياري)، صرف التشغيل المباشر للمطبخ، سجل حركات محاسبي غير قابل للتعديل (Immutable Movement Ledger)، الموردين وفواتير الشراء، مع ربط ذري لخصم المخزون عند البيع بنقطة البيع (POS).
- **ما تم إنجازه بدقة:**
  - **قاعدة البيانات (Prisma):** إضافة نماذج `InventoryItem` (المكونات الخام ووحدات القياس وتكلفة الشراء بالماينور)، `RecipeItem` (بنود الوصفات المرتبطة بالصنف أو المقاس أو الإضافة)، `BranchInventory` (رصيد كل فرع وحد النواقص مع دعم الرصيد السالب)، `InventoryMovement` (سجل حركات محاسبي لا يقبل التعديل أو الحذف)، `Supplier` (سجل الموردين)، `PurchaseOrder` و `PurchaseOrderItem` (أوامر التوريد وفواتير المشتريات). مزامنة المخطط عبر `prisma db push` وتوليد Prisma Client.
  - **طبقة المجال (Domain Layer):**
    - Enums: `UnitOfMeasure` (GRAM, KG, ML, LITER, PIECE), `InventoryMovementType` (SALE_POS, PURCHASE, OPERATIONAL_CONSUMPTION, WASTE, ADJUSTMENT), `PurchaseOrderStatus` (DRAFT, RECEIVED, CANCELLED).
    - كيان المجال: `InventoryItem` مدعوماً بالتحقق الصارم وكائن `Money` المالي للتكاليف.
    - خدمة استهلاك المخزون الموحدة `InventoryConsumptionService` (**GR-1.3**): تفكك وصفات الأصناف والمقاسات والإضافات وتجمع الاستهلاك؛ وعند عدم وجود وصفة مرتبطة (الوصفة اختيارية)، تُرجع قائمة استهلاك فارغة وتسمح بالبيع الفوري دون أي تعطيل.
  - **الربط الذري بنقطة البيع (POS Save Sale Integration):**
    - تحديث `PrismaPosTransaction.saveSale`: يتم استخراج المكونات وخصمها من `BranchInventory` وإدراج حركات `SALE_POS` في سجل التدقيق موثقة برقم الفاتورة `orderId` داخل نفس المعاملة الذرية لحفظ الطلب والدفع.
    - حماية الـ Idempotency Replay: في حال تكرار إرسال الفاتورة أو إعادة طباعتها، يعيد النظام الفاتورة القائمة عبر `findReplay` فوراً دون استدعاء `saveSale` ودون لمس المخزون أو تكرار الخصم.
    - اعتماد سياسة عدم تعطيل الصالة: يُسمح للرصيد بالنزول للسالب في حال تأخر تسجيل فواتير الشراء مع إظهار شارات تنبيه تشغيلية لإدارة الفرع.
  - **طبقة التطبيق (Application Layer & Thin Server Actions):**
    - حالات استخدام متخصصة: `ListInventoryItemsUseCase`, `SaveInventoryItemUseCase`, `GetBranchStockUseCase`, `AdjustStockUseCase` (صرف تشغيل، هدر، تسوية)، `GetProductRecipesUseCase`, `SaveProductRecipesUseCase`, `ListSuppliersUseCase`, `SaveSupplierUseCase`, `ListPurchaseOrdersUseCase`, `CreatePurchaseOrderUseCase`, `ReceivePurchaseOrderUseCase` (إيداع المخزون في مخزن الفرع وتحديث الحالة وتوثيق حركة التوريد ذرياً).
    - خوادم إجراءات نحيفة في `src/app/actions/inventory.actions.ts` محمية بصلاحية `PermissionCode.MANAGE_INVENTORY` وتعيد `ActionResult<T>`.
  - **واجهة لوحة الإدارة (`/admin/inventory`):**
    - واجهة تفاعلية كاملة بألوان Zinc/Slate الاحترافية، ودعم RTL أصيل، وأيقونات `lucide-react` (خالية تماماً من أي إيموجي).
    - 4 تبويبات رئيسية:
      1. **المخزون والأرصدة:** بطاقات مؤشرات (إجمالي المكونات، النواقص، الرصيد السالب، القيمة الإجمالية)، جدول الأرصدة بشارات الحالة (كافٍ، قارب على النفاد، عجز سالب)، أزرار سريعة لصرف التشغيل والتسويات وإضافة المكونات.
      2. **وصفات الأطباق (BOM):** استعراض المنتجات وتصنيفاتها، تمييز الأصناف ذات التشغيل المباشر عن الأصناف ذات الوصفات، ومحرر تفاعلي لإضافة المكونات بالكميات على مستوى الصنف أو المقاس أو الإضافات.
      3. **الموردين وأوامر الشراء:** دليل الموردين، إنشاء فواتير الشراء، وزر فوري لاعتماد واستلام الشحنة وتوريدها للمخزن.
      4. **سجل حركات المخزون:** جدول تدقيق محاسبي زمني غير قابل للتعديل للحركات مع فلترة شاملة.
    - تفعيل رابط "المخزون والوصفات" في الشريط الجانبي للإدارة وإزالة شارة الانتظار.
- **الحالة الراهنة للمشروع (Current System State):**
  - مسار `/admin/inventory` يعمل بشكل حي ومتكامل مع كافة الفروع والموردين وأوامر الشراء.
  - عمليات البيع عبر الـ POS تخصم المكونات تلقائياً عند وجود وصفات، وتعمل بسلاسة فائقة عند عدم وجود وصفات.
- **نتائج الفحص والاختبارات (Verification):**
  - اجتياز **123 اختباراً آلياً** بنسبة 100% عبر Vitest موزعة على 24 مجموعة اختبار (تشمل 6 اختبارات جديدة لعزل الفروع الصارم عبر `BranchContextService`، واختبارات الخصم الذري للـ POS مع التكلفة الدقيقة، وحماية الـ Replay).
  - فحص الأنواع TypeScript (`tsc --noEmit`) خالٍ من أي أخطاء بنسبة 100%.
  - فحص التنسيق والجودة (`npm run lint`) خالٍ من أي أخطاء أو تحذيرات (0 errors, 0 warnings).
  - البناء الإنتاجي (`npm run build`) ناجح بنسبة 100% مع Turbopack لجميع المسارات الـ 16 للنظام.
  - **فحص المتصفح الآلي الشامل عبر Playwright:** تشغيل سكريبت `scripts/verify-inventory-ui.mjs` على البناء الإنتاجي، واجتياز فحص كافة التبويبات الأربعة، وفتح النوافذ المنبثقة، والتحقق من عدم وجود أي خطأ في الكونسول (0 browser errors)، والتأكد من خلو واجهات الديسكتوب والموبايل (390px) من أي تجاوز أفقي (Zero horizontal overflow). تم حفظ لقطات الشاشة في `artifacts/inventory/`.
  - مراجعة الهوية البصرية وخلو الكود بالكامل من أي رموز تعبيرية (0 Emojis in codebase).
- **دليل الانتقال للمرحلة التالية (Next Step Handoff):**
  - الانتقال إلى **المرحلة 8 (Phase 8: المالية والورديات والمصروفات Finance, Cash Shifts & Expenses)**.
  - البناء على البنية التحتية القائمة لـ `CashShift` وتوسيعها لتشمل: تسليم الورديات، إيداع وسحب النقد، تسجيل المصروفات التشغيلية الميدانية، واعتماد الفروقات والعجز/الزيادة، واحتساب مجمل الأرباح وتكلفة البضاعة المباعة (COGS) استناداً إلى تكاليف المكونات المباعة وسجل حركات المرحلة 7.

#### المرحلة 8: المالية، الورديات، والمصروفات (Finance, Cash Shifts & Expenses) — [x] مكتملة — 2026-09-29
- **الهدف:** إدارة العمليات المالية التشغيلية للمطعم: ورديات الكاشير النقدية، المصروفات التشغيلية الميدانية، واحتساب الأرباح الإجمالية وتكلفة البضاعة المباعة (COGS).
- **ما تم إنجازه بدقة:**
  - **قاعدة البيانات (Prisma):**
    - تطوير نموذج `CashShift` ليشمل: `expectedCashMinor`, `varianceMinor`, `varianceReason`, `approvedById`, `approvedAt`, وعلاقات متخصصة بـ `CashShiftMovement[]` و `Expense[]`.
    - إنشاء نموذج `CashShiftMovement` لتوثيق حركات النقد أثناء الوردية (`CASH_IN` لتغذية الفكة، و `CASH_DROP` لسحب التوريدات للخزينة) مع الموظف القائم والسبب والوقت.
    - إنشاء نموذج `ExpenseCategory` لتبويب المصروفات التشغيلية، وبذر 6 تصنيفات افتراضية شاملة (نثريات وضيافة، غاز ومرافق، صيانة طارئة، مشتريات سوق ومطبخ، أدوات نظافة، نقل وشحن).
    - إنشاء نموذج `Expense` لتوثيق المصروفات التشغيلية الميدانية مع دعم مصدري تمويل: `REGISTER_CASH` (يخصم حتمياً وذرياً من نقدية درج الوردية النشطة) مقابل `SAFE_PETTY_CASH` (يصرف من الخزينة المركزية أو العهدة الميدانية المستقلة).
    - مزامنة المخطط عبر `prisma db push` وبذر التصنيفات وتوليد عميل Prisma Client.
  - **طبقة المجال (Domain Layer):**
    - الـ Enums: `CashShiftStatus` (OPEN, CLOSED, AUDITED), `CashMovementType` (CASH_IN, CASH_DROP), `ExpenseSource` (REGISTER_CASH, SAFE_PETTY_CASH).
    - خدمة حسابات الوردية الحتمية `CashShiftCalculatorService` (**GR-1.1 & GR-8.2**):
      حساب النقد المتوقع بالدرج بدقة: $\text{Opening} + \text{Cash Sales} + \text{Cash In} - \text{Cash Drop} - \text{Register Expenses}$.
      تحليل الفروقات وتصنيف الوردية (BALANCED مطابق، SHORTAGE عجز، OVERAGE زيادة).
      التحقق الصارم من مدخلات الحركات النقدية ومنع المبالغ السالبة أو الأسباب الناقصة.
    - خدمة قياس الأرباح وتكلفة المبيعات `ProfitabilityCalculatorService`:
      حساب صافي المبيعات، تكلفة البضاعة المباعة (COGS)، المصروفات الميدانية، ومجمل الربح التشغيلي ونسب الهوامش المئوية بدقة وتجنب أي قسمة على صفر.
    - عقد المستودع `FinanceRepository` والـ DTOs التابعة في `src/domain/finance/contracts/finance.repository.ts`.
  - **طبقة التطبيق (Application Layer & Thin Server Actions):**
    - حالات استخدام متخصصة: `RecordCashMovementUseCase`, `BlindCloseCashShiftUseCase`, `AuditCashShiftUseCase`, `CreateExpenseUseCase`, `GetProfitAndLossUseCase`, `ListCashShiftsUseCase`, `ListExpensesUseCase`, `ListExpenseCategoriesUseCase`, `GetCashShiftDetailsUseCase`.
    - خوادم إجراءات نحيفة في `src/app/actions/finance.actions.ts` لا تتجاوز 30 سطراً للإجراء، وتفوض العمل فوراً لحالات الاستخدام مع فحص الصلاحيات وعزل الفروع الصارم.
  - **طبقة البنية التحتية (Infrastructure Layer):**
    - `PrismaFinanceRepository` يدعم المعاملات الذرية وأقفال السطور `SELECT FOR UPDATE` لمنع التزامن والتلاعب أثناء إغلاق الورديات وتسجيل حركات النقد.
    - استخراج الـ COGS من حركات `InventoryMovement` ذات النوع `SALE_POS` وقيم `quantityDelta` السالبة مع التكاليف المسجلة بالماينور.
    - تحديث `closeShift` في `PrismaPosRepository` لحفظ `expectedCashMinor` و `varianceMinor` واحتساب الحركات والمصروفات المسحوبة من الدرج تلقائياً.
  - **واجهة لوحة الإدارة (`/admin/finance`):**
    - واجهة تفاعلية كاملة مبنية بـ Slate/Zinc المتوافق مع ميثاق الهوية البصرية، وأيقونات `lucide-react` الدقيقة (0 Emojis).
    - دعم RTL أصيل، وأهداف لمس 44px، وملاءمة الشاشات الصغيرة (390px).
    - 3 تبويبات رئيسية:
      1. **ورديات الكاشير النقدية:** بطاقات مؤشرات (الورديات المفتوحة، بانتظار الاعتماد، مبيعات اليوم، صافي الفروقات)، جدول الورديات بشارات العجز والزيادة والمطابقة، ونافذة تفاصيل موسعة لحركات الدرج.
      2. **المصروفات والنثريات:** بطاقات للمصروفات حسب المصدر، فلاتر التصنيف والمصدر، وجدول تفصيلي للسندات.
      3. **الأرباح وتكلفة البضاعة المباعة (COGS):** بطاقات الأداء المالي الخمس (المبيعات، COGS %، المصروفات، مجمل الربح، هامش التشغيل %)، جدول توزيع المصروفات بنسب مئوية، وجدول الأداء المالي اليومي.
    - نوافذ منبثقة تفاعلية: تسجيل مصروف، حركة نقدية، إغلاق أعمى، وتدقيق واعتماد الفروقات.
    - تفعيل رابط "المالية والمصروفات" في الشريط الجانبي للإدارة وإزالة شارة الانتظار.
- **الحالة الراهنة للمشروع (Current System State):**
  - مسار `/admin/finance` يعمل بشكل حي ومباشر ومتكامل مع نقطة البيع والمخزون والفروع.
  - عمليات إغلاق الورديات في الـ POS والإدارة تدعم الإغلاق الأعمى وحساب العجز والزيادة والاعتماد الرسمي.
- **نتائج الفحص والاختبارات (Verification):**
  - اجتياز **142 اختباراً آلياً** بنسبة 100% عبر Vitest موزعة على 28 مجموعة اختبار (تشمل 19 اختباراً جديداً للحسابات المالية وحالات الاستخدام وعزل الفروع الصارم).
  - فحص الأنواع TypeScript (`tsc --noEmit`) خالٍ من أي أخطاء بنسبة 100%.
  - فحص التنسيق والجودة (`npm run lint`) خالٍ من أي أخطاء أو تحذيرات (0 errors, 0 warnings).
  - البناء الإنتاجي (`npm run build`) ناجح بنسبة 100% مع Turbopack لجميع المسارات الـ 17 للنظام.
  - **فحص المتصفح الآلي الشامل عبر Playwright:** تشغيل سكريبت `scripts/verify-finance-ui.mjs` على البناء الإنتاجي، والتحقق من فتح النوافذ المنبثقة، والتنقل بين التبويبات الثلاثة، وفحص العرض المكتبي والموبايل (390px)، والتأكد من خلوه تماماً من أي تجاوز أفقي (0 horizontal overflow) و 0 أخطاء كونسول. تم حفظ 9 لقطات شاشة في `artifacts/finance/`.
  - مراجعة الهوية البصرية وخلو الكود بالكامل من أي رموز تعبيرية (0 Emojis in codebase).
- **دليل الانتقال للمرحلة التالية (Next Step Handoff):**
  - الانتقال إلى **المرحلة 9 (Phase 9: التقارير والتدقيق الشامل والجاهزية للإنتاج Reporting, Audit & Hardening)**.
  - التركيز في Phase 9 على:
    1. شاشات التقارير والتحليلات الإدارية الشاملة (`/admin/reports` أو تحديث `/admin`): الرسوم البيانية للمبيعات، أكثر الأصناف مبيعاً وربحية، أداء الفروع والموظفين، ومعدلات دوران المخزون.
    2. مراجعة فهارس قاعدة بيانات MySQL واستعلامات Prisma لمنع أي مشكلات N+1 وضمان سرعة الاستجابة تحت الضغط العالي.
    3. التدقيق الأمني الشامل: التأكد من حجب كافة البيانات الحساسة (PII Masking) في السجلات والتقارير العامة، تدقيق الـ Idempotency، وإجراء فحص الجاهزية للإنتاج (Production Readiness Audit).

#### المرحلة 9: التقارير، التدقيق الشامل والجاهزية للإنتاج (Reporting, Audit & Hardening) — [x] مكتملة — 2026-09-29
- **الهدف:** بناء قمرة التقارير والتحليلات الإدارية الشاملة، إصلاح وتحصين منظومة الصلاحيات (RBAC) والتنقل الميداني، تحسين فهارس استعلامات MySQL لمنع بطء الأداء، وإتمام الفحص النهائي والجاهزية الكاملة للإنتاج.
- **ما تم إنجازه بدقة:**
  - **1. تدقيق وإصلاح منظومة الصلاحيات والتنقل (RBAC & Navigation Overhaul):**
    - **تحصين شاشات الإدارة (Page-Level Security):** بناء دالة حراسة مركزية `assertPagePermission` في `src/infrastructure/auth/page-guard.ts` وفحص الصلاحيات صراحة على مستوى Server Components في كافة صفحات الإدارة (`/admin/branches` ⬅ `MANAGE_BRANCHES`، `/admin/staff` ⬅ `MANAGE_STAFF`، `/admin/settings` ⬅ `MANAGE_SETTINGS`، `/admin/menu` ⬅ `MANAGE_MENU`، `/admin/customers` ⬅ `MANAGE_CUSTOMERS`، `/admin/orders` ⬅ `MANAGE_ORDERS`، `/admin/inventory` ⬅ `MANAGE_INVENTORY`، `/admin/finance` ⬅ `MANAGE_FINANCE`، و `/admin/reports` ⬅ `VIEW_REPORTS`) مع إعادة توجيه فورية للوحة التحكم أو صفحة تسجيل الدخول عند انعدام الصلاحية.
    - **فلترة شريط التنقل ديناميكياً (Role-Aware Navigation):** ترقية `AdminLayout` في `src/app/(admin)/admin/layout.tsx` ليتم فلترة الروابط ديناميكياً بحسب صلاحيات الجلسة `session.permissions`؛ بحيث يرى الكاشير فقط نقطة البيع ومركز الطلبات والعملاء، ويرى المحاسب فقط المالية والتقارير الشاملة، ويرى المدير العام كامل المنظومة.
    - **إضافة دور المحاسب المالي (ACCOUNTANT Role):** إضافة دور `ACCOUNTANT` في `SystemRole` بصلاحيات `VIEW_REPORTS` و `MANAGE_FINANCE`.
    - **عرض اسم الموظف ودوره ديناميكياً:** استبدال النص الثابت في الترويسة العلوية بالاسم الفعلي للموظف ودوره المسجل.
  - **2. قمرة التقارير الإدارية والتحليلات الشاملة (`/admin/reports`):**
    - **حالات استخدام تطبيقية في `src/application/reports/use-cases/`:**
      1. `GetSalesAnalyticsUseCase`: تحليل المبيعات متعدد الأبعاد (صالة، سفري، توصيل)، التوزيع الزمني على مدار الـ 24 ساعة لاكتشاف أوقات الذروة، تفصيل طرق الدفع (نقدي، بطاقة، مختلط)، وحساب صافي المبيعات والضرائب والخصومات بدقة `Money` المئوية.
      2. `GetMenuEngineeringUseCase`: هندسة المنيو وأداء الأصناف، تصنيف الأصناف الأكثر مبيعاً والأعلى إيراداً، حساب تكلفة البضاعة المباعة (COGS) من واقع وصفات الـ BOM وحساب نسبة هامش الربح الإجمالي، وحصر الأصناف الراكدة بدون مبيعات.
      3. `GetBranchPerformanceUseCase`: مقارنة أداء الفروع، حجم المبيعات، متوسط قيمة الفاتورة (AOV)، عدد الورديات، الفروقات النقدية، ومصروفات كل فرع وصافي المساهمة.
      4. `GetInventoryAnalyticsUseCase`: إجمالي تكلفة صرف تشغيل المطبخ، تكلفة الهدر والتوالف (Waste)، وتحليل حركات المخزون، وقائمة تنبيهات المواد التي بلغت أو تجاوزت حد إعادة الطلب.
    - **خوادم إجراءات نحيفة (Thin Server Actions):** في `src/app/actions/report.actions.ts` محمية بصلاحية `VIEW_REPORTS` وعزل الفروع.
    - **واجهة مستخدم تفاعلية متكاملة (`ReportsClient`):**
      - أربعة تبويبات: المبيعات والقنوات، هندسة المنيو والربحية، مقارنة أداء الفروع، والمخزون والهدر.
      - فلاتر سريعة: اليوم، أمس، آخر 7 أيام، هذا الشهر، وتحديد نطاق زمني مخصص، وفلتر لاختيار الفرع.
      - بطاقات KPI علوية للمبيعات، هامش الربح، الطلبات المنجزة، ومتوسط الفاتورة.
      - رسم بياني تفاعلي لأوقات الذروة بالساعات (Peak Hours Bar Visualizer).
  - **3. تحسين أداء استعلامات MySQL وفهارس Prisma:**
    - إضافة فهارس مركبة في `prisma/schema.prisma`:
      - في جدول `Order`: `@@index([branchId, createdAt])` و `@@index([type, createdAt])`.
      - في جدول `CashShift`: `@@index([branchId, openedAt])`.
    - تحديث قاعدة البيانات وتوليد عميل Prisma المحدث.
    - سكريبت Seed محدث لإنشاء حسابات جاهزة لجميع الأدوار (`admin`, `manager`, `accountant`, `cashier`, `kitchen`).
  - **4. الالتزام بميثاق الهوية البصرية وخلو السجلات من الـ PII:**
    - حظر تام وشامل للرموز التعبيرية (0 Cartoon Emojis).
    - استخدام أيقونات SVG دقيقة من `lucide-react`.
    - دعم RTL أصيل وتصميم متجاوب 100% مع الهواتف المحمولة (390px) دون أي تجاوز أفقي (0 horizontal overflow).
- **الحالة الراهنة للمشروع (Current System State):**
  - منظومة مطاعم MASA مكتملة الآن بالكامل بنسبة 100% (Phases 0 → 9)، وتعمل بكفاءة فائقة على بيئة Next.js 16.3.6 و MySQL.
- **نتائج الفحص والاختبارات (Verification):**
  - **155 اختباراً آلياً ناجحاً بنسبة 100%** في Vitest عبر 33 مجموعة اختبار دون أي فشل.
  - فحص TypeScript الصارم (`tsc --noEmit`) خالٍ من أي أخطاء (0 errors).
  - فحص التنسيق والجودة (`npm run lint`) خالٍ من الأخطاء والتحذيرات (0 errors, 0 warnings).
  - البناء الإنتاجي (`npm run build`) ناجح بالكامل لجميع المسارات الـ 18 للنظام.
  - **فحص المتصفح الفعلي الشامل عبر Playwright:** تشغيل `scripts/verify-phase9-hardening.mjs` واجتياز اختبارات تسجيل دخول المدير العام، المحاسب، والكاشير، والتحقق الفعلي من إخفاء التبويبات غير المصرح بها، واختبار المنع الأمني وإعادة التوجيه عند محاولة الدخول المباشر بالرابط (403/Redirect)، والتنقل بين تبويبات التقارير الأربعة، والتأكد من خلو واجهات الموبايل (390px) والديسكتوب من أي أخطاء كونسول أو تجاوز أفقي. تم حفظ 7 لقطات شاشة موثقة في `artifacts/reports/`.
- **خاتمة المشروع وسجل تحصين الجاهزية للإنتاج (Production Hardening & Audit Remediations):**

#### مرحلة التدقيق والتحصين الشامل (Enterprise Audit Hardening — Packages 1 to 3) — [x] مكتملة — 2026-10-01
- **الهدف:** معالجة الملاحظات الحرجة الناتجة عن التدقيق المعماري والأمني للمشروع للوصول إلى جاهزية إنتاجية كاملة بنسبة 100%، وتأمين خصوصية العملاء، وتحصين العمليات الذرية والمحاسبية.
- **ما تم إنجازه بدقة:**
  - **1. حزمة الصلاحيات وعزل الفروع (Package 1 - In-Action RBAC & Branch Scoping):**
    - حراسة الـ Server Actions من الداخل (`assertBranchAccess`, `requirePermission`) في `staff.actions.ts`, `branch.actions.ts`, `settings.actions.ts`, `finance.actions.ts`, `order.actions.ts`, `report.actions.ts`.
    - منع الوصول لطلبات وتفاصيل فروع أخرى عبر معرّف الطلب، وتأمين الورديات النقدية والتقارير المالية.
  - **2. تجربة المستخدم والموبايل والـ PWA (Mobile-First UX & PWA Foundation):**
    - دعم PWA متكامل عبر Next.js 16 Metadata Route (`src/app/manifest.ts`) وأيقونات التطبيق و Service Worker (`public/sw.js`).
    - شريط علوي للهواتف في لوحة الإدارة (`admin-shell.tsx`) مع درج تنقل جانبي تفاعلي سلس.
    - واجهة نقطة بيع متكيفة بالكامل للشاشات اللمسية والموبايل والتابلت (`pos-client.tsx`) مع درج سفلي عائم للسلة (`max-h-[92vh]`) وأزرار فئات نقدية سريعة (50، 100، 200، 500، التمام).
  - **3. ذرية المخزون وحساب تكلفة المبيعات (Package 2 - Atomic Inventory & COGS):**
    - استبدال استعلامات القراءة والكتابة اليدوية بتحديثات ذرية مشروطة على مستوى MySQL (`{ decrement: ... }` / `{ increment: ... }`) في `prisma-pos-transaction.ts` و `prisma-inventory.repository.ts`.
    - استلام أوامر الشراء بأسلوب ذري مشروط (`updateMany where status = 'DRAFT'`) لمنع التكرار تحت التزامن.
    - خدمة خصم المخزون لطلبات الأونلاين (`order-inventory-deduction.service.ts`) بحماية Idempotency وحركة `SALE_ONLINE`.
    - احتساب دقيق لتكلفة البضاعة المباعة (COGS) من مبيعات الـ POS والأونلاين معاً، واستبعاد الطلبات المعلّقة (`PENDING`) من الإيراد الفعلي في التقارير.
  - **4. خصوصية التتبع ومنع تكرار طلبات الويب (Package 3 - Tracker Privacy & Web Idempotency):**
    - **حماية خصوصية التتبع العام (`GetOrderTrackerUseCase`):**
      - حجب تفاصيل الشارع والعمارة والدور والشقة وملاحظات البوابة في الشاشة العامة (`/order/[code]`) وعرض المنطقة والمدينة فقط لصد المتطفلين والروبوتات.
      - حجب اسم العميل (عرض الاسم الأول وبداية الاسم الثاني مثل `أحمد م.`).
      - إخفاء ملاحظات التوصيل الخاصة تماماً عن شاشة التتبع العامة لمنع تسرب أكواد البوابات أو المعلومات الخاصة.
      - **التأكيد التشغيلي الصارم:** بقاء كافة بيانات العميل (الهاتف كامل 100% مع زر اتصال مباشر، العنوان التفصيلي، وأرقام العمارات والشقق والملاحظات) كاملة وغير محجوبة للموظفين والكاشير في قمرة العمليات ([`order-detail-modal.tsx`](file:///c:/resto/src/app/(admin)/admin/orders/components/order-detail-modal.tsx)) وفي بون الطباعة الحراري 80mm للطيار ([`thermal-receipt.tsx`](file:///c:/resto/src/app/(admin)/admin/orders/components/thermal-receipt.tsx)).
    - **تقوية إنتروبيا كود الطلب (High-Entropy Order Code):** توليد رمز عشوائي سداسي آمن مشفر (`MASA-YYYYMMDD-XXXXXX`) يوفر أكثر من 16.7 مليون احتمال يومياً لمنع التخمين بالروبوتات.
    - **خدمة تحديد المعدل الموحدة (Rate Limiter - GR-1.2):** بناء `RateLimiter` و `RateLimiterKeys` لحظر محاولات التخمين والاستكشاف الآلي على مسار التتبع وزر إتمام الطلب.
    - **مفتاح منع تكرار طلبات الويب (Web Order Idempotency - GR-4.1):** دعم `onlineIdempotencyKey` في قاعدة البيانات ومخطط الطلب، وتوليده في المتصفح وإرساله عند تأكيد الطلب، مع إعادة نفس الطلب دون تكرار في حال إعادة الإرسال أو النقر المزدوج.
    - **معاملة ذرية شاملة للطلب وCRM (Atomic All-or-Nothing Transaction):** دمج مطابقة العميل وإنشاء العنوان وتسجيل الطلب وتحديث إحصائيات CRM داخل كتلة `prisma.$transaction` واحدة لضمان عدم بقاء أي سجلات يتيمة في CRM عند حدوث أي خلل.
- **الحالة الراهنة للمشروع (Current System State):**
  - النظام محصن بالكامل مع 163 اختباراً آلياً ناجحاً 100%، وبناء إنتاجي يعمل بكفاءة لجميع المسارات الـ 17 بدون أخطاء.
- **نتائج الفحص والاختبارات (Verification):**
  - **163 اختباراً آلياً ناجحاً بنسبة 100%** عبر Vitest في 35 ملف اختبار.
  - فحص الأنواع TypeScript (`tsc --noEmit`) خالٍ من أي أخطاء بنسبة 100%.
  - فحص الجودة والتنسيق (`npm run lint`) خالٍ من الأخطاء والتحذيرات (0 errors, 0 warnings).
  - البناء الإنتاجي (`npm run build`) ناجح بنسبة 100% لجميع المسارات الـ 17.
- **دليل الانتقال للمرحلة التالية (Next Step Handoff):**
  - الانتقال إلى **Package 4 (ترحيلات قاعدة البيانات النظيفة وحفظ المصدر في Git وتأمين بيانات التأسيس)**:
    1. توثيق وحفظ التعديلات في Git.
    2. مراجعة وتأمين كلمات المرور في سكربت التأسيس (`seed.ts`).
    3. تجهيز الترحيلات الرسمية النظيفة (Prisma Migrations) لضمان سهولة النشر على أي خادم أو قاعدة بيانات جديدة بضغطة زر.

#### المرحلة 10: إدارة الصالة والطاولات والطلبات المفتوحة (Dine-in, Tables & Open Tabs) — [x] مكتملة — 2026-10-02
- **الهدف:** بناء دورة حياة كاملة لطلبات الصالة (Dine-In) تتجاوز مجرد زر "صالة" المباشر، وتدعم:
  1. هيكلة أقسام الصالة (Table Sections) والطاولات (Dining Tables) برقم وسعة وشكل هندسي.
  2. عزل الفروع الصارم (Branch Scoping) حيث لكل فرع صالته وأقسامه وطاولاته المستقلة، مع قيد فريد مركب `@@unique([branchId, tableNumber])`.
  3. مفهوم الطلب المفتوح (Open Tab): الضيوف يطلبون أصنافاً أولاً، ويمكن إضافة أصناف إضافية للطلب المفتوح في أي وقت.
  4. نقل الطلب المفتوح من طاولة لأخرى (Transfer Table) عند تغيير الضيوف لمكان جلوسهم.
  5. تقسيم الشيك (Split Bill) بالتساوي دون أي هللة مفقودة أو خطأ تقريب (معالجة بالماينور عبر كائن `Money`).
  6. طباعة شيك استعراض الحساب للضيوف (80mm Thermal Guest Check) مع تحديث حالة الطاولة إلى `BILL_PRINTED`.
  7. تحصيل وإغلاق الطلب (نقدي / بطاقة / مختلط) وتحرير الطاولة لتصبح `AVAILABLE`، وإيداع الإيراد في الوردية النشطة، وخصم مكونات الوصفات (BOM) ذرياً من المخزون.
  8. خريطة صالة تفاعلية وسريعة (Touch Floor Plan) مدمجة في نقطة البيع (`/pos`)، مع إمكانية التبديل الفوري بين المنيو السريع وخريطة الطاولات.
  9. لوحة إدارة متكاملة للصالة والطاولات (`/admin/tables`) تدعم CRUD للأقسام والطاولات، مؤشرات إشغال حية، وتصدير/استيراد وتعديل سريع.
- **ما تم إنجازه بدقة:**
  - **1. قاعدة البيانات (Prisma Models & Relations):**
    - `TableSection`: معرّف، اسم عربي وإنجليزي، ترتيب، وحالة نشاط، مرتبطة بـ `Branch`.
    - `DiningTable`: معرّف، رقم الطاولة، سعة المقاعد، الشكل (`SQUARE`، `ROUND`، `RECTANGLE`)، الحالة (`AVAILABLE`، `OCCUPIED`، `RESERVED`، `BILL_PRINTED`)، علاقة اختيارية بـ `TableSection`، ومعرّف الطلب المفتوح `activeOrderId`، وقيد فريد `@@unique([branchId, tableNumber])` وفهرس `@@index([branchId, status])`.
    - تحديث `Order`: إضافة `tableId`، `tableName`، `guestCount`، `isTabOpen`، `billPrintedAt`، وفهرس `@@index([tableId, isTabOpen])`.
  - **2. طبقة المجال (Domain Layer):**
    - Enums: `TableStatus` (`AVAILABLE`, `OCCUPIED`, `RESERVED`, `BILL_PRINTED`), `TableShape` (`SQUARE`, `ROUND`, `RECTANGLE`).
    - كائن القيمة والخدمة: `SplitBillService` لتقسيم الشيك بالتساوي بالماينور مع توزيع البواقي السنتات على الحصص الأولى بدقة 100% دون فقدان أي كسور.
  - **3. طبقة التطبيق (Application Layer & Use Cases):**
    - `ListTablesUseCase`: جلب أقسام وطاولات الفرع وحالاتها والطلبات المفتوحة والأصناف المطلوبة ووقت الجلوس بالدقائق وإجمالي الحساب.
    - `SaveSectionUseCase` & `DeleteSectionUseCase`: إدارة أقسام الصالة.
    - `SaveTableUseCase` & `DeleteTableUseCase`: إدارة الطاولات مع منع حذف الطاولات المشغولة بطلب مفتوح.
    - `OpenTableTabUseCase`: فتح طاولة بطلب مفتوح وربطها بالوردية النشطة والكاشير وإضافة أصناف أولية وتغيير حالة الطاولة إلى `OCCUPIED`.
    - `AddItemsToTabUseCase`: إضافة أصناف جديدة لطلب مفتوح قائم وإعادة احتساب المجاميع والضرائب ذرياً.
    - `TransferTableUseCase`: نقل الطلب المفتوح ذرياً من طاولة مشغولة إلى طاولة فارغة مع تحديث الحالات.
    - `PrintTableBillUseCase`: تجهيز بيانات شيك الحساب 80mm وتحديث حالة الطاولة إلى `BILL_PRINTED` وتوثيق وقت الطباعة.
    - `CloseTableTabUseCase`: تحصيل وإغلاق الطلب المفتوح وإيداع الدفعات في الوردية النشطة وتحرير الطاولة وخصم المخزون (BOM).
    - خوادم إجراءات نحيفة في `src/app/actions/table.actions.ts` مع حراسة صلاحيات وعزل فروع كامل.
  - **4. لوحة الإدارة (`/admin/tables`):**
    - واجهة لإدارة الأقسام والطاولات، فلترة حسب الفرع والحالة والقسم، إضافة وتعديل الأقسام والطاولات، وإحصائيات إشغال الصالة.
    - ربطها برابط "الصالة والطاولات" في الشريط الجانبي للإدارة مع أيقونة `Armchair` المتجهة الصارمة (0 Emojis).
  - **5. نقطة البيع للمطعم (`/pos` Dine-In & Tables):**
    - زر تبديل في الترويسة العلوية للـ POS بين `[الطلب السريع / المنيو]` و `[خريطة الصالة]`.
    - عند اختيار نوع الطلب `[صالة]` في السلة: يظهر منتقي الطاولات لاختيار الطاولة وعدد الضيوف وحفظ كطلب مفتوح أو دفع فوري.
    - خريطة صالة تفاعلية (`PosFloorPlan`): عرض الأقسام كألسنة تبويب، كروت الطاولات بألوان الحالة (أخضر زمردي للمتاحة، رمادي داكن للمشغولة، كهرماني لمطبوع الشيك)، مؤشر وقت الجلوس وعدد الأصناف والإجمالي المستحق.
    - نافذة إدارة الطاولة المفتوحة (`TableTabModal`): استعراض الأصناف، إضافة أصناف جديدة، نقل الطاولة، تقسيم الشيك بالتساوي، وطباعة شيك الحساب الحراري 80mm، والتحصيل والإغلاق.
- **الحالة الراهنة للمشروع (Current System State):**
  - دورة الصالة والطاولات بالكامل حية وقابلة للتشغيل الميداني وتعمل بنجاح تام وتتكامل مع الورديات النقدية والمخزون وجميع الفروع.
- **نتائج الفحص والاختبارات (Verification):**
  - **176 اختباراً آلياً ناجحاً بنسبة 100%** عبر Vitest في 36 ملف اختبار (تشمل 13 اختباراً جديداً لعمليات الصالة والطاولات).
  - فحص TypeScript الصارم (`npx tsc --noEmit`) خالٍ من أي أخطاء (0 errors).
  - فحص التنسيق والجودة (`npm run lint`) خالٍ من أي أخطاء أو تحذيرات (0 errors, 0 warnings).
  - البناء الإنتاجي (`npm run build`) ناجح بالكامل لجميع المسارات الـ 17 للنظام.
  - الالتزام التام بميثاق الهوية البصرية: خلو النظام بنسبة 100% من أي رموز تعبيرية (0 Emojis)، والاعتماد الحصري على أيقونات `lucide-react`.
- **دليل الانتقال للمرحلة التالية (Next Step Handoff):**
  - تم الانتقال بنجاح إلى المرحلة 11: أسطول التوصيل والطيارين وإقفال العهدة المالية.

---

#### المرحلة 11: أسطول التوصيل والطيارين وإقفال العهدة المالية (Fleet Dispatcher & Settlement) — [x] مكتملة
- **الهدف:** بناء دورة تشغيلية وميدانية متكاملة ومحكمة لإدارة أسطول كباتن التوصيل بالفرع، بدءاً من تسجيل الكباتن، وإسناد الطلبات الجاهزة وخروجها للتوصيل، ومتابعة العهدة النقدية للطلبات المسلّمة (COD)، وإقفال العهدة وتوريدها للوردية النقدية النشطة وطباعة إيصال التوريد 80mm.
- **القواعد الصارمة والالتزامات الهندسية:**
  1. عزل الفروع الصارم (Branch Scoping): كل كابتن توصيل وسند تسوية مرتبط حصرياً بفرعه التشغيلي (`branchId`).
  2. الربط المالي المحكم مع الورديات النقدية: تسوية عهدة الطيار تودع النقدية في وردية الكاشير النشطة كحركة إيداع (`CASH_IN`) من نوع `DRIVER_SETTLEMENT` دون أي حسابات عائمة أو تقريب بالفاصلة العائمة (Strict Minor Units عبر `Money` VO).
  3. حظر الرموز التعبيرية (Strict Ban on Emojis): استخدام أيقونات `lucide-react` المتجهة حصراً (`Bike`, `Truck`, `Car`, `Banknote`, etc.).
  4. حماية خصوصية بيانات العملاء (PII): حجب الهاتف والعنوان في السجلات ومتتبع الطلبات مع توفير رابط اتصال مباشر بالكابتن للعميل.
- **ما تم إنجازه بدقة:**
  - **1. قاعدة البيانات (Prisma Models & Relations):**
    - `DeliveryDriver`: معرّف، الفرع (`branchId`)، الاسم الكامل، الهاتف، نوع المركبة (`MOTORCYCLE`, `BICYCLE`, `CAR`)، رقم اللوحة، الحالة (`AVAILABLE`, `ON_DELIVERY`, `OFF_DUTY`)، وتاريخ الإضافة والتحديث.
    - `DriverSettlement`: معرّف، رقم السند الفريد (`STL-YYYYMMDD-XXXX`)، الفرع (`branchId`)، الطيار (`driverId`)، الكاشير المستلم (`cashierId`)، الوردية النقدية (`cashShiftId`)، إجمالي الطلبات، إجمالي النقدية المحصلة (`totalCollectedMinor`)، ملاحظات، وتاريخ التسوية.
    - تحديث `Order`: إضافة `driverId`، `driverName`، `dispatchedAt`، `deliveredAt`، `driverSettlementId`، وفهارس استعلام سريعة.
    - تحديث `Branch`، `User`، `CashShift`: ربط علاقات السائقين وسندات التسوية وحركات الورديات النقدية.
  - **2. طبقة المجال (Domain Layer):**
    - Enums: `DriverStatus` (`AVAILABLE`, `ON_DELIVERY`, `OFF_DUTY`) و `VehicleType` (`MOTORCYCLE`, `BICYCLE`, `CAR`).
    - كيان `DeliveryDriverEntity` بقواعد التحقق من صحة الاسم والهاتف ولوحة المركبة.
    - خدمة الحسابات المالية `DriverSettlementCalculatorService`: احتساب إجمالي النقدية المحصلة بالـ Minor Units بدقة متناهية وفصل طلبات الدفع عند الاستلام (COD) عن الطلبات المدفوعة مسبقاً (Prepaid).
    - تحديث `OrderStateMachineService` لدعم إسناد الطيار عند الانتقال لحالة `OUT_FOR_DELIVERY`.
  - **3. طبقة التطبيق (Application Layer & Use Cases):**
    - `SaveDriverUseCase`: إضافة أو تعديل بيانات كابتن التوصيل بالفرع مع منع تكرار أرقام الهواتف داخل الفرع نفسه.
    - `ListBranchDriversUseCase`: جلب كباتن الفرع مع إحصائيات فورية (الطلبات النشطة، والطلبات المسلّمة غير المورّدة، والمبلغ النقدي المعلق بالعهدة).
    - `DispatchOrderUseCase`: خروج الطلبات للتوصيل في معاملة ذرية (`$transaction`)، ربط الطيار بالطلب وتحديث حالته إلى `OUT_FOR_DELIVERY` وتحويل الكابتن إلى `ON_DELIVERY`.
    - `GetDriverPendingSettlementUseCase`: جلب كشف حساب العهدة المعلقة للطيار، والتحقق من وجود وردية كاشير نشطة بالفرع لاستقبال النقدية.
    - `SettleDriverCashUseCase`: إقفال عهدة الطيار ذرية، توليد رقم سند فريد، ربط الطلبات المسلّمة بالسند، تسجيل حركة إيداع نقدية (`CASH_IN`) في وردية الكاشير النشطة، وتحديث حالة الكابتن إلى `AVAILABLE`.
    - Server Actions نحيفة في `src/app/actions/delivery.actions.ts` مع حراسة الصلاحيات ونطاق الفرع.
  - **4. مركز إدارة الطلبات وكباتن التوصيل (`/admin/orders`):**
    - زر علوي `[أسطول التوصيل والطيارين]` لفتح شاشة إدارة الأسطول.
    - نافذة إدارة الأسطول والعهد (`FleetManagementModal`): تبويب لسجل الكباتن وإضافتهم ومتابعة حالتهم، وتبويب كشف العهد النقدية مع زر توريد العهدة.
    - نافذة إسناد وخروج الطلب (`DispatchModal`): اختيار الكابتن المتاح بالفرع وخروج الطلب للتوصيل عند النقر على `مع المندوب`.
    - إيصال توريد عهدة حراري 80mm مقنن (`DriverSettlementReceipt`): طباعة تفاصيل السند والطلبات وتوقيع الكابتن والكاشير واستلام المبلغ بدرج الوردية.
    - بطاقة الكابتن في تفاصيل الطلب (`OrderDetailModal`): عرض الكابتن المكلف ووقت الخروج وزر اتصال هاتفي مباشر.
  - **5. متتبع الطلبات العام للزبائن (`/order/[code]`):**
    - بطاقة تفاعلية أنيقة تظهر تلقائياً عندما يصبح الطلب `في الطريق إليك` أو `تم التسليم`، توضح اسم كابتن التوصيل وزر اتصال هاتفي مباشر لسهولة التواصل.
- **الحالة الراهنة للمشروع (Current System State):**
  - دورة أسطول التوصيل وإسناد الطلبات وإقفال العهدة النقدية تعمل بنجاح 100% ومترابطة تماماً مع مركز الطلبات والورديات النقدية والموقع العام.
- **نتائج الفحص والاختبارات (Verification):**
  - **189 اختباراً آلياً ناجحاً بنسبة 100%** عبر Vitest في 38 ملف اختبار (13 اختباراً إضافياً يغطي نموذج السائقين، حاسبة التسوية، وجميع حالات الاستخدام).
  - فحص TypeScript الصارم (`npx tsc --noEmit`) ناجح 100% (0 errors).
  - فحص التنسيق والجودة (`npm run lint`) ناجح 100% (0 errors, 0 warnings).
  - البناء الإنتاجي (`npm run build`) ناجح بالكامل لجميع المسارات الـ 17 للنظام.
  - ميثاق الوقار البصري: 0 Emojis في جميع واجهات النظام ومكوناته.
- **دليل الانتقال للمرحلة التالية (Next Step Handoff):**
  - تم إنجاز أسطول التوصيل والطيارين وإقفال العهدة المالية بنجاح كامل ومترابط.

---

#### المرحلة 12: تحسينات تجربة المستخدم للـ POS ومعالجة التسلسل (POS UX Overhaul & Serialization) — [x] مكتملة
- **الهدف:** إعادة هندسة مساحات واجهة نقطة البيع (POS) لتحرير مساحة السلة لتبدو مريحة وتتسع لأكثر من 8 أصناف بدلاً من صنف واحد، ونقل لوحة التحصيل لنافذة دفع مخصصة للمس، وحل مشكلة تسلسل كائنات `Decimal` في الـ Server Actions.
- **ما تم إنجازه بدقة:**
  - **1. تحرير السلة (`pos-cart.tsx`):**
    - إعادة تصميم أسطر السلة (`CartLines`) لتكون مدمجة (`p-2`, `space-y-1.5`) لتتسع لـ 7 إلى 9 أصناف في الشاشة الواحدة دون تمرير.
    - تقليص خيارات الملاحظات والخصم (`CartOptions`) إلى أزرار سريعة مصغرة تتمدد فقط عند الحاجة.
    - ملخص مالي مدمج (`CartTotals`) يشغل سطرين فقط.
  - **2. نافذة دفع سريعة مخصصة للمس (`PaymentModal`):**
    - نافذة مستقلة لشاشات اللمس تدعم النقد والبطاقة والدفع المختلط، وحاسبة فورية للباقي المستحق، وفئات نقدية سريعة، وإغلاق تلقائي عند اكتمال البيع.
  - **3. شبكة عرض المنتجات (`PosCatalog`):**
    - تقليص ارتفاع بطاقات الأصناف لتتسع الشاشة لـ 16-20 صنفاً في نفس الوقت مع استجابة للشاشات العريضة.
  - **4. معالجة الـ Decimal Serialization الجذري:**
    - تطبيع نسبة الضريبة `taxRatePercent` إلى رقم قياسي (`Number`) في كافة حالات الاستخدام للطلبات والطاولات (`open-table-tab`, `add-items-to-tab`, `close-table-tab`, `transfer-table`, `assign-order-branch`, `update-order-status`, `place-online-order`) لمنع أي تعارض مع React Server Components و Server Actions.
- **نتائج الفحص والاختبارات (Verification):**
  - 189 اختباراً آلياً ناجحاً بنسبة 100% عبر Vitest.
  - TypeScript: 0 errors (`npx tsc --noEmit`).
  - Linter: 0 errors, 0 warnings (`npm run lint`).
  - Next.js Production Build: نجاح كامل لكافة المسارات الـ 17 (`npm run build`).
  - التزام تام بحظر الرموز التعبيرية (0 Emojis) وكائن `Money` للعمليات المالية.

---

#### المرحلة 13: محرك المطبخ وبونات التحضير التفاعلية (Kitchen Engine — KDS & KOT 80mm) — [x] مكتملة
- **الهدف:** بناء منظومة المطبخ المتكاملة للشيف وطاقم التحضير، وتوليد بونات تحضير حرارية 80mm خالية من الأسعار، وشاشة مطبخ تفاعلية فورية (KDS) لتتبع الطلبات وتجهيزها بضغطة زر واحدة.
- **ما تم إنجازه بدقة:**
  - **1. نمذجة البيانات وتحديث Prisma:**
    - إضافة صلاحيات المطبخ إلى `PermissionCode`: `KITCHEN_VIEW` و `KITCHEN_BUMP`.
    - تحديث جدول `Order`: إضافة `kitchenStartedAt`، `kitchenCompletedAt`، و `kitchenNotes`.
    - تحديث جدول `OrderItem`: إضافة `isPrepared` (افتراضياً false) و `preparedAt`.
  - **2. طبقة التطبيق واستخدامات المطبخ (Use Cases & Server Actions):**
    - `GetKitchenOrdersUseCase`: استعلام الطلبات قيد التحضير مرتبة تصاعدياً (FIFO) مع احتساب الثواني المنقضية ورسم شجرة الأصناف والإضافات، وإرجاع كائنات مجردة خفيفة.
    - `BumpKitchenOrderUseCase`: التحقق من انتقال الحالة إلى `READY_FOR_PICKUP` وتسجيل وقت انتهاء التحضير وإتمام كافة الأصناف غير المكتملة ذرياً.
    - `ToggleKitchenItemPreparedUseCase`: تحديث حالة تحضير صنف بعينه في المطبخ لدعم قائمة تفقدية تفاعلية لكل صنف.
    - سيرفر أكشنز نحيفة (<= 30 سطر) في `src/app/actions/kitchen.actions.ts` مع حراسة الجلسة والصلاحيات وعزل الفروع الصارم.
  - **3. بون المطبخ الحراري 80mm (KOT Engine):**
    - مكون طباعة حراري موحد خالي تماماً من أي بيانات مالية أو أسعار: `KitchenOrderTicketPrint` في `src/components/printing/kitchen-order-ticket.tsx`.
    - إبراز نوع الطلب (صالة ورقم الطاولة، سفري، توصيل)، والكميات الضخمة الواضحة `[ 2× ]`، والإضافات والملاحظات الخاصة (بدون بصل، حار.. إلخ).
    - أزرار طباعة فورية مدمجة في: تفاصيل الطلب بمركز الطلبات (`/admin/orders`)، نافذة طاولة الصالة بالـ POS، وإيصالات الـ POS السابقة.
  - **4. شاشة المطبخ التفاعلية (KDS Client):**
    - مسار إداري مخصص لشاشات المطبخ واللمس: `/admin/kitchen` برابط سريع في الشريط الجانبي وأيقونة `ChefHat`.
    - عداد زمني تصاعدي فوري (Live Stopwatch) لكل تذكرة يتلون ديناميكياً: زمردي هادئ (< 10 دقائق)، كهرماني تحذيري (10-20 دقيقة)، أحمر متوهج نابض (> 20 دقيقة).
    - تنبيه صوتي عبر الـ Web Audio API بتردد مميز ينبه المطبخ فور نزول طلب جديد مع إمكانية الكتم وحفظ التفضيل محلياً.
    - تبويبات فلترة بنقرة واحدة: [الكل]، [صالة]، [سفري]، [توصيل] مع عدادات فورية لكل نوع.
    - قائمة تفقدية للمس لكل صنف (Tap-to-strike-through) لتشطيب الأصناف المجهزة أولاً بأول، مع شريط تقدم إنجاز الصنف.
    - زر كبير مخصص للمس "تم التجهيز (Bump)" ينقل الطلب فوراً ويفرغه من الشاشة مع تحديث فوري وسلس.
    - زر ملء الشاشة (Fullscreen Toggle) وزر إعادة طباعة بون المطبخ الحراري 80mm مباشرة من التذكرة.
- **نتائج الفحص والاختبارات (Verification):**
  - **192 اختباراً آلياً ناجحاً بنسبة 100%** عبر Vitest في 39 ملف اختبار (بما فيها اختبارات حالات استخدام المطبخ).
  - TypeScript: 0 errors (`npx tsc --noEmit`).
  - Linter: 0 errors, 0 warnings (`npm run lint`).
  - Next.js Production Build: نجاح كامل لجميع المسارات الـ 18 للنظام (`npm run build`).
  - التزام تام بميثاق الوقار البصري (0 Emojis) ومعايير Clean Code و SOLID.

---

#### المرحلة 14: سجل الفواتير الشامل وتناغم القنوات المتعددة (Unified Invoices & Cross-Flow Integration) — [x] مكتملة
- **الهدف:** توحيد كافة فواتير المنظومة ومبيعاتها (POS، صالة، سفري، وتوصيل أونلاين) في سجل ومراجعة شاملة متاحة للأونر والمدير والمحاسب، وإغلاق حلقة التواصل بين المطبخ ونقطة البيع، وحماية حجوزات الصالة ضد التزامن الذري.
- **ما تم إنجازه بدقة:**
  - **1. قمرة تدقيق ومراجعة الفواتير `/admin/invoices`:**
    - مسار إداري متكامل برابط مخصص في الشريط الجانبي (`Receipt`) متاح لأدوار الإدارة والمالية (`MANAGE_ORDERS` أو `VIEW_REPORTS`).
    - شريط مؤشرات علوي بـ 6 بطاقات: إجمالي المبيعات المحصلة بـ `Money`، إجمالي عدد الفواتير، فواتير الصالة، فواتير السفري (POS)، طلبات التوصيل، والشيكات المفتوحة بانتظار السداد.
    - فلاتر تشغيلية ومحاسبية دقيقة: الفرع، قناة البيع (`ALL` / `POS` / `ONLINE`)، نوع الطلب (`DINE_IN` / `TAKEAWAY` / `DELIVERY`)، حالة السداد (`PAID` / `PENDING`)، طريقة الدفع (`CASH` / `CARD` / `MIXED`)، كاشير محدد، ونطاق التاريخ.
    - جدول فواتير تفصيلي يعرض رقم الفاتورة، وقت الإصدار، الفرع، نوع وقناة البيع، الكاشير المسؤول، معاينة الأصناف، طريقة السداد، الإجمالي بالجنيه.
    - نافذة تفاصيل وتدقيق مالي متكاملة (Invoice Audit Modal): تفصيل كل صنف ومقاساته وإضافاته، ملخص ضريبي ومالي وخصومات، وسجل المدفوعات المجزأة، وأوقات التحضير والتوصيل.
    - إعادة طباعة الإيصال الحراري 80mm أو بون المطبخ KOT بنقرة واحدة مباشرة من السجل أو من نافذة التدقيق.
  - **2. تحديث `ListOrdersUseCase` و `order.dto.ts`:**
    - التخلص من قيد الحجب الصارم وإتاحة استرجاع الفواتير من كافة القنوات مع الحفاظ على التوافق الرجعي لقمرة التوصيل.
    - تضمين العلاقات الكاملة: الكاشير، الطاولة والقسم، الوردية، سجل الدفعات `payments`، والزبون ببياناته الحقيقية.
  - **3. إغلاق حلقة المطبخ ونقطة البيع (Kitchen-to-POS Ready Notification):**
    - زر تنبيه تفاعلي في ترويسة الـ POS (`PosHeader`) يظهر نبضاً زمردياً تلقائياً فور تجهيز أي طلب بالمطبخ (`READY_FOR_PICKUP`).
    - نافذة استعراض منبثقة في الـ POS توضح أرقام الطاولات أو أرقام الطلبات السفرية الجاهزة للاستلام فوراً من الكاونتر.
  - **4. قفل صف الطاولة ضد التزامن (Concurrency Safety):**
    - إضافة قفل `SELECT ... FOR UPDATE` في `open-table-tab.use-case.ts` لمنع فتح شيكين متزامنين على نفس الطاولة نهائياً.
    - تغليف تكلفة المخزون بكائن `Money` الصارم في `prisma-pos-transaction.ts`.
- **نتائج الفحص والاختبارات (Verification):**
  - **197 اختباراً آلياً ناجحاً بنسبة 100%** عبر Vitest في 40 ملف اختبار (بما فيها اختبارات التدقيق الشامل الجديد `invoices-audit-use-cases.test.ts`).
  - TypeScript: 0 errors (`npx tsc --noEmit`).
  - Linter: 0 errors, 0 warnings (`npm run lint`).
  - Next.js Production Build: نجاح كامل لجميع المسارات الـ 19 للنظام (`npm run build`).
  - التزام تام بميثاق الوقار البصري (0 Emojis) ومعايير Clean Code و SOLID.

---

#### المرحلة 15: منظومة الطباعة المزدوجة لبونات المطبخ KOT وإعادة هيكلة KDS للشاشات الميدانية (Dual KOT Printing & KDS Field Overhaul) — [x] مكتملة
- **الهدف:** حل المعضلة التشغيلية للمطاعم الميدانية التي تعتمد على البونات الورقية فقط دون شاشات مطبخ، أو المطاعم الهجينة، وإعادة هيكلة واجهة الـ KDS بالكامل لتكون شاشة متخصصة مستقلة واسعة تناسب بيئة المطبخ الحقيقية بدون أي التفاف غير مرغوب لأرقام الطلبات.
- **ما تم إنجازه بدقة:**
  - **1. منظومة الطباعة المزدوجة والطباعة التلقائية في الـ POS (Dual Printing & Auto-Print):**
    - نافذة تشغيلية سريعة تظهر للكاشير فور إتمام أي عملية بيع (`PostSaleModal`):
      - 📄 **طباعة فاتورة العميل:** طباعة الإيصال المالي الحراري 80mm للزبون.
      - 👨‍🍳 **طباعة بون المطبخ (KOT):** طباعة تذكرة التحضير الحرارية 80mm الخالية من الأسعار لإرسالها فوراً للمطبخ أو الشواية.
      - ⚡ **طباعة الاثنين معاً:** أمر طباعة متتالي يطبع الفاتورة متبوعة ببون المطبخ مباشرة.
      - خيار حفظ التفضيل: `☑ طباعة بون المطبخ تلقائياً مع الفاتورة عند كل بيع` (محفوظ محلياً بـ `localStorage: resto_pos_auto_print_kot`) لتسهيل العمل في المطاعم التي لا تملك شاشات مطبخ وتعتمد على خروج التذكرتين معاً.
      - زر "طلب جديد (متابعة)" لإغلاق النافذة وبدء خدمة الزبون التالي فوراً.
    - إعادة ترتيب أزرار طاولة الصالة في `TableTabModal` إلى شبكة خماسية متناسقة تشمل زر [بون المطبخ] المباشر.
  - **2. إدخال مبيعات الكاشير التلقائي لصف المطبخ (Kitchen Queue Integration):**
    - في `prisma-pos-transaction.ts`: حفظ طلبات الـ POS بحالة تحضير `OrderStatus.PREPARING` وحالة دفع `PaymentStatus.PAID` مع توثيق `kitchenStartedAt`، مما يجعل طلبات السفري تنزل تلقائياً على شاشة المطبخ KDS للشيف، وعندما ينقر الشيف "تم التجهيز (Bump)" يظهر إشعار فوري للكاشير في الكاونتر باللون الأخضر لتسليم الوجبة.
  - **3. إعادة هيكلة وتصميم شاشة المطبخ (KDS Overhaul):**
    - فصل شاشة المطبخ `/admin/kitchen` عن قالب الإدارة الأبيض المزدحم في `admin-shell.tsx`، لتتحول إلى شاشة سوداء كاملة العرض (`h-screen w-screen bg-zinc-950 overflow-hidden`).
    - إضافة زر تنقل علوي "لوحة التحكم" مع سهم أيقوني للعودة السريعة للوحة الإدارة.
    - إعادة تصميم رأس بطاقة التذكرة: إبراز وجهة الطلب بنمط عريض وواضح في السطر الأول (**طاولة X (صالة)**، **سفري**، **توصيل**) مع العداد الزمني التصاعدي الملون.
    - نقل رقم الطلب إلى سطر ثانٍ مخصص بخط أحادي المسافة (`font-mono text-xs whitespace-nowrap` مع `dir="ltr"`) لمنع التفاف الشرطات نهائياً وتجنب تكسر رقم الطلب على عدة أسطر.
    - شبكة استجابة مرنة (1 إلى 4 أعمدة كحد أقصى) تضمن عرضاً مريحاً وكبيراً لكل بطاقة على شاشات اللمس والتابلت.
- **نتائج الفحص والاختبارات (Verification):**
  - **197 اختباراً آلياً ناجحاً بنسبة 100%** عبر Vitest في 40 ملف اختبار.
  - TypeScript: 0 errors (`npx tsc --noEmit`).
  - Linter: 0 errors, 0 warnings (`npm run lint`).
  - Next.js Production Build: نجاح كامل لجميع المسارات الـ 19 للنظام (`npm run build`).
  - التزام صارم بالقواعد الذهبية وميثاق الهوية البصرية (0 Emojis) ونظام الألوان المتزن.

---

#### المرحلة 16: الترقيم التسلسلي البشري للطلبات ودرع العزل الشامل للطباعة الحرارية 80mm (Human Order Numbers & Thermal Print Shield) — [x] مكتملة
- **الهدف:** حل المشكلتين التشغيليتين الحرجتين اللتين أشار إليهما المستخدم:
  1. أرقام الطلبات والفواتير المعقدة وغير القابلة للاستخدام البشري (مثل `#POS-F93A2651-9B92-4D17-82D4-45194EBFF968`).
  2. مشاكل أوامر الطباعة وخروج عناصر غريبة وصفحات الويب وأزرار المنظومة على ورق الطابعات الحرارية أو خروج تذاكر متداخلة معاً.
- **ما تم إنجازه بدقة:**
  - **1. خدمة الترقيم التسلسلي البشري الذري (`OrderNumberService`):**
    - تم إنشاء `src/domain/ordering/services/order-number.service.ts`.
    - توليد أرقام تصاعدية سهلة ومريحة للبشر تبدأ من `1001` وتتصاعد بالتوالي (`1001`, `1002`, `1003`...).
    - استخدام استعلام ذري مع قفل صريح في MySQL داخل الـ Transaction:
      `SELECT COALESCE(MAX(CAST(order_number AS UNSIGNED)), 1000) + 1 AS next_num FROM orders WHERE order_number REGEXP '^[0-9]+$' FOR UPDATE`
      مع تجاهل المعرفات القديمة السداسية عشرية وتوفير حماية تراجعية آمنة (Safe Fallback).
    - استبدال توليد الـ UUID في `src/infrastructure/pos/prisma-pos-transaction.ts` وفي فتح شيكات الصالة `open-table-tab.use-case.ts`.
  - **2. درع العزل الشامل للطباعة الحرارية (Global Thermal Print Shield):**
    - تم تحديث `src/app/globals.css` بقواعد `@media print` صارمة ومحكمة:
      - حجب كافة عناصر شجرة الـ DOM بالكامل: `body * { visibility: hidden !important; }`.
      - حصر الإظهار استثنائياً وفقط لعناصر التذاكر المعتمدة عبر الفئات والمعرفات:
        `#printable-pos-receipt`, `#printable-kitchen-ticket`, `#printable-table-bill`, `#printable-thermal-receipt`, `#printable-settlement-receipt`, `.printable-document`.
      - إلغاء الهوامش وإلزام الطابعة بعرض رول الفواتير 80mm القياسي (`width: 76mm; margin: 0 auto;`).
  - **3. توحيد قوالب الطباعة وإبراز رقم الطلب:**
    - تحديث `pos-receipt.tsx` (فاتورة الكاشير وشيك الطاولة)، `kitchen-order-ticket.tsx` (بون المطبخ KOT)، `thermal-receipt.tsx` (قمرة الطلبات)، و `driver-settlement-receipt.tsx` (تصفية عهدة الطيار).
    - إبراز رقم الطلب في رأس كل تذكرة بحجم كبير عريض (`text-2xl font-black font-mono`).
  - **4. طابور المستند النشط الواحد للطباعة (Single Active Print Document State):**
    - إلغاء الحالات المتعددة المتزامنة في `pos-client.tsx` واستبدالها بحالة واحدة `activePrintDoc: { type: 'RECEIPT' | 'KOT' | 'BILL' }`.
    - منع تداخل مستندين معاً عند الضغط على الطباعة المتتالية أو الطباعة المزدوجة التلقائية.
    - إلغاء استدعاء الطباعة التلقائي المزدوج في `use-pos-workspace.ts`.
- **نتائج الفحص والاختبارات (Verification):**
  - **201 اختباراً آلياً ناجحاً بنسبة 100%** عبر Vitest في 41 ملف اختبار (تشمل اختبارات `order-number-service.test.ts`).
  - TypeScript: 0 errors (`npx tsc --noEmit`).
  - Linter: 0 errors, 0 warnings (`npm run lint`).
  - Next.js Production Build: نجاح كامل لجميع المسارات الـ 19 للنظام (`npm run build`).
  - التزام صارم بالقواعد الذهبية وميثاق الهوية البصرية (0 Emojis) ونظام الألوان المتزن.

---

#### المرحلة 17: إعادة هندسة وتطوير قمرة سجل الفواتير الشاملة `/admin/invoices` (Executive Invoices Cockpit Overhaul) — [x] مكتملة
- **الهدف:** معالجة كافة الملاحظات البصرية والتنظيمية في شاشة سجل ومراجعة الفواتير `/admin/invoices` لتحويلها إلى قمرة تدقيق مالية فاخرة، مريحة للعين، وعملية للمديرين والمحاسبين.
- **ما تم إنجازه بدقة:**
  - **1. إعادة تصميم بطاقات المؤشرات (Executive KPI Cards):**
    - شبكة استجابة مرنة بأيقونات ملونة أنيقة (`Banknote`, `Receipt`, `Utensils`, `Store`, `Bike`, `Clock`) وخلفيات هادئة.
    - أرقام مالية كبيرة وواضحة بخط أحادي المسافة (`font-mono`) مع منع تام لالتفاف رمز العملة (`whitespace-nowrap`).
  - **2. هندسة شريط الفلاتر الذكي (Two-Tier Filter Cockpit):**
    - المستوى الأول: حقل بحث عريض مع زر مسح فوري، وقوائم الفرع والكاشير ونطاق التاريخ، وأزرار تطبيق وإعادة ضبط الفلاتر بنقرة واحدة.
    - المستوى الثاني: شرائح فلترة سريعة وهادئة (Pills) لحالة السداد (أخضر زمردي للمدفوع، أحمر للشيك المفتوح)، نوع الطلب (صالة/سفري/توصيل)، القناة (POS/أونلاين)، وطريقة الدفع.
  - **3. ضبط جدول الفواتير ومنع تكسر أرقام الطلبات (Table Refinement):**
    - تحديد عروض صريحة وثابتة لكافة الأعمدة لمنع تكسر النصوص أو مزاحمة الأعمدة لبعضها.
    - عرض رقم الفاتورة على سطر واحد بنمط `whitespace-nowrap font-mono font-bold text-zinc-900`.
    - عرض الإجمالي المالي في سطر واحد بدون التفاف `ج.م`.
    - أعمدة واضحة للفرع، الكاشير، التاريخ والوقت، ووسام عدد القطع (`3 قطع`) مع ملخص الأصناف.
    - أزرار إجراءات سريعة واضحة (معاينة الفاتورة، طباعة الإيصال 80mm، طباعة بون المطبخ KOT).
  - **4. نظام ترقيم الصفحات (Pagination & Page Controls):**
    - إنهاء مشكلة القائمة اللانهائية المتعبة في الشاشة.
    - شريط تحكم كامل في أسفل الجدول: عرض النطاق الحالي من إجمالي الفواتير، أزرار السابق والتالي، ورقم الصفحة، مع إمكانية اختيار عدد السجلات في الصفحة (`15, 25, 50, 100`).
  - **5. تصدير كشف الفواتير لـ Excel / CSV:**
    - زر تصدير مدمج في الترويسة يولد ملف CSV فوري يدعم الحروف العربية بترميز UTF-8 BOM وتنزيله مباشرة لجهاز المستخدم.
- **نتائج الفحص والاختبارات (Verification):**
  - **201 اختباراً آلياً ناجحاً بنسبة 100%** عبر Vitest في 41 ملف اختبار.
  - TypeScript: 0 errors (`npx tsc --noEmit`).
  - Linter: 0 errors, 0 warnings (`npm run lint`).
  - Next.js Production Build: نجاح كامل لجميع المسارات الـ 19 للنظام (`npm run build`).
  - التزام صارم بالقواعد الذهبية وميثاق الهوية البصرية (0 Emojis) ونظام الألوان المتزن.

---

#### المرحلة 18: تأسيس بيئة العرض والعرض التجريبي، الموقع متعدد الصفحات ثنائي اللغة، نظام حجز الفعاليات `/admin/bookings`، محرك QR المنيو، ورفع الصور المحلي — [x] مكتملة
- **الهدف:** تجهيز المنظومة للعرض النهائي على العملاء بإنتاجية وفخامة تامة:
  1. موقع إلكتروني عام متعدد الصفحات راقٍ ومتكامل (`/`, `/about`, `/branches`, `/contact`, `/menu`).
  2. دعم كامل للثنائية اللغوية التفاعلية (Arabic RTL / English LTR) بنسبة 100% بدون أي تداخل أو نصوص هاردكود أو لغة متبقية عند التبديل.
  3. استمارة حجز فعاليات وبوفيهات حقيقية في `/contact` مع حفظ مباشر في جدول `EventBooking` وتوليد رابط واتساب مباشر لإدارة المناسبات فورياً، وقمرة مركزية `/admin/bookings` لمتابعة الحالات والتأكيد.
  4. محرك كود الـ QR للمنيو لطباعة كروت الدعاية وستاندات الطاولات الأكريليك.
  5. وحدة رفع الصور وحفظها محلياً في `public/uploads/products/` بحد أقصى 5MB وحماية UUID للمسارات.
  6. ضبط وتوحيد قاعدة البيانات بـ 3 فروع حقيقية معتمدة (المعادي، التجمع الخامس، مدينة نصر)، ومنيو 20 صنفاً فاخراً، وتوحيد كلمة المرور لجميع الحسابات التجريبية (`123456`) مع شريط تعبئة سريع في `/login`.
- **ما تم إنجازه بدقة:**
  - **1. نموذج وقاعدة بيانات الحجوزات (`EventBooking`):**
    - جدول `event_bookings` في Prisma و MySQL مع ربط الفرع الأجنبي `branch_id`.
    - مسار إداري متكامل وقمرة تشغيلية `/admin/bookings` تدعم الفلترة، تحديث الحالات، الاتصال بالعميل، والواتساب المباشر، مع شارة عداد الحجوزات المعلقة في القائمة الجانبية.
    - مسار الحجز في واجهة الاتصال `/contact` مع فتح واتساب فوري للفرع المختار برسالة رسمية متكاملة.
  - **2. صفحات الموقع العام والثنائية اللغوية التفاعلية:**
    - نقل صفحات `/about`, `/branches`, `/contact` لـ Client Components تفاعلية ترتبط مباشرة بسياق `useCart().locale`.
    - حذف قسم فريق الطهاة من صفحة "من نحن" تماماً وفق رغبة المستخدم.
    - عزل كامل للغة: واجهة إنجليزية 100% باتجاه LTR عند اختيار English، وواجهة عربية 100% باتجاه RTL عند اختيار Arabic.
    - تنظيف الفروع وضمان ظهور الفروع الـ 3 المعتمدة فقط مع أرقام هواتفها وعناوينها وساعات عملها وخريطة المواقع.
  - **3. مولد وطباعة QR كود المنيو الرقمي:**
    - محرك SVG QR كود ذاتي بدون أي مكتبات خارجية ثقيلة (`src/infrastructure/qr/qr-code.ts`).
    - نافذة معاينة وطباعة حرارية وقوالب ستاند الطاولة (Acrylic Stand) وكارت الدعاية للعملاء (Marketing Card).
  - **4. وحدة رفع الصور المحلية (Local Image Upload):**
    - `ProductImagePicker` ومسار التخزين `public/uploads/products/` مع توليد اسم آمن `prod_UUID_timestamp.ext`.
    - فحص نوع الملف وحجمه (حد أقصى 5 ميجابايت).
- **نتائج الفحص والاختبارات (Verification):**
  - **211 اختباراً آلياً ناجحاً بنسبة 100%** عبر Vitest في 44 ملف اختبار (تشمل `event-booking-use-cases.test.ts` و `qr-code.test.ts`).
  - TypeScript: 0 errors (`npx tsc --noEmit`).
  - Next.js Production Build: نجاح كامل لجميع المسارات الـ 21 للنظام بنسبة 100% (`npm run build`).
  - التزام صارم بالقواعد الذهبية وميثاق الهوية البصرية (0 Emojis) ونظام الألوان المتزن.

---

### 🚀 خارطة المراحل التالية (Next Roadmap Milestones):
1. **محرك الكوبونات والعروض الترويجية (Promotions & Coupons Engine):** إنشاء أكواد الخصم والتحقق منها وحسابها بدقة عبر `Money` في المتجر وسلة التوصيل ونقطة البيع.
2. **تصدير التقارير المحاسبية (Excel / CSV & PDF Export):** تصدير المبيعات، المخزون، الورديات، وتسويات الطيارين بنقرة واحدة.

