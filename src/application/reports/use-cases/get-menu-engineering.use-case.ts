import { prisma } from '../../../infrastructure/db/prisma';

export interface MenuEngineeringFilter {
  branchId?: string;
  startDate: Date;
  endDate: Date;
}

export interface MenuItemPerformance {
  productId: string;
  nameAr: string;
  nameEn: string;
  categoryNameAr: string;
  quantitySold: number;
  totalRevenueMinor: number;
  estimatedCostMinor: number;
  grossProfitMinor: number;
  marginPercent: number;
}

export interface MenuEngineeringResult {
  currency: string;
  totalSoldQuantity: number;
  totalRevenueMinor: number;
  totalCostMinor: number;
  overallMarginPercent: number;
  topSellingItems: MenuItemPerformance[];
  slowMovingItems: MenuItemPerformance[];
}

export class GetMenuEngineeringUseCase {
  public async execute(filter: MenuEngineeringFilter): Promise<MenuEngineeringResult> {
    const setting = await prisma.restaurantSetting.findFirst();
    const currency = setting?.currency || 'EGP';

    // 1. Fetch all active products with their category and recipes
    const allProducts = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: { select: { nameAr: true } },
        recipeItems: {
          include: {
            inventoryItem: { select: { defaultCostMinor: true } },
          },
        },
      },
    });

    // 2. Fetch order items for completed orders in the timeframe
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          createdAt: {
            gte: filter.startDate,
            lte: filter.endDate,
          },
          status: {
            notIn: ['CANCELLED', 'REJECTED', 'PENDING'],
          },
          isTabOpen: false,
          ...(filter.branchId ? { branchId: filter.branchId } : {}),
        },
      },
      select: {
        productId: true,
        quantity: true,
        totalPriceMinor: true,
      },
    });

    // 3. Aggregate sales by productId
    const salesMap = new Map<string, { quantity: number; revenueMinor: number }>();
    for (const item of orderItems) {
      const current = salesMap.get(item.productId) || { quantity: 0, revenueMinor: 0 };
      current.quantity += item.quantity;
      current.revenueMinor += item.totalPriceMinor;
      salesMap.set(item.productId, current);
    }

    // 4. Calculate performance & profitability for each product
    let totalSoldQuantity = 0;
    let totalRevenueMinor = 0;
    let totalCostMinor = 0;

    const itemsPerformance: MenuItemPerformance[] = allProducts.map((product) => {
      const sales = salesMap.get(product.id) || { quantity: 0, revenueMinor: 0 };

      // Calculate unit recipe cost
      let unitRecipeCostMinor = 0;
      for (const recipe of product.recipeItems) {
        const qty = Number(recipe.quantity);
        const itemCost = recipe.inventoryItem.defaultCostMinor;
        unitRecipeCostMinor += Math.round(qty * itemCost);
      }

      const totalItemCostMinor = sales.quantity * unitRecipeCostMinor;
      const grossProfitMinor = sales.revenueMinor - totalItemCostMinor;
      const marginPercent = sales.revenueMinor > 0
        ? Math.round((grossProfitMinor / sales.revenueMinor) * 100)
        : 0;

      totalSoldQuantity += sales.quantity;
      totalRevenueMinor += sales.revenueMinor;
      totalCostMinor += totalItemCostMinor;

      return {
        productId: product.id,
        nameAr: product.nameAr,
        nameEn: product.nameEn,
        categoryNameAr: product.category.nameAr,
        quantitySold: sales.quantity,
        totalRevenueMinor: sales.revenueMinor,
        estimatedCostMinor: totalItemCostMinor,
        grossProfitMinor,
        marginPercent,
      };
    });

    // Sort by revenue desc
    const sorted = [...itemsPerformance].sort((a, b) => b.totalRevenueMinor - a.totalRevenueMinor);

    const topSellingItems = sorted.filter((i) => i.quantitySold > 0);
    const slowMovingItems = sorted.filter((i) => i.quantitySold === 0);

    const overallGrossProfitMinor = totalRevenueMinor - totalCostMinor;
    const overallMarginPercent = totalRevenueMinor > 0
      ? Math.round((overallGrossProfitMinor / totalRevenueMinor) * 100)
      : 0;

    return {
      currency,
      totalSoldQuantity,
      totalRevenueMinor,
      totalCostMinor,
      overallMarginPercent,
      topSellingItems,
      slowMovingItems,
    };
  }
}
