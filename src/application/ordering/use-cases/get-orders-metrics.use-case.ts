import { prisma } from '../../../infrastructure/db/prisma';
import { OrderSource, OrderStatus } from '../../../domain/ordering/enums';
import { Prisma } from '@prisma/client';

export class GetOrdersMetricsUseCase {
  public async execute(branchId?: string) {
    const branchFilter: Prisma.OrderWhereInput =
      branchId && branchId !== 'ALL'
        ? branchId === 'UNASSIGNED'
          ? { branchId: null }
          : { branchId }
        : {};

    branchFilter.source = OrderSource.ONLINE;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [pendingCount, preparingCount, inDeliveryCount, deliveredTodayCount, todaySalesAggregate] =
      await Promise.all([
        prisma.order.count({
          where: {
            ...branchFilter,
            status: OrderStatus.PENDING,
          },
        }),
        prisma.order.count({
          where: {
            ...branchFilter,
            status: { in: [OrderStatus.CONFIRMED, OrderStatus.PREPARING] },
          },
        }),
        prisma.order.count({
          where: {
            ...branchFilter,
            status: { in: [OrderStatus.READY_FOR_PICKUP, OrderStatus.OUT_FOR_DELIVERY] },
          },
        }),
        prisma.order.count({
          where: {
            ...branchFilter,
            status: OrderStatus.DELIVERED,
            createdAt: { gte: startOfToday },
          },
        }),
        prisma.order.aggregate({
          where: {
            ...branchFilter,
            status: OrderStatus.DELIVERED,
            createdAt: { gte: startOfToday },
          },
          _sum: {
            totalMinor: true,
          },
        }),
      ]);

    return {
      pendingCount,
      preparingCount,
      inDeliveryCount,
      deliveredTodayCount,
      todaySalesMinor: todaySalesAggregate._sum.totalMinor ?? 0,
    };
  }
}
