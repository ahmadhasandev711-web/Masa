import { describe, it, expect } from 'vitest';
import { GetBranchPerformanceUseCase } from '../../src/application/reports/use-cases/get-branch-performance.use-case';

describe('GetBranchPerformanceUseCase', () => {
  const useCase = new GetBranchPerformanceUseCase();

  it('retrieves comparative performance for all active branches', async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const endDate = new Date();

    const result = await useCase.execute({ startDate, endDate });

    expect(result.branches.length).toBeGreaterThanOrEqual(1);
    const mainBranch = result.branches[0];
    expect(mainBranch.branchId).toBeDefined();
    expect(mainBranch.code).toBeDefined();
    expect(mainBranch.nameAr).toBeDefined();
    expect(typeof mainBranch.ordersCount).toBe('number');
    expect(typeof mainBranch.totalRevenueMinor).toBe('number');
  });
});
