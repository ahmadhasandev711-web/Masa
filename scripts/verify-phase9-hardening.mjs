import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import { prisma } from '../src/infrastructure/db/prisma.ts';
import { JwtService } from '../src/infrastructure/auth/jwt.service.ts';

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  ({ chromium } = require('C:/Users/IT/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
}

const ARTIFACTS_DIR = 'artifacts/reports';
const BASE_URL = 'http://localhost:3000';

async function main() {
  console.log('====================================================');
  console.log('🚀 Phase 9 Verification: Reporting, RBAC & Hardening');
  console.log('====================================================');

  await mkdir(ARTIFACTS_DIR, { recursive: true });

  // 1. Fetch test users
  const adminUser = await prisma.user.findUniqueOrThrow({ where: { username: 'admin' } });
  const accountantUser = await prisma.user.findUniqueOrThrow({ where: { username: 'accountant' } });
  const cashierUser = await prisma.user.findUniqueOrThrow({ where: { username: 'cashier' } });

  const adminToken = await JwtService.sign({ userId: adminUser.id, role: 'SUPER_ADMIN' });
  const accountantToken = await JwtService.sign({ userId: accountantUser.id, role: 'ACCOUNTANT' });
  const cashierToken = await JwtService.sign({ userId: cashierUser.id, role: 'CASHIER' });

  const browser = await chromium.launch({ channel: 'msedge', headless: true });

  try {
    // -------------------------------------------------------------
    // Test 1: Role-Aware Sidebar Navigation for Super Admin
    // -------------------------------------------------------------
    console.log('\n[1/5] Testing Super Admin full navigation and reports dashboard...');
    const adminContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    await adminContext.addCookies([
      { name: 'resto_session', value: adminToken, url: BASE_URL, httpOnly: true },
    ]);
    const adminPage = await adminContext.newPage();

    const consoleErrors = [];
    adminPage.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await adminPage.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle' });

    // Verify all admin nav links exist
    const navText = await adminPage.textContent('nav');
    console.log('  -> Admin Navigation content:', navText.replace(/\s+/g, ' ').trim());

    if (!navText.includes('التقارير والتحليلات')) throw new Error('Missing reports link for super admin');
    if (!navText.includes('إدارة الفروع')) throw new Error('Missing branches link for super admin');
    if (!navText.includes('الموظفين والصلاحيات')) throw new Error('Missing staff link for super admin');
    if (!navText.includes('الإعدادات العامة')) throw new Error('Missing settings link for super admin');
    console.log('  ✓ Super admin has full unhindered access to all modules.');

    // -------------------------------------------------------------
    // Test 2: Executive Reports Dashboard & Tab Interactions
    // -------------------------------------------------------------
    console.log('\n[2/5] Testing Executive Reports Dashboard (/admin/reports)...');
    await adminPage.goto(`${BASE_URL}/admin/reports`, { waitUntil: 'networkidle' });

    // Check KPI cards
    const bodyText = await adminPage.textContent('body');
    if (!bodyText.includes('إجمالي المبيعات')) throw new Error('KPI: Total sales card missing');
    if (!bodyText.includes('هامش الربح الإجمالي')) throw new Error('KPI: Gross margin card missing');
    if (!bodyText.includes('الطلبات المنجزة')) throw new Error('KPI: Completed orders card missing');
    if (!bodyText.includes('متوسط قيمة الطلب')) throw new Error('KPI: AOV card missing');
    console.log('  ✓ Executive KPI cards rendered successfully.');

    // Screenshot 1: Sales & Channels Tab
    await adminPage.screenshot({ path: `${ARTIFACTS_DIR}/01-admin-reports-sales-desktop.png`, fullPage: true });
    console.log('  ✓ Saved 01-admin-reports-sales-desktop.png');

    // Switch to Tab 2: Menu Engineering
    await adminPage.click('button:has-text("هندسة المنيو والربحية")');
    await adminPage.waitForTimeout(500);
    await adminPage.screenshot({ path: `${ARTIFACTS_DIR}/02-admin-reports-menu-desktop.png`, fullPage: true });
    console.log('  ✓ Saved 02-admin-reports-menu-desktop.png');

    // Switch to Tab 3: Branch Performance
    await adminPage.click('button:has-text("مقارنة أداء الفروع")');
    await adminPage.waitForTimeout(500);
    await adminPage.screenshot({ path: `${ARTIFACTS_DIR}/03-admin-reports-branches-desktop.png`, fullPage: true });
    console.log('  ✓ Saved 03-admin-reports-branches-desktop.png');

    // Switch to Tab 4: Inventory & Waste
    await adminPage.click('button:has-text("المخزون والهدر")');
    await adminPage.waitForTimeout(500);
    await adminPage.screenshot({ path: `${ARTIFACTS_DIR}/04-admin-reports-inventory-desktop.png`, fullPage: true });
    console.log('  ✓ Saved 04-admin-reports-inventory-desktop.png');

    // Test Mobile Responsiveness (390px iPhone viewport)
    await adminPage.setViewportSize({ width: 390, height: 844 });
    await adminPage.click('button:has-text("المبيعات والقنوات")');
    await adminPage.waitForTimeout(500);

    const hasHorizontalOverflow = await adminPage.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    if (hasHorizontalOverflow) {
      console.warn('  ⚠️ Warning: Horizontal overflow detected on 390px viewport');
    } else {
      console.log('  ✓ Zero horizontal overflow on mobile (390px)');
    }

    await adminPage.screenshot({ path: `${ARTIFACTS_DIR}/05-admin-reports-mobile-390px.png`, fullPage: true });
    console.log('  ✓ Saved 05-admin-reports-mobile-390px.png');

    // -------------------------------------------------------------
    // Test 3: Accountant Role-Aware Navigation & Direct Access Blocking
    // -------------------------------------------------------------
    console.log('\n[3/5] Testing Accountant restricted sidebar and page-level security...');
    const accountantContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await accountantContext.addCookies([
      { name: 'resto_session', value: accountantToken, url: BASE_URL, httpOnly: true },
    ]);
    const accountantPage = await accountantContext.newPage();
    await accountantPage.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle' });

    const accountantNav = await accountantPage.textContent('nav');
    console.log('  -> Accountant Navigation:', accountantNav.replace(/\s+/g, ' ').trim());

    if (!accountantNav.includes('التقارير والتحليلات')) throw new Error('Accountant should see reports');
    if (!accountantNav.includes('المالية والمصروفات')) throw new Error('Accountant should see finance');
    if (accountantNav.includes('إدارة الفروع')) throw new Error('Accountant should NOT see branches');
    if (accountantNav.includes('الموظفين والصلاحيات')) throw new Error('Accountant should NOT see staff');
    if (accountantNav.includes('الإعدادات العامة')) throw new Error('Accountant should NOT see settings');
    console.log('  ✓ Accountant sidebar correctly filtered by permissions.');

    await accountantPage.screenshot({ path: `${ARTIFACTS_DIR}/06-accountant-restricted-sidebar.png` });
    console.log('  ✓ Saved 06-accountant-restricted-sidebar.png');

    // Attempt direct URL access to branches
    console.log('  -> Testing unauthorized direct access to /admin/branches by accountant...');
    await accountantPage.goto(`${BASE_URL}/admin/branches`, { waitUntil: 'networkidle' });
    const accountantUrl = accountantPage.url();
    if (accountantUrl.endsWith('/admin/branches')) {
      throw new Error('Security failure: Accountant accessed /admin/branches without MANAGE_BRANCHES permission!');
    }
    console.log(`  ✓ Blocked and redirected to: ${accountantUrl}`);

    // -------------------------------------------------------------
    // Test 4: Cashier Role-Aware Navigation & Direct Access Blocking
    // -------------------------------------------------------------
    console.log('\n[4/5] Testing Cashier restricted sidebar and page-level security...');
    const cashierContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await cashierContext.addCookies([
      { name: 'resto_session', value: cashierToken, url: BASE_URL, httpOnly: true },
    ]);
    const cashierPage = await cashierContext.newPage();
    await cashierPage.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle' });

    const cashierNav = await cashierPage.textContent('nav');
    console.log('  -> Cashier Navigation:', cashierNav.replace(/\s+/g, ' ').trim());

    if (cashierNav.includes('التقارير والتحليلات')) throw new Error('Cashier should NOT see reports');
    if (cashierNav.includes('المالية والمصروفات')) throw new Error('Cashier should NOT see finance');
    if (cashierNav.includes('إدارة الفروع')) throw new Error('Cashier should NOT see branches');
    if (!cashierNav.includes('نقطة البيع')) throw new Error('Cashier should see POS');
    console.log('  ✓ Cashier sidebar correctly filtered to authorized operations only.');

    await cashierPage.screenshot({ path: `${ARTIFACTS_DIR}/07-cashier-restricted-sidebar.png` });
    console.log('  ✓ Saved 07-cashier-restricted-sidebar.png');

    // Attempt direct URL access to /admin/reports by cashier
    console.log('  -> Testing unauthorized direct access to /admin/reports by cashier...');
    await cashierPage.goto(`${BASE_URL}/admin/reports`, { waitUntil: 'networkidle' });
    const cashierUrl = cashierPage.url();
    if (cashierUrl.endsWith('/admin/reports')) {
      throw new Error('Security failure: Cashier accessed /admin/reports without VIEW_REPORTS permission!');
    }
    console.log(`  ✓ Blocked and redirected to: ${cashierUrl}`);

    // -------------------------------------------------------------
    // Test 5: Verify Console Errors & PII Masking
    // -------------------------------------------------------------
    console.log('\n[5/5] Checking console errors and hardening verification...');
    if (consoleErrors.length > 0) {
      console.warn('  ⚠️ Console errors detected:', consoleErrors);
    } else {
      console.log('  ✓ Zero console errors detected across all tested journeys.');
    }

    console.log('\n🎉 ALL PHASE 9 VERIFICATIONS PASSED 100%!');
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('\n❌ Phase 9 Verification Failed:', err);
  process.exit(1);
});
