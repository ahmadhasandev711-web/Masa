import { prisma } from '../../../infrastructure/db/prisma';
import { Money } from '../../../domain/shared/value-objects/money';

export interface SalesAnalyticsFilter {
  branchId?: string;
  startDate: Date;
  endDate: Date;
}

export interface ChannelMetrics {
  count: number;
  totalMinor: number;
}

export interface HourlyDistributionItem {
  hour: number;
  label: string;
  count: number;
  totalMinor: number;
}

export interface DailyDistributionItem {
  date: string;
  label: string;
  count: number;
  totalMinor: number;
}

export interface PaymentBreakdownItem {
  method: string;
  count: number;
  totalMinor: number;
}

export interface SalesAnalyticsResult {
  currency: string;
  totalOrders: number;
  totalRevenueMinor: number;
  subtotalMinor: number;
  taxMinor: number;
  discountMinor: number;
  deliveryFeeMinor: number;
  averageOrderValueMinor: number;
  channels: {
    DINE_IN: ChannelMetrics;
    TAKEAWAY: ChannelMetrics;
    DELIVERY: ChannelMetrics;
  };
  hourly: HourlyDistributionItem[];
  daily: DailyDistributionItem[];
  payments: PaymentBreakdownItem[];
}

export class GetSalesAnalyticsUseCase {
  public async execute(filter: SalesAnalyticsFilter): Promise<SalesAnalyticsResult> {
    const setting = await prisma.restaurantSetting.findFirst();
    const currency = setting?.currency || 'EGP';

    const whereClause = {
      createdAt: {
        gte: filter.startDate,
        lte: filter.endDate,
      },
      status: {
        notIn: ['CANCELLED', 'REJECTED', 'PENDING'],
      },
      isTabOpen: false,
      ...(filter.branchId ? { branchId: filter.branchId } : {}),
    };

    // 1. Database-level aggregation (Avoid N+1, GR-5)
    const [aggregates, orders] = await Promise.all([
      prisma.order.aggregate({
        where: whereClause,
        _count: { id: true },
        _sum: {
          totalMinor: true,
          subtotalMinor: true,
          taxMinor: true,
          discountMinor: true,
          deliveryFeeMinor: true,
        },
      }),
      prisma.order.findMany({
        where: whereClause,
        select: {
          createdAt: true,
          type: true,
          paymentMethod: true,
          totalMinor: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const totalOrders = aggregates._count.id;
    const totalRevMoney = Money.fromMinor(aggregates._sum.totalMinor ?? 0, currency);
    const subtotalMoney = Money.fromMinor(aggregates._sum.subtotalMinor ?? 0, currency);
    const taxMoney = Money.fromMinor(aggregates._sum.taxMinor ?? 0, currency);
    const discountMoney = Money.fromMinor(aggregates._sum.discountMinor ?? 0, currency);
    const deliveryFeeMoney = Money.fromMinor(aggregates._sum.deliveryFeeMinor ?? 0, currency);

    const aovMinor = totalOrders > 0
      ? Math.round(totalRevMoney.amount / totalOrders)
      : 0;

    // 2. Channel Breakdown
    const channels = {
      DINE_IN: { count: 0, totalMinor: 0 },
      TAKEAWAY: { count: 0, totalMinor: 0 },
      DELIVERY: { count: 0, totalMinor: 0 },
    };

    // 3. Hourly Breakdown (00:00 - 23:00)
    const hourlyMap = new Map<number, { count: number; totalMinor: number }>();
    for (let h = 0; h < 24; h++) {
      hourlyMap.set(h, { count: 0, totalMinor: 0 });
    }

    // 4. Daily Breakdown
    const dailyMap = new Map<string, { label: string; count: number; totalMinor: number }>();

    // 5. Payment Breakdown
    const paymentMap = new Map<string, { count: number; totalMinor: number }>();

    for (const order of orders) {
      // Channel
      const orderType = order.type as keyof typeof channels;
      if (channels[orderType]) {
        channels[orderType].count += 1;
        channels[orderType].totalMinor += order.totalMinor;
      }

      // Hour
      const hour = new Date(order.createdAt).getHours();
      const currentH = hourlyMap.get(hour) || { count: 0, totalMinor: 0 };
      currentH.count += 1;
      currentH.totalMinor += order.totalMinor;
      hourlyMap.set(hour, currentH);

      // Day
      const dateKey = order.createdAt.toISOString().slice(0, 10);
      const dayLabel = new Date(order.createdAt).toLocaleDateString('ar-EG', { weekday: 'short', month: 'numeric', day: 'numeric' });
      const currentD = dailyMap.get(dateKey) || { label: dayLabel, count: 0, totalMinor: 0 };
      currentD.count += 1;
      currentD.totalMinor += order.totalMinor;
      dailyMap.set(dateKey, currentD);

      // Payment
      const method = order.paymentMethod || 'UNKNOWN';
      const currentP = paymentMap.get(method) || { count: 0, totalMinor: 0 };
      currentP.count += 1;
      currentP.totalMinor += order.totalMinor;
      paymentMap.set(method, currentP);
    }

    const hourly: HourlyDistributionItem[] = Array.from(hourlyMap.entries()).map(([hour, data]) => ({
      hour,
      label: `${String(hour).padStart(2, '0')}:00`,
      count: data.count,
      totalMinor: data.totalMinor,
    }));

    const daily: DailyDistributionItem[] = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      label: data.label,
      count: data.count,
      totalMinor: data.totalMinor,
    }));

    const payments: PaymentBreakdownItem[] = Array.from(paymentMap.entries()).map(([method, data]) => ({
      method,
      count: data.count,
      totalMinor: data.totalMinor,
    }));

    return {
      currency,
      totalOrders,
      totalRevenueMinor: totalRevMoney.amount,
      subtotalMinor: subtotalMoney.amount,
      taxMinor: taxMoney.amount,
      discountMinor: discountMoney.amount,
      deliveryFeeMinor: deliveryFeeMoney.amount,
      averageOrderValueMinor: aovMinor,
      channels,
      hourly,
      daily,
      payments,
    };
  }
}
