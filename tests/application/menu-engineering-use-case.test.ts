import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../src/infrastructure/db/prisma';
import { GetMenuEngineeringUseCase } from '../../src/application/reports/use-cases/get-menu-engineering.use-case';

describe('GetMenuEngineeringUseCase', () => {
  const useCase = new GetMenuEngineeringUseCase();
  let testBranchId: string;
  let testProduct: { id: string; nameAr: string; nameEn: string };

  beforeAll(async () => {
    const branch = await prisma.branch.findFirstOrThrow();
    testBranchId = branch.id;

    testProduct = await prisma.product.findFirstOrThrow({
      where: { isActive: true },
      include: { category: true },
    });

    // Create an order containing this product
    await prisma.order.create({
      data: {
        orderNumber: `REP-MENU-${Date.now()}`,
        branchId: testBranchId,
        source: 'POS',
        type: 'DINE_IN',
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        totalMinor: 15000,
        subtotalMinor: 15000,
        items: {
          create: {
            productId: testProduct.id,
            productNameAr: testProduct.nameAr,
            productNameEn: testProduct.nameEn,
            unitPriceMinor: 15000,
            quantity: 2,
            totalPriceMinor: 30000,
          },
        },
      },
    });
  });

  it('calculates menu performance and profitability correctly', async () => {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const result = await useCase.execute({
      branchId: testBranchId,
      startDate,
      endDate,
    });

    expect(result.totalSoldQuantity).toBeGreaterThanOrEqual(2);
    expect(result.totalRevenueMinor).toBeGreaterThan(0);
    expect(result.topSellingItems.length).toBeGreaterThanOrEqual(1);

    const targetItem = result.topSellingItems.find((i) => i.productId === testProduct.id);
    expect(targetItem).toBeDefined();
    expect(targetItem?.quantitySold).toBeGreaterThanOrEqual(2);
    expect(targetItem?.totalRevenueMinor).toBeGreaterThanOrEqual(30000);
  });

  it('categorizes zero-sales products under slowMovingItems', async () => {
    // 10 years in the future
    const futureStart = new Date('2036-01-01');
    const futureEnd = new Date('2036-01-02');

    const result = await useCase.execute({
      branchId: testBranchId,
      startDate: futureStart,
      endDate: futureEnd,
    });

    expect(result.totalSoldQuantity).toBe(0);
    expect(result.topSellingItems.length).toBe(0);
    expect(result.slowMovingItems.length).toBeGreaterThanOrEqual(1);
    expect(result.overallMarginPercent).toBe(0);
  });

  it('calculates gross profit as revenue minus estimated cost', async () => {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const result = await useCase.execute({
      branchId: testBranchId,
      startDate,
      endDate,
    });

    for (const item of result.topSellingItems) {
      expect(item.grossProfitMinor).toBe(item.totalRevenueMinor - item.estimatedCostMinor);
      if (item.totalRevenueMinor > 0) {
        expect(item.marginPercent).toBeGreaterThanOrEqual(0);
      }
    }
  });

  afterAll(async () => {
    await prisma.order.deleteMany({
      where: { branchId: testBranchId },
    });
    await prisma.branch.delete({
      where: { id: testBranchId },
    }).catch(() => {});
  });
});

