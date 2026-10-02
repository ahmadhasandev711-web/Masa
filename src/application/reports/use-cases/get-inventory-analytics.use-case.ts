import { prisma } from '../../../infrastructure/db/prisma';

export interface InventoryAnalyticsFilter {
  branchId?: string;
  startDate: Date;
  endDate: Date;
}

export interface MovementSummaryItem {
  type: string;
  labelAr: string;
  totalCostMinor: number;
  movementCount: number;
}

export interface LowStockAlertItem {
  itemId: string;
  itemNameAr: string;
  unit: string;
  branchNameAr: string;
  currentStock: number;
  minThreshold: number;
}

export interface InventoryAnalyticsResult {
  currency: string;
  totalOperationalConsumptionCostMinor: number;
  totalWasteCostMinor: number;
  movementsSummary: MovementSummaryItem[];
  lowStockAlerts: LowStockAlertItem[];
}

export class GetInventoryAnalyticsUseCase {
  public async execute(filter: InventoryAnalyticsFilter): Promise<InventoryAnalyticsResult> {
    const setting = await prisma.restaurantSetting.findFirst();
    const currency = setting?.currency || 'EGP';

    const whereMovements = {
      createdAt: {
        gte: filter.startDate,
        lte: filter.endDate,
      },
      ...(filter.branchId ? { branchId: filter.branchId } : {}),
    };

    // 1. Fetch movements in the period
    const movements = await prisma.inventoryMovement.findMany({
      where: whereMovements,
      select: {
        type: true,
        quantityDelta: true,
        unitCostMinor: true,
      },
    });

    let totalOperationalConsumptionCostMinor = 0;
    let totalWasteCostMinor = 0;

    const summaryMap = new Map<string, { count: number; totalCostMinor: number }>();

    for (const mov of movements) {
      const qty = Math.abs(Number(mov.quantityDelta));
      const cost = Math.round(qty * mov.unitCostMinor);

      if (mov.type === 'OPERATIONAL_CONSUMPTION') {
        totalOperationalConsumptionCostMinor += cost;
      } else if (mov.type === 'WASTE') {
        totalWasteCostMinor += cost;
      }

      const current = summaryMap.get(mov.type) || { count: 0, totalCostMinor: 0 };
      current.count += 1;
      current.totalCostMinor += cost;
      summaryMap.set(mov.type, current);
    }

    const typeLabels: Record<string, string> = {
      SALE_POS: 'مبيعات الكاشير',
      PURCHASE: 'مشتريات وتوريدات',
      OPERATIONAL_CONSUMPTION: 'صرف تشغيل المطبخ',
      WASTE: 'هدر وتوالف',
      ADJUSTMENT: 'تسويات جردية',
    };

    const movementsSummary: MovementSummaryItem[] = Array.from(summaryMap.entries()).map(([type, data]) => ({
      type,
      labelAr: typeLabels[type] || type,
      totalCostMinor: data.totalCostMinor,
      movementCount: data.count,
    }));

    // 2. Fetch Low Stock Items
    const branchInventories = await prisma.branchInventory.findMany({
      where: {
        ...(filter.branchId ? { branchId: filter.branchId } : {}),
      },
      include: {
        branch: { select: { nameAr: true } },
        inventoryItem: { select: { nameAr: true, unit: true } },
      },
    });

    const lowStockAlerts: LowStockAlertItem[] = branchInventories
      .filter((bi) => Number(bi.quantity) <= Number(bi.minThreshold))
      .map((bi) => ({
        itemId: bi.inventoryItemId,
        itemNameAr: bi.inventoryItem.nameAr,
        unit: bi.inventoryItem.unit,
        branchNameAr: bi.branch.nameAr,
        currentStock: Number(bi.quantity),
        minThreshold: Number(bi.minThreshold),
      }));

    return {
      currency,
      totalOperationalConsumptionCostMinor,
      totalWasteCostMinor,
      movementsSummary,
      lowStockAlerts,
    };
  }
}
