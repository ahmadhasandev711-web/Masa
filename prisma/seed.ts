import { prisma } from '../src/infrastructure/db/prisma';
import bcrypt from 'bcryptjs';
import { SYSTEM_PERMISSIONS } from '../src/domain/staff/enums/permission.enum';
import { SYSTEM_ROLES, SystemRole } from '../src/domain/staff/enums/role.enum';

async function main() {
  console.log('[Seed] Starting clean production database initialization...');

  // 1. Seed System Permissions (Idempotent upsert)
  console.log('[Seed] Ensuring system permissions...');
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

  // 2. Seed System Roles and Capabilities (Idempotent upsert)
  console.log('[Seed] Ensuring system roles & capabilities...');
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

  // 3. Ensure Default Restaurant Settings (Single row)
  console.log('[Seed] Initializing restaurant settings...');
  let settings = await prisma.restaurantSetting.findFirst();
  if (!settings) {
    settings = await prisma.restaurantSetting.create({
      data: {
        nameAr: process.env.RESTAURANT_NAME_AR || 'المطعم',
        nameEn: process.env.RESTAURANT_NAME_EN || 'Restaurant',
        currency: process.env.RESTAURANT_CURRENCY || 'EGP',
        currencySymbol: process.env.RESTAURANT_CURRENCY_SYMBOL || 'ج.م',
        locale: 'ar-EG',
        taxRatePercent: 14.00,
        deliveryFee: 0,
        phone: '01000000000',
        address: 'الفرع الرئيسي',
      },
    });
  }

  // 4. Ensure Single Main Branch (MAIN-01)
  console.log('[Seed] Initializing primary operational branch...');
  let mainBranch = await prisma.branch.findFirst({
    where: { code: 'MAIN-01' },
  });

  if (!mainBranch) {
    mainBranch = await prisma.branch.create({
      data: {
        code: 'MAIN-01',
        nameAr: 'الفرع الرئيسي',
        nameEn: 'Main Branch',
        phone: settings.phone || '01000000000',
        address: settings.address || 'الفرع الرئيسي',
        isActive: true,
      },
    });
  }

  // 5. Ensure Default Dining Tables for Main Branch (T-1 to T-4)
  console.log('[Seed] Ensuring default dine-in tables...');
  for (let t = 1; t <= 4; t++) {
    const tableNumber = `T-${t}`;
    const existingTable = await prisma.diningTable.findUnique({
      where: {
        branchId_tableNumber: {
          branchId: mainBranch.id,
          tableNumber,
        },
      },
    });
    if (!existingTable) {
      await prisma.diningTable.create({
        data: {
          branchId: mainBranch.id,
          tableNumber,
          capacity: 4,
          status: 'AVAILABLE',
          sortOrder: t,
          isActive: true,
        },
      });
    }
  }

  // 6. Ensure Default Expense Category (مصروفات عامة)
  const defaultCategory = await prisma.expenseCategory.findFirst({
    where: { nameAr: 'مصروفات عامة' },
  });
  if (!defaultCategory) {
    await prisma.expenseCategory.create({
      data: {
        nameAr: 'مصروفات عامة',
        nameEn: 'General Expenses',
        description: 'تصنيف المصروفات النثرية والتشغيلية العامة',
        isActive: true,
      },
    });
  }

  // 7. Ensure Super Admin Account
  console.log('[Seed] Ensuring Super Admin account...');
  const superAdminRole = await prisma.role.findUniqueOrThrow({
    where: { name: SystemRole.SUPER_ADMIN },
  });

  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || '123456';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      isActive: true,
      roleId: superAdminRole.id,
    },
    create: {
      username: 'admin',
      fullName: 'المدير العام',
      phone: '01000000000',
      passwordHash,
      roleId: superAdminRole.id,
      isActive: true,
    },
  });

  // Ensure Admin is linked to the primary branch
  const userBranch = await prisma.userBranch.findUnique({
    where: {
      userId_branchId: {
        userId: adminUser.id,
        branchId: mainBranch.id,
      },
    },
  });

  if (!userBranch) {
    await prisma.userBranch.create({
      data: {
        userId: adminUser.id,
        branchId: mainBranch.id,
        isDefault: true,
      },
    });
  }

  console.log('------------------------------------------------------------');
  console.log('✅ Clean production database initialization completed!');
  console.log('🔑 Super Admin Login:');
  console.log('   - Username: admin');
  console.log(`   - Initial Password: ${adminPassword}`);
  console.log('   - Branch: الفرع الرئيسي (MAIN-01)');
  console.log('⚠️  PLEASE CHANGE PASSWORD IMMEDIATELY UPON FIRST LOGIN');
  console.log('------------------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ [Seed Error]:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
