import { prisma } from '../../../infrastructure/db/prisma';
import { NotFoundError } from '../../../domain/shared/errors/domain-error';

export class GetOrderDetailUseCase {
  public async execute(orderIdOrNumber: string) {
    if (!orderIdOrNumber || !orderIdOrNumber.trim()) {
      throw new NotFoundError('الطلب');
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id: orderIdOrNumber },
          { orderNumber: orderIdOrNumber },
        ],
      },
      include: {
        branch: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            code: true,
            phone: true,
            address: true,
          },
        },
        customer: {
          select: {
            id: true,
            phone: true,
            fullName: true,
            email: true,
            totalOrders: true,
            totalSpent: true,
            lastOrderAt: true,
          },
        },
        items: {
          include: {
            modifiers: true,
          },
        },
        driver: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            vehicleType: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundError('الطلب', orderIdOrNumber);
    }

    return {
      ...order,
      taxRatePercent: Number(order.taxRatePercent),
    };
  }
}
