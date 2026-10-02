import { createRequire } from 'node:module';
import fs from 'fs';
import path from 'path';
import { prisma } from '../src/infrastructure/db/prisma.ts';
import { JwtService } from '../src/infrastructure/auth/jwt.service.ts';

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  ({ chromium } = require('C:/Users/IT/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
}

const outDir = path.resolve('artifacts/verification');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const BASE_URL = 'http://localhost:3000';

async function run() {
  const cashierUser = await prisma.user.findUniqueOrThrow({ where: { username: 'cashier' } });
  const adminUser = await prisma.user.findUniqueOrThrow({ where: { username: 'admin' } });

  const cashierToken = await JwtService.sign({ userId: cashierUser.id, role: 'CASHIER' });
  const adminToken = await JwtService.sign({ userId: adminUser.id, role: 'SUPER_ADMIN' });

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
  });

  // 1. Cashier session
  console.log('1. Launching Cashier browser context...');
  const cashierContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'ar-EG',
  });
  await cashierContext.addCookies([
    { name: 'resto_session', value: cashierToken, url: BASE_URL, httpOnly: true },
  ]);

  const cashierPage = await cashierContext.newPage();

  console.log('2. Visiting /admin/orders as Cashier...');
  await cashierPage.goto(`${BASE_URL}/admin/orders`, { waitUntil: 'networkidle' });
  await cashierPage.waitForTimeout(1000);

  await cashierPage.screenshot({
    path: path.join(outDir, '01-cashier-locked-branch-orders.png'),
    fullPage: false,
  });

  console.log('3. Visiting /pos as Cashier...');
  await cashierPage.goto(`${BASE_URL}/pos`, { waitUntil: 'networkidle' });
  await cashierPage.waitForTimeout(1000);

  // If shift modal or open shift button exists, click it
  const openShiftTrigger = cashierPage.locator('button:has-text("فتح وردية")').first();
  if (await openShiftTrigger.isVisible()) {
    await openShiftTrigger.click();
    await cashierPage.waitForTimeout(600);
    // Click submit in modal
    const submitShiftBtn = cashierPage.locator('button:has-text("فتح الوردية")').last();
    if (await submitShiftBtn.isVisible()) {
      await submitShiftBtn.click();
      await cashierPage.waitForTimeout(1500);
    }
  }

  // Add 3 products to cart
  const productCards = cashierPage.locator('section button:has-text("من")');
  const count = await productCards.count();
  console.log(`Found ${count} products in POS catalog`);
  if (count > 0) {
    for (let i = 0; i < Math.min(3, count); i++) {
      await productCards.nth(i).click();
      await cashierPage.waitForTimeout(500);
      const addModalBtn = cashierPage.locator('button:has-text("إضافة للسلة")').first();
      if (await addModalBtn.isVisible()) {
        await addModalBtn.click();
        await cashierPage.waitForTimeout(600);
      }
    }
  }

  await cashierPage.screenshot({
    path: path.join(outDir, '02-pos-pinned-checkout.png'),
    fullPage: false,
  });
  console.log('Saved 02-pos-pinned-checkout.png with cart items');

  // 2. Admin session
  console.log('4. Launching Admin browser context...');
  const adminContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'ar-EG',
  });
  await adminContext.addCookies([
    { name: 'resto_session', value: adminToken, url: BASE_URL, httpOnly: true },
  ]);

  const adminPage = await adminContext.newPage();

  console.log('5. Visiting /admin/inventory as Admin to verify active sidebar indicator...');
  await adminPage.goto(`${BASE_URL}/admin/inventory`, { waitUntil: 'networkidle' });
  await adminPage.waitForTimeout(1000);

  await adminPage.screenshot({
    path: path.join(outDir, '03-admin-active-sidebar.png'),
    fullPage: false,
  });
  console.log('Saved 03-admin-active-sidebar.png');

  await browser.close();
  console.log('Verification finished successfully!');
}

run().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
