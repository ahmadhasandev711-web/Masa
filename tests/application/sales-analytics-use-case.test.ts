import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../src/infrastructure/db/prisma';
import { GetSalesAnalyticsUseCase } from '../../src/application/reports/use-cases/get-sales-analytics.use-case';

describe('GetSalesAnalyticsUseCase', () => {
  const useCase = new GetSalesAnalyticsUseCase();
  let testBranchId: string;

  beforeAll(async () => {
    // 1. Get or create a branch
    const branch = await prisma.branch.findFirstOrThrow();
    testBranchId = branch.id;

    // 2. Create test orders with known amounts
    await prisma.order.create({
      data: {
        orderNumber: `REP-SALE-1-${Date.now()}`,
        branchId: testBranchId,
        source: 'POS',
        type: 'DINE_IN',
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        paymentMethod: 'CASH',
        subtotalMinor: 5000,
        taxMinor: 700,
        discountMinor: 0,
        deliveryFeeMinor: 0,
        totalMinor: 5700,
      },
    });

    await prisma.order.create({
      data: {
        orderNumber: `REP-SALE-2-${Date.now()}`,
        branchId: testBranchId,
        source: 'POS',
        type: 'TAKEAWAY',
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        paymentMethod: 'CARD',
        subtotalMinor: 10000,
        taxMinor: 1400,
        discountMinor: 1000,
        deliveryFeeMinor: 0,
        totalMinor: 10400,
      },
    });

    await prisma.order.create({
      data: {
        orderNumber: `REP-SALE-3-${Date.now()}`,
        branchId: testBranchId,
        source: 'ONLINE',
        type: 'DELIVERY',
        status: 'DELIVERED',
        paymentStatus: 'PAID',
        paymentMethod: 'CASH',
        subtotalMinor: 8000,
        taxMinor: 1120,
        discountMinor: 0,
        deliveryFeeMinor: 1500,
        totalMinor: 10620,
      },
    });
  });

  it('aggregates total sales, orders, and channels correctly', async () => {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const result = await useCase.execute({
      branchId: testBranchId,
      startDate,
      endDate,
    });

    expect(result.totalOrders).toBeGreaterThanOrEqual(3);
    expect(result.totalRevenueMinor).toBeGreaterThan(0);
    expect(result.averageOrderValueMinor).toBeGreaterThan(0);

    expect(result.channels.DINE_IN.count).toBeGreaterThanOrEqual(1);
    expect(result.channels.TAKEAWAY.count).toBeGreaterThanOrEqual(1);
    expect(result.channels.DELIVERY.count).toBeGreaterThanOrEqual(1);

    expect(result.hourly.length).toBe(24);
    expect(result.payments.length).toBeGreaterThanOrEqual(1);
  });

  it('handles empty date range gracefully with zero metrics', async () => {
    // 10 years in the future
    const futureStart = new Date('2036-01-01');
    const futureEnd = new Date('2036-01-02');

    const result = await useCase.execute({
      branchId: testBranchId,
      startDate: futureStart,
      endDate: futureEnd,
    });

    expect(result.totalOrders).toBe(0);
    expect(result.totalRevenueMinor).toBe(0);
    expect(result.averageOrderValueMinor).toBe(0);
    expect(result.channels.DINE_IN.count).toBe(0);
    expect(result.channels.TAKEAWAY.count).toBe(0);
    expect(result.channels.DELIVERY.count).toBe(0);
  });

  it('excludes cancelled orders from sales totals', async () => {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const initialResult = await useCase.execute({
      branchId: testBranchId,
      startDate,
      endDate,
    });

    await prisma.order.create({
      data: {
        orderNumber: `REP-CANCEL-${Date.now()}`,
        branchId: testBranchId,
        source: 'ONLINE',
        type: 'DELIVERY',
        status: 'CANCELLED',
        totalMinor: 99900,
      },
    });

    const resultAfterCancel = await useCase.execute({
      branchId: testBranchId,
      startDate,
      endDate,
    });

    // Cancelled order must not increase total revenue
    expect(resultAfterCancel.totalRevenueMinor).toBe(initialResult.totalRevenueMinor);
    expect(resultAfterCancel.totalOrders).toBe(initialResult.totalOrders);
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

