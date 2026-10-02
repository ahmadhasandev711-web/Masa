import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import { prisma } from '../src/infrastructure/db/prisma.ts';
import { JwtService } from '../src/infrastructure/auth/jwt.service.ts';
import { UnitOfMeasure, InventoryMovementType, PurchaseOrderStatus } from '../src/domain/inventory/enums/index.ts';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/IT/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const code = 'INV-E2E-' + Date.now().toString().slice(-4);
let branchId, userId, roleId, browser, supplierId, inventoryItemId;

async function createFixture() {
  console.log('[E2E Setup] Creating test branch, user, items, supplier...');
  const permissions = await prisma.permission.findMany({
    where: { code: { in: ['MANAGE_INVENTORY', 'VIEW_REPORTS'] } },
    select: { id: true },
  });

  const role = await prisma.role.create({
    data: {
      name: 'ROLE-' + code,
      description: 'E2E Inventory Test Role',
      permissions: { create: permissions.map((p) => ({ permissionId: p.id })) },
    },
  });
  roleId = role.id;

  const branch = await prisma.branch.create({
    data: {
      code,
      nameAr: 'فرع الفحص الآلي للمخزون',
      nameEn: 'Inventory Verification Branch',
      phone: '01055555555',
      address: 'القاهرة، المعادي',
      isActive: true,
    },
  });
  branchId = branch.id;

  const user = await prisma.user.create({
    data: {
      username: 'user_' + code.toLowerCase(),
      fullName: 'مدير مخزن فحص الواجهة',
      phone: '01055555555',
      passwordHash: 'dummy-hash-e2e',
      roleId,
      userBranches: { create: { branchId, isDefault: true } },
    },
  });
  userId = user.id;

  // Raw Item
  const item = await prisma.inventoryItem.create({
    data: {
      sku: 'SKU-' + code,
      nameAr: 'جبنة شيدر مستوردة',
      nameEn: 'Imported Cheddar Cheese',
      unit: UnitOfMeasure.KG,
      defaultCostMinor: 15000, // 150.00 EGP
      isActive: true,
    },
  });
  inventoryItemId = item.id;

  // Branch Stock
  await prisma.branchInventory.create({
    data: {
      branchId,
      inventoryItemId: item.id,
      quantity: 12.5,
      minThreshold: 3.0,
    },
  });

  // Supplier
  const supplier = await prisma.supplier.create({
    data: {
      name: 'شركة الألبان الممتازة ' + code,
      contactName: 'أحمد محمود',
      phone: '01122334455',
      email: 'dairy_' + code.toLowerCase() + '@example.com',
      isActive: true,
    },
  });
  supplierId = supplier.id;

  // Purchase Order
  await prisma.purchaseOrder.create({
    data: {
      orderNumber: 'PO-' + code,
      supplierId: supplier.id,
      branchId,
      status: PurchaseOrderStatus.DRAFT,
      totalMinor: 45000,
      notes: 'شحنة تجريبية للمخزن',
      items: {
        create: [
          {
            inventoryItemId: item.id,
            quantity: 3,
            unitCostMinor: 15000,
            totalCostMinor: 45000,
          },
        ],
      },
    },
  });

  // Movement
  await prisma.inventoryMovement.create({
    data: {
      branchId,
      inventoryItemId: item.id,
      type: InventoryMovementType.ADJUSTMENT,
      quantityDelta: 12.5,
      quantityBefore: 0,
      quantityAfter: 12.5,
      unitCostMinor: 15000,
      notes: 'رصيد افتتاحي للفحص الآلي',
      createdById: userId,
    },
  });

  console.log('[E2E Setup] Fixture successfully created.');
}

async function verify() {
  await createFixture();
  await mkdir('artifacts/inventory', { recursive: true });

  console.log('[E2E Test] Launching Playwright browser...');
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1366, height: 850 } });

  const token = await JwtService.sign({ userId });
  await context.addCookies([
    { name: 'resto_session', value: token, url: 'http://localhost:3100', httpOnly: true },
    { name: 'resto_active_branch_id', value: branchId, url: 'http://localhost:3100' },
  ]);

  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (err) => {
    console.error('[Browser PageError]', err.message);
    errors.push(err.message);
  });

  console.log('[E2E Test] Navigating to /admin/inventory...');
  await page.goto('http://localhost:3100/admin/inventory', { waitUntil: 'networkidle' });

  // 1. Verify Page Title & Stock Tab
  const heading = await page.getByRole('heading', { name: /المخزون والوصفات والمشتريات/ }).first();
  if (!(await heading.isVisible())) {
    throw new Error('Main page heading not visible');
  }

  // Check horizontal overflow on desktop
  const isOverflowingDesktop = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  if (isOverflowingDesktop) {
    throw new Error('Horizontal overflow detected on desktop view!');
  }

  console.log('[E2E Test] Capturing 01-stock-balances.png...');
  await page.screenshot({ path: 'artifacts/inventory/01-stock-balances.png', fullPage: true });

  // 2. Open Kitchen Issue Modal
  console.log('[E2E Test] Testing Kitchen Issue Modal...');
  const issueBtn = page.getByRole('button', { name: /صرف تشغيل للمطبخ/ }).first();
  await issueBtn.click();
  await page.waitForTimeout(300);
  console.log('[E2E Test] Capturing 02-modal-kitchen-issue.png...');
  await page.screenshot({ path: 'artifacts/inventory/02-modal-kitchen-issue.png' });
  const cancelBtn = page.getByRole('button', { name: /إلغاء/ }).first();
  await cancelBtn.click();
  await page.waitForTimeout(300);

  // 3. Tab 2: BOM Recipes
  console.log('[E2E Test] Testing BOM Recipes Tab...');
  const recipesTab = page.getByRole('button', { name: /وصفات الأطباق \(BOM\)/ });
  await recipesTab.click();
  await page.waitForTimeout(400);
  console.log('[E2E Test] Capturing 03-bom-recipes-tab.png...');
  await page.screenshot({ path: 'artifacts/inventory/03-bom-recipes-tab.png', fullPage: true });

  // Open recipe editor modal if any product has "تعديل الوصفة"
  const editRecipeBtn = page.getByRole('button', { name: /تعديل الوصفة/ }).first();
  if (await editRecipeBtn.isVisible()) {
    await editRecipeBtn.click();
    await page.waitForTimeout(300);
    console.log('[E2E Test] Capturing 04-recipe-editor-modal.png...');
    await page.screenshot({ path: 'artifacts/inventory/04-recipe-editor-modal.png' });
    const closeRecipeBtn = page.getByRole('button', { name: /إلغاء/ }).first();
    await closeRecipeBtn.click();
    await page.waitForTimeout(300);
  }

  // 4. Tab 3: Suppliers and Purchases
  console.log('[E2E Test] Testing Suppliers & Purchases Tab...');
  const suppliersTab = page.getByRole('button', { name: /الموردين وأوامر الشراء/ });
  await suppliersTab.click();
  await page.waitForTimeout(400);
  console.log('[E2E Test] Capturing 05-suppliers-and-purchases.png...');
  await page.screenshot({ path: 'artifacts/inventory/05-suppliers-and-purchases.png', fullPage: true });

  // Open purchase order modal
  const poBtn = page.getByRole('button', { name: /أمر توريد وشراء جديد/ }).first();
  if (await poBtn.isVisible()) {
    await poBtn.click();
    await page.waitForTimeout(300);
    console.log('[E2E Test] Capturing 06-modal-purchase-order.png...');
    await page.screenshot({ path: 'artifacts/inventory/06-modal-purchase-order.png' });
    const closePoBtn = page.getByRole('button', { name: /إلغاء/ }).first();
    await closePoBtn.click();
    await page.waitForTimeout(300);
  }

  // 5. Tab 4: Audit Movement Ledger
  console.log('[E2E Test] Testing Audit Movement Ledger Tab...');
  const ledgerTab = page.getByRole('button', { name: /سجل حركات المخزون/ });
  await ledgerTab.click();
  await page.waitForTimeout(400);
  console.log('[E2E Test] Capturing 07-audit-movement-ledger.png...');
  await page.screenshot({ path: 'artifacts/inventory/07-audit-movement-ledger.png', fullPage: true });

  // 6. Responsive Check (Mobile Viewport: 390x844)
  console.log('[E2E Test] Testing Mobile Responsiveness (390x844)...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);

  const isOverflowingMobile = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  if (isOverflowingMobile) {
    throw new Error('Horizontal overflow detected on mobile view (390px)!');
  }
  console.log('[E2E Test] Capturing 08-mobile-view.png...');
  await page.screenshot({ path: 'artifacts/inventory/08-mobile-view.png', fullPage: true });

  if (errors.length > 0) {
    throw new Error(`Encountered ${errors.length} browser errors during verification: ${errors.join(', ')}`);
  }

  console.log('[E2E Test] All browser verification checks passed successfully with 0 errors!');
}

async function cleanup() {
  console.log('[E2E Cleanup] Cleaning up test data...');
  if (browser) await browser.close();
  try {
    if (branchId) {
      await prisma.inventoryMovement.deleteMany({ where: { branchId } });
      await prisma.purchaseOrderItem.deleteMany({ where: { purchaseOrder: { branchId } } });
      await prisma.purchaseOrder.deleteMany({ where: { branchId } });
      await prisma.branchInventory.deleteMany({ where: { branchId } });
      await prisma.userBranch.deleteMany({ where: { branchId } });
    }
    if (inventoryItemId) {
      await prisma.recipeItem.deleteMany({ where: { inventoryItemId } });
      await prisma.inventoryItem.deleteMany({ where: { id: inventoryItemId } });
    }
    if (supplierId) {
      await prisma.supplier.deleteMany({ where: { id: supplierId } });
    }
    if (userId) {
      await prisma.user.deleteMany({ where: { id: userId } });
    }
    if (roleId) {
      await prisma.rolePermission.deleteMany({ where: { roleId } });
      await prisma.role.deleteMany({ where: { id: roleId } });
    }
    if (branchId) {
      await prisma.branch.deleteMany({ where: { id: branchId } });
    }
    console.log('[E2E Cleanup] Cleanup complete.');
  } catch (err) {
    console.error('[E2E Cleanup Error]', err);
  } finally {
    await prisma.$disconnect();
  }
}

verify()
  .catch((err) => {
    console.error('[E2E Failure]', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await cleanup();
  });
