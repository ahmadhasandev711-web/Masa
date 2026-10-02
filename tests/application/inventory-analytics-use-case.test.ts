import { describe, it, expect } from 'vitest';
import { GetInventoryAnalyticsUseCase } from '../../src/application/reports/use-cases/get-inventory-analytics.use-case';

describe('GetInventoryAnalyticsUseCase', () => {
  const useCase = new GetInventoryAnalyticsUseCase();

  it('retrieves inventory consumption and low stock metrics without throwing', async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const endDate = new Date();

    const result = await useCase.execute({ startDate, endDate });

    expect(typeof result.totalOperationalConsumptionCostMinor).toBe('number');
    expect(typeof result.totalWasteCostMinor).toBe('number');
    expect(Array.isArray(result.movementsSummary)).toBe(true);
    expect(Array.isArray(result.lowStockAlerts)).toBe(true);
  });
});
