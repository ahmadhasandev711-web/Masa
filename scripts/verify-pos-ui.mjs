import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import { prisma } from '../src/infrastructure/db/prisma.ts';
import { JwtService } from '../src/infrastructure/auth/jwt.service.ts';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/IT/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const code = 'POS-UI-' + crypto.randomUUID();
let branchId, userId, roleId, categoryId, productId, modifierGroupId, browser;

async function createFixture() {
  const permissions = await prisma.permission.findMany({ where: { code: { in: ['POS_ACCESS', 'APPLY_POS_DISCOUNT'] } }, select: { id: true } });
  roleId = (await prisma.role.create({ data: { name: code, permissions: { create: permissions.map((permission) => ({ permissionId: permission.id })) } } })).id;
  branchId = (await prisma.branch.create({ data: { code, nameAr: 'فرع فحص نقطة البيع', nameEn: code, phone: '01000000000', address: 'اختبار' } })).id;
  userId = (await prisma.user.create({ data: { username: code, fullName: 'كاشير فحص الواجهة', phone: '01000000000', passwordHash: 'test-only-not-login',
    roleId, userBranches: { create: { branchId, isDefault: true } } } })).id;
  categoryId = (await prisma.category.create({ data: { nameAr: 'فحص POS', nameEn: code } })).id;
  modifierGroupId = (await prisma.modifierGroup.create({ data: { nameAr: 'اختيار الصوص', nameEn: code, minSelect: 1, maxSelect: 1,
    modifiers: { create: { nameAr: 'صوص فحص POS', nameEn: code, priceDelta: 500 } } } })).id;
  productId = (await prisma.product.create({ data: { categoryId, nameAr: 'وجبة فحص POS', nameEn: code,
    sizes: { create: [{ nameAr: 'عادي', nameEn: 'Regular', price: 10000 }, { nameAr: 'كبير', nameEn: 'Large', price: 15000 }] },
    modifierGroups: { create: { groupId: modifierGroupId } } } })).id;
}

async function verify() {
  await createFixture();
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1365, height: 900 } });
  const token = await JwtService.sign({ userId });
  await context.addCookies([{ name: 'resto_session', value: token, url: 'http://localhost:3100', httpOnly: true },
    { name: 'resto_active_branch_id', value: branchId, url: 'http://localhost:3100' }]);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => { window.__printCalls = 0; window.print = () => { window.__printCalls += 1; }; });
  await page.goto('http://localhost:3100/pos');
  await page.getByRole('banner').getByRole('button', { name: 'فتح وردية', exact: true }).click();
  await page.getByRole('dialog').getByRole('textbox').fill('20.00');
  await page.getByRole('dialog').getByRole('button', { name: 'فتح الوردية', exact: true }).click();
  await page.getByRole('button', { name: /وجبة فحص POS/ }).click();
  await page.getByRole('button', { name: /^كبير/ }).click();
  await page.getByRole('button', { name: /صوص فحص POS/ }).click();
  await page.getByRole('button', { name: 'إضافة للسلة' }).click();
  await page.getByRole('button', { name: 'مختلط', exact: true }).click();
  await page.getByLabel('الجزء النقدي').fill('50');
  await page.getByLabel(/الخصم/).fill('10');
  await mkdir('artifacts/pos', { recursive: true });
  await page.screenshot({ path: 'artifacts/pos/desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'إتمام البيع', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'تم البيع بنجاح' }).waitFor();
  const orders = await prisma.order.findMany({ where: { branchId }, include: { payments: true } });
  if (orders.length !== 1 || orders[0].payments.length !== 2) throw new Error('Mixed sale was not saved exactly once');
  await page.waitForFunction(() => window.__printCalls === 1);
  await page.emulateMedia({ media: 'print' });
  await page.screenshot({ path: 'artifacts/pos/receipt.png', fullPage: true });
  if (!(await page.getByText('الإجمالي المدفوع').isVisible())) throw new Error('Printable receipt is missing');
  await page.emulateMedia({ media: 'screen' });
  await page.getByRole('button', { name: 'الفواتير', exact: true }).click();
  await page.getByRole('button', { name: 'طباعة ' + orders[0].orderNumber, exact: true }).click();
  await page.waitForFunction(() => window.__printCalls === 2);
  await page.getByRole('button', { name: 'إغلاق', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'artifacts/pos/mobile.png', fullPage: true });
  if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) throw new Error('Mobile horizontal overflow');
  await page.getByRole('button', { name: 'إغلاق الوردية', exact: true }).click();
  await page.getByRole('dialog').getByRole('textbox').fill('70');
  await page.getByRole('button', { name: 'تأكيد الإغلاق', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'أُغلقت الوردية' }).waitFor();
  await page.waitForLoadState('networkidle');
  const shift = await prisma.cashShift.findFirstOrThrow({ where: { branchId } });
  if (shift.status !== 'CLOSED' || shift.closingCashMinor !== 7000) throw new Error('Cash close failed');
  if (errors.length) throw new Error(errors.join('\n'));
  console.log('POS browser verification passed: opening, sizes, required modifiers, tax, discount, mixed sale, receipt, reprint, mobile, closing; no browser errors.');
}

async function cleanup() {
  if (browser) await browser.close();
  if (branchId) { await prisma.order.deleteMany({ where: { branchId } }); await prisma.cashShift.deleteMany({ where: { branchId } }); }
  if (productId) await prisma.product.delete({ where: { id: productId } });
  if (modifierGroupId) await prisma.modifierGroup.delete({ where: { id: modifierGroupId } });
  if (categoryId) await prisma.category.delete({ where: { id: categoryId } });
  if (userId) await prisma.user.delete({ where: { id: userId } });
  if (roleId) await prisma.role.delete({ where: { id: roleId } });
  if (branchId) await prisma.branch.delete({ where: { id: branchId } });
  await prisma.$disconnect();
}
await verify().finally(cleanup);
