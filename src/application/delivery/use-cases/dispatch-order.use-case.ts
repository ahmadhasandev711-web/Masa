import { prisma } from '../../../infrastructure/db/prisma';
import { NotFoundError, ValidationError } from '../../../domain/shared/errors/domain-error';
import { OrderStatus, OrderType } from '../../../domain/ordering/enums';
import { DriverStatus } from '../../../domain/delivery/enums';
import { DispatchOrderDto, dispatchOrderSchema } from '../dto/delivery.dto';
import { OrderStateMachineService } from '../../../domain/ordering/services/order-state-machine.service';

export class DispatchOrderUseCase {
  public async execute(input: DispatchOrderDto) {
    const validated = dispatchOrderSchema.parse(input);

    const driver = await prisma.deliveryDriver.findUnique({
      where: { id: validated.driverId },
    });

    if (!driver || driver.branchId !== validated.branchId) {
      throw new NotFoundError('الطيار', validated.driverId);
    }

    if (!driver.isActive || driver.status === DriverStatus.INACTIVE) {
      throw new ValidationError(`الطيار ${driver.fullName} غير متاح لاستلام طلبات حالياً`);
    }

    const orders = await prisma.order.findMany({
      where: { id: { in: validated.orderIds } },
    });

    if (orders.length !== validated.orderIds.length) {
      throw new ValidationError('بعض الطلبات المحددة غير موجودة');
    }

    const now = new Date();

    for (const order of orders) {
      if (order.branchId !== validated.branchId) {
        throw new ValidationError(`الطلب ${order.orderNumber} غير تابع لهذا الفرع`);
      }

      if (order.type !== OrderType.DELIVERY) {
        throw new ValidationError(`الطلب ${order.orderNumber} ليس طلب توصيل (دليفري)`);
      }

      // Check state machine validity
      const currentStatus = order.status as OrderStatus;
      if (OrderStateMachineService.isTerminalStatus(currentStatus)) {
        throw new ValidationError(`لا يمكن إسناد الطلب ${order.orderNumber} لأنه في حالة نهائية (${currentStatus})`);
      }

      if (currentStatus === OrderStatus.OUT_FOR_DELIVERY) {
        throw new ValidationError(`الطلب ${order.orderNumber} مسند بالفعل وفي الطريق`);
      }
    }

    // Atomic dispatch transaction
    return prisma.$transaction(async (tx) => {
      // 1. Update all orders
      await tx.order.updateMany({
        where: { id: { in: validated.orderIds } },
        data: {
          status: OrderStatus.OUT_FOR_DELIVERY,
          driverId: driver.id,
          driverName: driver.fullName,
          dispatchedAt: now,
        },
      });

      // 2. Update driver status to ON_DELIVERY
      const updatedDriver = await tx.deliveryDriver.update({
        where: { id: driver.id },
        data: { status: DriverStatus.ON_DELIVERY },
      });

      const updatedOrders = await tx.order.findMany({
        where: { id: { in: validated.orderIds } },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          driverId: true,
          driverName: true,
          dispatchedAt: true,
          totalMinor: true,
          paymentMethod: true,
        },
      });

      return {
        driver: updatedDriver,
        orders: updatedOrders,
        dispatchedCount: updatedOrders.length,
      };
    });
  }
}
