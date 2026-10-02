import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import { prisma } from '../src/infrastructure/db/prisma.ts';
import { JwtService } from '../src/infrastructure/auth/jwt.service.ts';
import { CashMovementType, ExpenseSource, CashShiftStatus } from '../src/domain/finance/enums/index.ts';

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  ({ chromium } = require('C:/Users/IT/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
}

const code = 'FIN-E2E-' + Date.now().toString().slice(-4);
let branchId, userId, roleId, browser, shiftOpenId, shiftClosedId, expense1Id, expense2Id;

async function createFixture() {
  console.log('[E2E Setup] Creating test branch, user, shifts, expenses...');

  const permissions = await prisma.permission.findMany({
    where: { code: { in: ['MANAGE_FINANCE', 'VIEW_REPORTS', 'POS_ACCESS'] } },
    select: { id: true },
  });

  const role = await prisma.role.create({
    data: {
      name: 'ROLE-' + code,
      description: 'E2E Finance Test Role',
      permissions: { create: permissions.map((p) => ({ permissionId: p.id })) },
    },
  });
  roleId = role.id;

  const branch = await prisma.branch.create({
    data: {
      code,
      nameAr: 'فرع الفحص المالي الآلي',
      nameEn: 'Finance Verification Branch',
      phone: '01077777777',
      address: 'القاهرة، مدينة نصر',
      isActive: true,
    },
  });
  branchId = branch.id;

  const user = await prisma.user.create({
    data: {
      username: 'user_' + code.toLowerCase(),
      fullName: 'مدير الحسابات الآلي',
      phone: '01077777777',
      passwordHash: 'dummy-hash-e2e',
      roleId,
      userBranches: { create: { branchId, isDefault: true } },
    },
  });
  userId = user.id;

  // 1. Shift 1: OPEN
  const shiftOpen = await prisma.cashShift.create({
    data: {
      branchId,
      cashierId: userId,
      status: CashShiftStatus.OPEN,
      openingCashMinor: 50000, // 500.00 EGP
      currency: 'EGP',
    },
  });
  shiftOpenId = shiftOpen.id;

  // 2. Shift 2: CLOSED (Balanced)
  const shiftClosed = await prisma.cashShift.create({
    data: {
      branchId,
      cashierId: userId,
      status: CashShiftStatus.CLOSED,
      openingCashMinor: 50000,
      closingCashMinor: 120000,
      expectedCashMinor: 120000,
      varianceMinor: 0,
      varianceReason: 'مطابق ومغلق أعمى بنجاح',
      currency: 'EGP',
      closedAt: new Date(),
    },
  });
  shiftClosedId = shiftClosed.id;

  // 3. Cash Movements on Shift 1
  await prisma.cashShiftMovement.create({
    data: {
      cashShiftId: shiftOpenId,
      type: CashMovementType.CASH_IN,
      amountMinor: 20000, // 200.00 EGP
      reason: 'تغذية فكة للدرج',
      performedById: userId,
    },
  });

  await prisma.cashShiftMovement.create({
    data: {
      cashShiftId: shiftOpenId,
      type: CashMovementType.CASH_DROP,
      amountMinor: 10000, // 100.00 EGP
      reason: 'سحب توريد نقد للخزينة',
      performedById: userId,
    },
  });

  // 4. Default Expense Category
  let category = await prisma.expenseCategory.findFirst({ where: { isActive: true } });
  if (!category) {
    category = await prisma.expenseCategory.create({
      data: {
        nameAr: 'نثريات وضيافة عامة',
        nameEn: 'Petty & Hospitality',
        isActive: true,
      },
    });
  }

  // 5. Expenses
  const exp1 = await prisma.expense.create({
    data: {
      branchId,
      categoryId: category.id,
      amountMinor: 5000, // 50.00 EGP
      currency: 'EGP',
      source: ExpenseSource.REGISTER_CASH,
      description: 'شراء ضيافة ونثريات من الدرج',
      receiptNumber: 'REC-FIN-01',
      spentById: userId,
      cashShiftId: shiftOpenId,
    },
  });
  expense1Id = exp1.id;

  const exp2 = await prisma.expense.create({
    data: {
      branchId,
      categoryId: category.id,
      amountMinor: 15000, // 150.00 EGP
      currency: 'EGP',
      source: ExpenseSource.SAFE_PETTY_CASH,
      description: 'صيانة طارئة من الخزينة المركزية',
      receiptNumber: 'REC-FIN-02',
      spentById: userId,
    },
  });
  expense2Id = exp2.id;

  console.log('[E2E Setup] Fixture successfully created.');
}

async function verify() {
  await createFixture();
  await mkdir('artifacts/finance', { recursive: true });

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

  console.log('[E2E Test] Navigating to /admin/finance...');
  await page.goto('http://localhost:3100/admin/finance', { waitUntil: 'networkidle' });

  // 1. Verify Page Title
  const heading = await page.getByRole('heading', { name: /المالية والورديات والمصروفات/ }).first();
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

  console.log('[E2E Test] Capturing 01-shifts-tab.png...');
  await page.screenshot({ path: 'artifacts/finance/01-shifts-tab.png', fullPage: true });

  // 2. Open Create Expense Modal
  console.log('[E2E Test] Testing Create Expense Modal...');
  const expenseBtn = page.getByRole('button', { name: /تسجيل مصروف/ }).first();
  await expenseBtn.click();
  await page.waitForTimeout(300);
  console.log('[E2E Test] Capturing 02-modal-create-expense.png...');
  await page.screenshot({ path: 'artifacts/finance/02-modal-create-expense.png' });
  const cancelExpenseBtn = page.getByRole('button', { name: /إلغاء/ }).first();
  await cancelExpenseBtn.click();
  await page.waitForTimeout(300);

  // 3. Open Cash Movement Modal
  console.log('[E2E Test] Testing Cash Movement Modal...');
  const movementBtn = page.getByRole('button', { name: /إيداع \/ سحب نقد/ }).first();
  await movementBtn.click();
  await page.waitForTimeout(300);
  console.log('[E2E Test] Capturing 03-modal-cash-movement.png...');
  await page.screenshot({ path: 'artifacts/finance/03-modal-cash-movement.png' });
  const cancelMovementBtn = page.getByRole('button', { name: /إلغاء/ }).first();
  await cancelMovementBtn.click();
  await page.waitForTimeout(300);

  // 4. Open Shift Details Modal
  console.log('[E2E Test] Testing Shift Details Breakdown Modal...');
  const detailsBtn = page.getByRole('button', { name: /تفاصيل/ }).first();
  await detailsBtn.click();
  await page.waitForTimeout(400);
  console.log('[E2E Test] Capturing 04-modal-shift-details.png...');
  await page.screenshot({ path: 'artifacts/finance/04-modal-shift-details.png' });
  const closeDetailsBtn = page.getByRole('button', { name: /إغلاق النافذة/ }).first();
  await closeDetailsBtn.click();
  await page.waitForTimeout(300);

  // 5. Tab 2: Expenses
  console.log('[E2E Test] Testing Tab 2: Expenses...');
  const expensesTabBtn = page.getByRole('button', { name: /المصروفات والنثريات/ }).first();
  await expensesTabBtn.click();
  await page.waitForTimeout(300);
  console.log('[E2E Test] Capturing 05-expenses-tab.png...');
  await page.screenshot({ path: 'artifacts/finance/05-expenses-tab.png', fullPage: true });

  // 6. Tab 3: Profitability & COGS
  console.log('[E2E Test] Testing Tab 3: Profitability & COGS...');
  const profitTabBtn = page.getByRole('button', { name: /الأرباح وتكلفة البضاعة المباعة/ }).first();
  await profitTabBtn.click();
  await page.waitForTimeout(300);
  console.log('[E2E Test] Capturing 06-profitability-cogs-tab.png...');
  await page.screenshot({ path: 'artifacts/finance/06-profitability-cogs-tab.png', fullPage: true });

  // 7. Mobile View Verification (390px - iPhone)
  console.log('[E2E Test] Testing Mobile Responsiveness (390px)...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);

  const isOverflowingMobile = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  if (isOverflowingMobile) {
    throw new Error('Horizontal overflow detected on mobile view (390px)!');
  }

  // Mobile Profitability
  console.log('[E2E Test] Capturing 07-mobile-profitability.png...');
  await page.screenshot({ path: 'artifacts/finance/07-mobile-profitability.png', fullPage: true });

  // Switch to Shifts on mobile
  const mobileShiftsTab = page.getByRole('button', { name: /ورديات الكاشير النقدية/ }).first();
  await mobileShiftsTab.click();
  await page.waitForTimeout(300);
  console.log('[E2E Test] Capturing 08-mobile-shifts.png...');
  await page.screenshot({ path: 'artifacts/finance/08-mobile-shifts.png', fullPage: true });

  // Switch to Expenses on mobile
  const mobileExpensesTab = page.getByRole('button', { name: /المصروفات والنثريات/ }).first();
  await mobileExpensesTab.click();
  await page.waitForTimeout(300);
  console.log('[E2E Test] Capturing 09-mobile-expenses.png...');
  await page.screenshot({ path: 'artifacts/finance/09-mobile-expenses.png', fullPage: true });

  // Check for any browser console errors
  if (errors.length > 0) {
    throw new Error(`Browser console errors detected: ${errors.join(', ')}`);
  }

  console.log('[E2E Test] All browser verification checks passed successfully with 0 errors and 0 overflow!');
}

async function cleanup() {
  console.log('[E2E Cleanup] Cleaning up test data...');
  if (browser) await browser.close();
  try {
    if (expense1Id || expense2Id) {
      await prisma.expense.deleteMany({ where: { id: { in: [expense1Id, expense2Id].filter(Boolean) } } });
    }
    if (shiftOpenId || shiftClosedId) {
      await prisma.cashShiftMovement.deleteMany({
        where: { cashShiftId: { in: [shiftOpenId, shiftClosedId].filter(Boolean) } },
      });
      await prisma.cashShift.deleteMany({
        where: { id: { in: [shiftOpenId, shiftClosedId].filter(Boolean) } },
      });
    }
    if (userId) {
      await prisma.userBranch.deleteMany({ where: { userId } });
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
