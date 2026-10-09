import { prisma } from '../../../infrastructure/db/prisma';

export interface BranchPerformanceFilter {
  startDate: Date;
  endDate: Date;
}

export interface BranchPerformanceItem {
  branchId: string;
  code: string;
  nameAr: string;
  nameEn: string;
  ordersCount: number;
  totalRevenueMinor: number;
  averageOrderValueMinor: number;
  shiftsCount: number;
  cashVarianceMinor: number;
  expensesTotalMinor: number;
  netRevenueMinor: number;
}

export interface BranchPerformanceResult {
  currency: string;
  branches: BranchPerformanceItem[];
}

export class GetBranchPerformanceUseCase {
  public async execute(filter: BranchPerformanceFilter): Promise<BranchPerformanceResult> {
    const setting = await prisma.restaurantSetting.findFirst();
    const currency = setting?.currency || 'EGP';

    const branches = await prisma.branch.findMany({
      where: { isActive: true },
      select: {
        id: true,
        code: true,
        nameAr: true,
        nameEn: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const results: BranchPerformanceItem[] = await Promise.all(
      branches.map(async (branch) => {
        // Aggregate Orders
        const ordersAgg = await prisma.order.aggregate({
          where: {
            branchId: branch.id,
            createdAt: { gte: filter.startDate, lte: filter.endDate },
            status: { notIn: ['CANCELLED', 'REJECTED', 'PENDING'] },
            isTabOpen: false,
          },
          _count: { id: true },
          _sum: { totalMinor: true },
        });

        // Aggregate Cash Shifts
        const shiftsAgg = await prisma.cashShift.aggregate({
          where: {
            branchId: branch.id,
            openedAt: { gte: filter.startDate, lte: filter.endDate },
          },
          _count: { id: true },
          _sum: { varianceMinor: true },
        });

        // Aggregate Expenses
        const expensesAgg = await prisma.expense.aggregate({
          where: {
            branchId: branch.id,
            createdAt: { gte: filter.startDate, lte: filter.endDate },
          },
          _sum: { amountMinor: true },
        });

        const ordersCount = ordersAgg._count.id;
        const totalRevenueMinor = ordersAgg._sum.totalMinor ?? 0;
        const averageOrderValueMinor = ordersCount > 0 ? Math.round(totalRevenueMinor / ordersCount) : 0;
        const shiftsCount = shiftsAgg._count.id;
        const cashVarianceMinor = shiftsAgg._sum.varianceMinor ?? 0;
        const expensesTotalMinor = expensesAgg._sum.amountMinor ?? 0;
        const netRevenueMinor = totalRevenueMinor - expensesTotalMinor;

        return {
          branchId: branch.id,
          code: branch.code,
          nameAr: branch.nameAr,
          nameEn: branch.nameEn,
          ordersCount,
          totalRevenueMinor,
          averageOrderValueMinor,
          shiftsCount,
          cashVarianceMinor,
          expensesTotalMinor,
          netRevenueMinor,
        };
      })
    );

    return {
      currency,
      branches: results.sort((a, b) => b.totalRevenueMinor - a.totalRevenueMinor),
    };
  }
}
