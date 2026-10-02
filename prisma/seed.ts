import { prisma } from '../src/infrastructure/db/prisma';
import bcrypt from 'bcryptjs';
import { SYSTEM_PERMISSIONS } from '../src/domain/staff/enums/permission.enum';
import { SYSTEM_ROLES, SystemRole } from '../src/domain/staff/enums/role.enum';

async function main() {
  console.log('[Seed] Starting complete database clean slate & staging seeding...');

  // =========================================================================
  // 0. Clean Existing Data (Safe Dependency Order)
  // =========================================================================
  console.log('[Seed] Cleaning legacy/test records...');
  await prisma.orderItemModifier.deleteMany().catch(() => {});
  await prisma.orderItem.deleteMany().catch(() => {});
  await prisma.orderPayment.deleteMany().catch(() => {});
  await prisma.driverSettlement.deleteMany().catch(() => {});
  await prisma.order.deleteMany().catch(() => {});
  await prisma.customerAddress.deleteMany().catch(() => {});
  await prisma.customer.deleteMany().catch(() => {});
  await prisma.deliveryDriver.deleteMany().catch(() => {});
  await prisma.cashShiftMovement.deleteMany().catch(() => {});
  await prisma.cashShift.deleteMany().catch(() => {});
  await prisma.diningTable.deleteMany().catch(() => {});
  await prisma.tableSection.deleteMany().catch(() => {});
  await prisma.branchProductAvailability.deleteMany().catch(() => {});
  await prisma.recipeItem.deleteMany().catch(() => {});
  await prisma.productModifierGroup.deleteMany().catch(() => {});
  await prisma.modifier.deleteMany().catch(() => {});
  await prisma.modifierGroup.deleteMany().catch(() => {});
  await prisma.productSize.deleteMany().catch(() => {});
  await prisma.product.deleteMany().catch(() => {});
  await prisma.category.deleteMany().catch(() => {});
  await prisma.inventoryMovement.deleteMany().catch(() => {});
  await prisma.branchInventory.deleteMany().catch(() => {});
  await prisma.inventoryItem.deleteMany().catch(() => {});
  await prisma.expense.deleteMany().catch(() => {});
  await prisma.expenseCategory.deleteMany().catch(() => {});
  await prisma.userBranch.deleteMany().catch(() => {});
  await prisma.user.deleteMany().catch(() => {});
  await prisma.branch.deleteMany().catch(() => {});

  // =========================================================================
  // 1. Seed System Permissions
  // =========================================================================
  console.log('[Seed] Seeding system permissions...');
  for (const perm of SYSTEM_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: {
        name: perm.name,
        category: perm.category,
        description: perm.description,
      },
      create: {
        code: perm.code,
        name: perm.name,
        category: perm.category,
        description: perm.description,
      },
    });
  }

  // =========================================================================
  // 2. Seed System Roles and Role-Permissions
  // =========================================================================
  console.log('[Seed] Seeding system roles & capabilities...');
  for (const roleDef of SYSTEM_ROLES) {
    const role = await prisma.role.upsert({
      where: { name: roleDef.name },
      update: {
        description: roleDef.description,
        isSystem: roleDef.isSystem,
      },
      create: {
        name: roleDef.name,
        description: roleDef.description,
        isSystem: roleDef.isSystem,
      },
    });

    const permissions = await prisma.permission.findMany({
      where: { code: { in: roleDef.defaultPermissions } },
    });

    for (const perm of permissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: perm.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: perm.id,
        },
      });
    }
  }

  // =========================================================================
  // 3. Seed Restaurant Settings (Dynamic Currency & MASA Identity)
  // =========================================================================
  console.log('[Seed] Seeding restaurant brand settings...');
  const existingSetting = await prisma.restaurantSetting.findFirst();
  if (!existingSetting) {
    await prisma.restaurantSetting.create({
      data: {
        nameAr: 'ماسا',
        nameEn: 'MASA Kitchen',
        currency: 'EGP',
        currencySymbol: 'ج.م',
        locale: 'ar-EG',
        taxRatePercent: 14.00,
        deliveryFee: 1500, // 15.00 EGP in minor units
        phone: '01012345678',
        address: 'شارع النصر، المعادي، القاهرة',
      },
    });
  } else {
    await prisma.restaurantSetting.update({
      where: { id: existingSetting.id },
      data: {
        nameAr: 'ماسا',
        nameEn: 'MASA Kitchen',
        currency: 'EGP',
        currencySymbol: 'ج.م',
        locale: 'ar-EG',
        taxRatePercent: 14.00,
        deliveryFee: 1500,
        phone: '01012345678',
        address: 'شارع النصر، المعادي، القاهرة',
      },
    });
  }

  // =========================================================================
  // 4. Seed Exactly 3 Realistic Branches
  // =========================================================================
  console.log('[Seed] Seeding 3 realistic branches...');
  const mainBranch = await prisma.branch.create({
    data: {
      code: 'MAIN-01',
      nameAr: 'الفرع الرئيسي - المعادي',
      nameEn: 'Main Branch - Maadi',
      phone: '01012345678',
      address: 'كورنيش النيل، شارع النصر، المعادي، القاهرة',
      isActive: true,
    },
  });

  const tagamoaBranch = await prisma.branch.create({
    data: {
      code: 'TAG-02',
      nameAr: 'فرع التجمع الخامس',
      nameEn: 'New Cairo Branch - 5th Settlement',
      phone: '01012345679',
      address: 'شارع التسعين الشمالي، التجمع الخامس، القاهرة الجديدة',
      isActive: true,
    },
  });

  const nasrCityBranch = await prisma.branch.create({
    data: {
      code: 'NASR-03',
      nameAr: 'فرع مدينة نصر',
      nameEn: 'Nasr City Branch',
      phone: '01012345680',
      address: 'شارع عباس العقاد، تقاطع الطيران، مدينة نصر، القاهرة',
      isActive: true,
    },
  });

  const allBranches = [mainBranch, tagamoaBranch, nasrCityBranch];

  // Seed dining tables for each branch (6 tables per branch)
  console.log('[Seed] Seeding dining tables for POS dine-in...');
  for (const branch of allBranches) {
    for (let t = 1; t <= 6; t++) {
      await prisma.diningTable.create({
        data: {
          branchId: branch.id,
          tableNumber: `T-${t}`,
          capacity: t <= 2 ? 2 : t <= 4 ? 4 : 6,
          status: 'AVAILABLE',
          sortOrder: t,
          isActive: true,
        },
      });
    }
  }

  // =========================================================================
  // 5. Seed 5 Unified Demo Accounts with Universal Password: 123456
  // =========================================================================
  console.log('[Seed] Seeding 5 standard demo accounts (Password: 123456)...');
  const unifiedPasswordHash = await bcrypt.hash('123456', 10);

  const superAdminRole = await prisma.role.findUniqueOrThrow({ where: { name: SystemRole.SUPER_ADMIN } });
  const managerRole = await prisma.role.findUniqueOrThrow({ where: { name: SystemRole.BRANCH_MANAGER } });
  const accountantRole = await prisma.role.findUniqueOrThrow({ where: { name: SystemRole.ACCOUNTANT } });
  const cashierRole = await prisma.role.findUniqueOrThrow({ where: { name: SystemRole.CASHIER } });
  const kitchenRole = await prisma.role.findUniqueOrThrow({ where: { name: SystemRole.KITCHEN } });

  const demoAccounts = [
    { username: 'admin', fullName: 'المدير العام للمنظومة', phone: '01012345678', roleId: superAdminRole.id },
    { username: 'manager', fullName: 'مدير فرع المعادي', phone: '01011112222', roleId: managerRole.id },
    { username: 'cashier', fullName: 'كاشير الصالة والـ POS', phone: '01033334444', roleId: cashierRole.id },
    { username: 'kitchen', fullName: 'شيف المطبخ وشاشة KDS', phone: '01044445555', roleId: kitchenRole.id },
    { username: 'accountant', fullName: 'المحاسب المالي', phone: '01022223333', roleId: accountantRole.id },
  ];

  for (const acc of demoAccounts) {
    const user = await prisma.user.create({
      data: {
        username: acc.username,
        fullName: acc.fullName,
        phone: acc.phone,
        passwordHash: unifiedPasswordHash,
        roleId: acc.roleId,
        isActive: true,
      },
    });

    // Link user to main branch as primary
    await prisma.userBranch.create({
      data: {
        userId: user.id,
        branchId: mainBranch.id,
        isDefault: true,
      },
    });

    // Also link admin to all branches
    if (acc.username === 'admin') {
      await prisma.userBranch.create({
        data: { userId: user.id, branchId: tagamoaBranch.id, isDefault: false },
      });
      await prisma.userBranch.create({
        data: { userId: user.id, branchId: nasrCityBranch.id, isDefault: false },
      });
    }
  }

  // =========================================================================
  // 6. Seed 5 Menu Categories & 20 Realistic Dishes with Images
  // =========================================================================
  console.log('[Seed] Seeding 5 menu categories & 20 gourmet products...');

  const catSteaks = await prisma.category.create({
    data: {
      nameAr: 'ستيك ومشاوي فاخرة',
      nameEn: 'Prime Steaks & Grills',
      description: 'أفضل قطع اللحم البقري الأنجوس المشوية على اللهب بأيدي أمهر الطهاة',
      sortOrder: 1,
    },
  });

  const catBurgers = await prisma.category.create({
    data: {
      nameAr: 'برجر وساندوتشات ذواقة',
      nameEn: 'Gourmet Burgers & Sandwiches',
      description: 'برجر طازج 100% لحم بقري صافي مع صوصاتنا الحصرية وخبز البريوش الطازج',
      sortOrder: 2,
    },
  });

  const catPasta = await prisma.category.create({
    data: {
      nameAr: 'باستا وأطباق مميزة',
      nameEn: 'Pasta & Italian Specialties',
      description: 'باستا إيطالية أصيلة محضرة بصلصات طازجة يومياً وجبنة البارميزان المعتقة',
      sortOrder: 3,
    },
  });

  const catStarters = await prisma.category.create({
    data: {
      nameAr: 'مقبلات وسلطات طازجة',
      nameEn: 'Starters & Fresh Salads',
      description: 'بدايات شهية وخضروات طازجة مقرمشة مع تتبيلات ماسا المميزة',
      sortOrder: 4,
    },
  });

  const catDesserts = await prisma.category.create({
    data: {
      nameAr: 'حلويات ومشروبات منعشة',
      nameEn: 'Desserts & Beverages',
      description: 'حلويات محضرة بعناية وعصائر فواكه طبيعية وموكتيلات منعشة',
      sortOrder: 5,
    },
  });

  // 20 Menu Items Definition
  const productsData = [
    // --- 1. Steaks & Grills (4 Items) ---
    {
      categoryId: catSteaks.id,
      nameAr: 'ستيك ريب آي أنجوس فاخر',
      nameEn: 'Prime Angus Ribeye Steak',
      description: 'شريحة ريب آي معتقة ومشوية على الفحم مع صوص الفلفل الأسود والبطاطا المهروسة المخملية',
      imageUrl: '/storefront/images/dinner/farhad-ibrahimzade-isHUj3N0194-unsplash.jpg',
      sortOrder: 1,
      isFeatured: true,
      sizes: [
        { nameAr: 'عادي (250 جم)', nameEn: 'Regular (250g)', price: 34000, sortOrder: 1 },
        { nameAr: 'كبير (350 جم)', nameEn: 'Large (350g)', price: 44000, sortOrder: 2 },
      ],
    },
    {
      categoryId: catSteaks.id,
      nameAr: 'أضلاع اللحم البقري المدخن بصوص الباربيكيو',
      nameEn: 'Smoked BBQ Beef Ribs',
      description: 'أضلاع بقري طرية مطهوة ببطء لمدة 8 ساعات ومدهونة بصوص الباربيكيو الغني المدخن',
      imageUrl: '/storefront/images/dinner/farhad-ibrahimzade-ZipYER3NLhY-unsplash.jpg',
      sortOrder: 2,
      isFeatured: true,
      sizes: [
        { nameAr: 'نصف لوح (3 قطع)', nameEn: 'Half Rack', price: 29000, sortOrder: 1 },
        { nameAr: 'لوح كامل (6 قطع)', nameEn: 'Full Rack', price: 48000, sortOrder: 2 },
      ],
    },
    {
      categoryId: catSteaks.id,
      nameAr: 'تندرلوين بيف ستيك مع صوص المشروم',
      nameEn: 'Tenderloin Filet Mignon',
      description: 'أنعم قطعة لحم بقري مشوية بدرجة استواء مثالية مع صوص الكريمة والمشروم الطازج',
      imageUrl: '/storefront/images/dinner/keriliwi-c3mFafsFz2w-unsplash.jpg',
      sortOrder: 3,
      isFeatured: false,
      sizes: [
        { nameAr: 'قطعة مفردة (220 جم)', nameEn: 'Single Filet', price: 36000, sortOrder: 1 },
      ],
    },
    {
      categoryId: catSteaks.id,
      nameAr: 'مشاوي مشكلة ماسا الملكية',
      nameEn: 'MASA Royal Mixed Grill',
      description: 'تشكيلة فاخرة من كباب اللحم، شيش طاووق متبل، وريش ضأن طرية مع الأرز البسمتي والمخللات',
      imageUrl: '/storefront/images/slide/jason-leung-O67LZfeyYBk-unsplash.jpg',
      sortOrder: 4,
      isFeatured: true,
      sizes: [
        { nameAr: 'وجبة فردية', nameEn: 'Single Platter', price: 26000, sortOrder: 1 },
        { nameAr: 'طبق عائلي مشكل', nameEn: 'Family Platter', price: 54000, sortOrder: 2 },
      ],
    },

    // --- 2. Burgers & Sandwiches (4 Items) ---
    {
      categoryId: catBurgers.id,
      nameAr: 'برجر ماسا المزدوج اللذيذ',
      nameEn: 'MASA Double Gourmet Burger',
      description: 'شريحتان من اللحم البقري المشوي مع جبن الشيدر الذائب وصلصة المشروم في خبز البريوش الطازج',
      imageUrl: '/storefront/images/lunch/farhad-ibrahimzade-D5c9ZciQy_I-unsplash.jpg',
      sortOrder: 1,
      isFeatured: true,
      sizes: [
        { nameAr: 'ساندوتش فردي', nameEn: 'Single Burger', price: 17500, sortOrder: 1 },
        { nameAr: 'كومبو مع بطاطس ومشروب', nameEn: 'Combo with Fries & Drink', price: 23500, sortOrder: 2 },
      ],
    },
    {
      categoryId: catBurgers.id,
      nameAr: 'دجاج كريسبي ماسا الذهبي',
      nameEn: 'MASA Golden Crispy Chicken',
      description: 'قطع دجاج مقرمشة بتتبيلة ماسا السرية مع البطاطس المتبلة وصوص الثومية الفاخر',
      imageUrl: '/storefront/images/lunch/louis-hansel-cH5IPjaAYyo-unsplash.jpg',
      sortOrder: 2,
      isFeatured: true,
      sizes: [
        { nameAr: 'وجبة 4 قطع', nameEn: '4 Pcs Meal', price: 16000, sortOrder: 1 },
        { nameAr: 'وجبة 8 قطع عائلية', nameEn: '8 Pcs Meal', price: 28000, sortOrder: 2 },
      ],
    },
    {
      categoryId: catBurgers.id,
      nameAr: 'برجر الترافل والجبن السويسري',
      nameEn: 'Swiss Truffle Gourmet Burger',
      description: 'لحم أنجوس فاخر مع جبن الإمنتال السويسري ومايونيز الكمأة السوداء والبصل المكرمل',
      imageUrl: '/storefront/images/news/louis-hansel-GiIiRV0FjwU-unsplash.jpg',
      sortOrder: 3,
      isFeatured: false,
      sizes: [
        { nameAr: 'ساندوتش فردي', nameEn: 'Single Burger', price: 19500, sortOrder: 1 },
        { nameAr: 'وجبة كومبو فاخرة', nameEn: 'Gourmet Combo', price: 25500, sortOrder: 2 },
      ],
    },
    {
      categoryId: catBurgers.id,
      nameAr: 'ساندوتش الدجاج المشوي بالأفوكادو',
      nameEn: 'Grilled Chicken Avocado Club',
      description: 'صدر دجاج مشوي على الجريل مع شرائح الأفوكادو، طماطم مجففة، صوص الرانش وخس مقرمش',
      imageUrl: '/storefront/images/lunch/louis-hansel-rheOvfxOlOA-unsplash.jpg',
      sortOrder: 4,
      isFeatured: false,
      sizes: [
        { nameAr: 'حجم عادي', nameEn: 'Regular Size', price: 15500, sortOrder: 1 },
      ],
    },

    // --- 3. Pasta & Italian Specialties (4 Items) ---
    {
      categoryId: catPasta.id,
      nameAr: 'باستا السجق الإيطالي المقرمش',
      nameEn: 'Crispy Sausage Penne Pasta',
      description: 'باستا بيني بصلصة الطماطم الغنية مع قطع السجق المدخن المقرمش وجبنة البارميزان',
      imageUrl: '/storefront/images/slide/ivan-torres-MQUqbmszGGM-unsplash.jpg',
      sortOrder: 1,
      isFeatured: true,
      sizes: [
        { nameAr: 'طبق مفرد', nameEn: 'Single Plate', price: 18500, sortOrder: 1 },
        { nameAr: 'طبق عائلي كبير', nameEn: 'Family Bowl', price: 31000, sortOrder: 2 },
      ],
    },
    {
      categoryId: catPasta.id,
      nameAr: 'فيتوتشيني ألفريدو بالدجاج والمشروم',
      nameEn: 'Chicken Mushroom Fettuccine Alfredo',
      description: 'شرائط الفيتوتشيني الطازجة بصلصة الكريمة الإيطالية الثرية مع قطع الدجاج والمشروم',
      imageUrl: '/storefront/images/news/stefan-johnson-xIFbDeGcy44-unsplash.jpg',
      sortOrder: 2,
      isFeatured: false,
      sizes: [
        { nameAr: 'حجم قياسي', nameEn: 'Standard Portion', price: 19000, sortOrder: 1 },
      ],
    },
    {
      categoryId: catPasta.id,
      nameAr: 'بيتزا مارجريتا نابوليتانا الحرفية',
      nameEn: 'Artisan Neapolitan Margherita',
      description: 'عجينة مخمرة بطيئاً ومخبوزة على الحجر مع جبن الموتزاريلا الطازج وأوراق الريحان العطري',
      imageUrl: '/storefront/images/daan-evers-tKN1WXrzQ3s-unsplash.jpg',
      sortOrder: 3,
      isFeatured: false,
      sizes: [
        { nameAr: 'وسط (28 سم)', nameEn: 'Medium (28cm)', price: 14500, sortOrder: 1 },
        { nameAr: 'كبير (34 سم)', nameEn: 'Large (34cm)', price: 19500, sortOrder: 2 },
      ],
    },
    {
      categoryId: catPasta.id,
      nameAr: 'بيتزا اللحوم الإيطالية المدخنة',
      nameEn: 'Smoked Meat Lovers Pizza',
      description: 'بيبروني بقري، سجق إيطالي، بيكون مدخن مع صوص الطماطم وميكس أجبان فاخرة',
      imageUrl: '/storefront/images/news/pablo-merchan-montes-Orz90t6o0e4-unsplash.jpg',
      sortOrder: 4,
      isFeatured: true,
      sizes: [
        { nameAr: 'وسط (28 سم)', nameEn: 'Medium (28cm)', price: 18000, sortOrder: 1 },
        { nameAr: 'كبير (34 سم)', nameEn: 'Large (34cm)', price: 24000, sortOrder: 2 },
      ],
    },

    // --- 4. Starters & Salads (4 Items) ---
    {
      categoryId: catStarters.id,
      nameAr: 'طبق الإفطار الصباحي المتكامل',
      nameEn: 'Morning Fresh Breakfast Platter',
      description: 'بيض مخفوق، هاش براون ذهبي مقرمش، بيكون بقري، خبز محمص وعصير برتقال طازج',
      imageUrl: '/storefront/images/breakfast/brett-jordan-8xt8-HIFqc8-unsplash.jpg',
      sortOrder: 1,
      isFeatured: false,
      sizes: [
        { nameAr: 'وجبة متكاملة', nameEn: 'Full Platter', price: 11000, sortOrder: 1 },
      ],
    },
    {
      categoryId: catStarters.id,
      nameAr: 'سلطة السيزر مع الدجاج المشوي',
      nameEn: 'Grilled Chicken Caesar Salad',
      description: 'قلوب الخس الروماني المقرمش، خبز محمص بالأعشاب، جبن بارميزان وصوص السيزر الكلاسيكي',
      imageUrl: '/storefront/images/news/ella-olsson-mmnKI8kMxpc-unsplash.jpg',
      sortOrder: 2,
      isFeatured: false,
      sizes: [
        { nameAr: 'طبق صحي فردي', nameEn: 'Single Bowl', price: 12500, sortOrder: 1 },
      ],
    },
    {
      categoryId: catStarters.id,
      nameAr: 'بطاطس ويدجز متبلة مع الجبن المذاب',
      nameEn: 'Seasoned Loaded Cheese Wedges',
      description: 'أصابع بطاطس ويدجز مقلية بخلطة بهارات ماسا مغطاة بجبن الشيدر الذائب وقطع البيكون',
      imageUrl: '/storefront/images/charles-deluvio-FdDkfYFHqe4-unsplash.jpg',
      sortOrder: 3,
      isFeatured: false,
      sizes: [
        { nameAr: 'طبق مقبلات', nameEn: 'Appetizer Bowl', price: 8500, sortOrder: 1 },
      ],
    },
    {
      categoryId: catStarters.id,
      nameAr: 'ساندوتش الإفطار الملكي بالبيض والأفوكادو',
      nameEn: 'Royal Avocado Egg Brioche',
      description: 'بيض عيون ذهبي مع شرائح الأفوكادو الطازجة وجبنة الفيتا على خبز البريوش المحمص',
      imageUrl: '/storefront/images/breakfast/louis-hansel-dphM2U1xq0U-unsplash.jpg',
      sortOrder: 4,
      isFeatured: false,
      sizes: [
        { nameAr: 'ساندوتش فردي', nameEn: 'Single', price: 9500, sortOrder: 1 },
      ],
    },

    // --- 5. Desserts & Beverages (4 Items) ---
    {
      categoryId: catDesserts.id,
      nameAr: 'تشيز كيك التوت البري المشكل',
      nameEn: 'Wild Berry Cheesecake',
      description: 'تشيز كيك نيويورك مخملية ناعمة مع صوص التوت البري الطازج وقاعدة البسكويت المقرمشة',
      imageUrl: '/storefront/images/news/caroline-attwood-bpPTlXWTOvg-unsplash.jpg',
      sortOrder: 1,
      isFeatured: true,
      sizes: [
        { nameAr: 'قطعة فردية', nameEn: 'Single Slice', price: 7500, sortOrder: 1 },
      ],
    },
    {
      categoryId: catDesserts.id,
      nameAr: 'بان كيك التوت البري الذهبي بالعسل',
      nameEn: 'Golden Honey Berry Pancakes',
      description: 'فطائر بان كيك هشة وطرية تعلوها طبقات التوت الأزرق الطازج مع العسل النقي والزبدة',
      imageUrl: '/storefront/images/breakfast/lucas-swennen-1W_MyJSRLuQ-unsplash.jpg',
      sortOrder: 2,
      isFeatured: false,
      sizes: [
        { nameAr: 'طبق 3 طبقات', nameEn: '3 Stack Plate', price: 8900, sortOrder: 1 },
      ],
    },
    {
      categoryId: catDesserts.id,
      nameAr: 'موهيتو التوت المنعش مع النعناع والليمون',
      nameEn: 'Berry Citrus Fresh Mojito',
      description: 'مزيج فوار من التوت الأزرق، الليمون الحامض والنعناع الأخضر الطازج والثلج المجروش',
      imageUrl: '/storefront/images/alex-haney-CAhjZmVk5H4-unsplash.jpg',
      sortOrder: 3,
      isFeatured: true,
      sizes: [
        { nameAr: 'كوب كبير (450 مل)', nameEn: 'Large Glass (450ml)', price: 5500, sortOrder: 1 },
      ],
    },
    {
      categoryId: catDesserts.id,
      nameAr: 'عصير البرتقال الطبيعي المعصور طازجاً',
      nameEn: 'Freshly Squeezed Orange Juice',
      description: 'برتقال بلدي طازج معصور على الطلب 100% طبيعي بدون سكر مضاف أو ماء',
      imageUrl: '/storefront/images/news/gilles-lambert-S_LhjpfIdm4-unsplash.jpg',
      sortOrder: 4,
      isFeatured: false,
      sizes: [
        { nameAr: 'كوب قياسي (350 مل)', nameEn: 'Regular (350ml)', price: 4500, sortOrder: 1 },
      ],
    },
  ];

  // Insert all 20 products and link them to all 3 branches
  for (const p of productsData) {
    const createdProduct = await prisma.product.create({
      data: {
        categoryId: p.categoryId,
        nameAr: p.nameAr,
        nameEn: p.nameEn,
        description: p.description,
        imageUrl: p.imageUrl,
        sortOrder: p.sortOrder,
        isFeatured: p.isFeatured,
        sizes: {
          create: p.sizes.map((s) => ({
            nameAr: s.nameAr,
            nameEn: s.nameEn,
            price: s.price,
            sortOrder: s.sortOrder,
          })),
        },
      },
    });

    for (const branch of allBranches) {
      await prisma.branchProductAvailability.create({
        data: {
          branchId: branch.id,
          productId: createdProduct.id,
          isAvailable: true,
        },
      });
    }
  }

  // =========================================================================
  // 7. Seed Modifier Groups & Modifiers
  // =========================================================================
  console.log('[Seed] Seeding modifier groups...');
  const meatDonenessGroup = await prisma.modifierGroup.create({
    data: {
      nameAr: 'درجة استواء اللحم',
      nameEn: 'Meat Doneness',
      description: 'اختر درجة استواء قطعة الستيك المفضلة لديك',
      minSelect: 1,
      maxSelect: 1,
      modifiers: {
        create: [
          { nameAr: 'استواء متوسط (Medium)', nameEn: 'Medium', priceDelta: 0, sortOrder: 1 },
          { nameAr: 'استواء كامل (Well Done)', nameEn: 'Well Done', priceDelta: 0, sortOrder: 2 },
          { nameAr: 'نصف استواء (Medium Rare)', nameEn: 'Medium Rare', priceDelta: 0, sortOrder: 3 },
        ],
      },
    },
  });

  const cheeseSauceGroup = await prisma.modifierGroup.create({
    data: {
      nameAr: 'إضافات الجبن والصوصات الإضافية',
      nameEn: 'Extra Cheese & Gourmet Sauces',
      description: 'أضف لمستك الخاصة إلى وجبتك',
      minSelect: 0,
      maxSelect: 3,
      modifiers: {
        create: [
          { nameAr: 'جبن شيدر مذاب إضافي', nameEn: 'Extra Melted Cheddar', priceDelta: 2000, sortOrder: 1 },
          { nameAr: 'صوص المشروم بالكريمة', nameEn: 'Creamy Mushroom Sauce', priceDelta: 2500, sortOrder: 2 },
          { nameAr: 'صوص الباربيكيو المدخن', nameEn: 'Smoky BBQ Sauce', priceDelta: 1500, sortOrder: 3 },
          { nameAr: 'هالبينو حار مقطع', nameEn: 'Sliced Pickled Jalapeno', priceDelta: 1500, sortOrder: 4 },
        ],
      },
    },
  });

  // Link modifier groups to steaks and burgers
  const allSteaksAndBurgers = await prisma.product.findMany({
    where: { categoryId: { in: [catSteaks.id, catBurgers.id] } },
  });

  for (const prod of allSteaksAndBurgers) {
    if (prod.categoryId === catSteaks.id) {
      await prisma.productModifierGroup.create({
        data: { productId: prod.id, groupId: meatDonenessGroup.id, sortOrder: 1 },
      });
    }
    await prisma.productModifierGroup.create({
      data: { productId: prod.id, groupId: cheeseSauceGroup.id, sortOrder: 2 },
    });
  }

  // =========================================================================
  // 8. Seed Expense Categories
  // =========================================================================
  console.log('[Seed] Seeding default expense categories...');
  const defaultExpenseCategories = [
    { nameAr: 'نثريات وضيافة', nameEn: 'Petty & Hospitality', description: 'مصاريف ضيافة ونثريات داخلية سريعة' },
    { nameAr: 'غاز ومرافق وطاقة', nameEn: 'Gas & Utilities', description: 'تعبئة أسطوانات غاز أو مصاريف مرافق طارئة' },
    { nameAr: 'صيانة طارئة ومعدات', nameEn: 'Emergency Maintenance', description: 'إصلاحات طارئة لأجهزة المطبخ أو الصالة' },
    { nameAr: 'مشتريات خضار وسوق طارئة', nameEn: 'Emergency Kitchen Purchases', description: 'شراء نواقص فورية من السوق المحلي نقداً' },
    { nameAr: 'أدوات ومواد نظافة', nameEn: 'Cleaning Supplies', description: 'منظفات ومستلزمات تعقيم وأكياس نفايات' },
    { nameAr: 'نقل وتوصيل وشحن', nameEn: 'Transportation & Logistics', description: 'مصاريف نقل بضائع أو شحن مستعجل' },
  ];

  for (const cat of defaultExpenseCategories) {
    await prisma.expenseCategory.create({
      data: {
        nameAr: cat.nameAr,
        nameEn: cat.nameEn,
        description: cat.description,
        isActive: true,
      },
    });
  }

  // =========================================================================
  // 9. Seed Delivery Drivers
  // =========================================================================
  console.log('[Seed] Seeding delivery drivers for branches...');
  for (const branch of allBranches) {
    await prisma.deliveryDriver.create({
      data: {
        branchId: branch.id,
        fullName: `كابتن توصيل - ${branch.nameAr}`,
        phone: `010${Math.floor(10000000 + Math.random() * 90000000)}`,
        vehicleType: 'MOTORCYCLE',
        licensePlate: 'ق هـ ر 123',
        status: 'AVAILABLE',
        isActive: true,
      },
    });
  }

  console.log('[Seed] Staging seed completed successfully with:');
  console.log(' - 3 Realistic Branches (Main, New Cairo, Nasr City)');
  console.log(' - 5 Role Demo Accounts (admin, manager, cashier, kitchen, accountant) with password: 123456');
  console.log(' - 5 Categories and 20 Gourmet Dishes with high-res photos across all branches');
  console.log(' - 18 Dining Tables (6 per branch for POS)');
}

main()
  .catch((e) => {
    console.error('[Seed Error] Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
