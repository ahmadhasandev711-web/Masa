import { prisma } from '../../../infrastructure/db/prisma';
import { NotFoundError, ValidationError } from '../../../domain/shared/errors/domain-error';
import { OrderStatus, OrderType, PaymentStatus } from '../../../domain/ordering/enums';
import { OrderStateMachineService } from '../../../domain/ordering/services/order-state-machine.service';
import { BumpKitchenOrderDto, bumpKitchenOrderSchema } from '../dto/kitchen.dto';

export class BumpKitchenOrderUseCase {
  public async execute(input: BumpKitchenOrderDto) {
    const validated = bumpKitchenOrderSchema.parse(input);

    const order = await prisma.order.findUnique({
      where: { id: validated.orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundError('الطلب', validated.orderId);
    }

    if (order.branchId && order.branchId !== validated.branchId) {
      throw new ValidationError('الطلب لا ينتمي إلى هذا الفرع التشغيلي');
    }

    const currentStatus = order.status as OrderStatus;
    const nextStatus =
      order.type === OrderType.DELIVERY
        ? OrderStatus.READY_FOR_PICKUP
        : OrderStatus.COMPLETED;

    OrderStateMachineService.assertCanTransition({
      currentStatus,
      nextStatus,
      branchId: order.branchId,
      orderType: order.type,
    });

    const now = new Date();

    return prisma.$transaction(async (tx) => {
      // Mark all items as prepared if any were remaining
      await tx.orderItem.updateMany({
        where: { orderId: order.id, isPrepared: false },
        data: {
          isPrepared: true,
          preparedAt: now,
        },
      });

      const updated = await tx.order.update({
        where: { id: order.id },
        data: {
          status: nextStatus,
          kitchenCompletedAt: now,
          ...(nextStatus === OrderStatus.COMPLETED && order.paymentStatus !== PaymentStatus.PAID
            ? { paymentStatus: PaymentStatus.PAID }
            : {}),
        },
        include: {
          items: {
            include: {
              modifiers: true,
            },
          },
          table: true,
          branch: true,
        },
      });

      return {
        id: updated.id,
        orderNumber: updated.orderNumber,
        status: updated.status,
        kitchenCompletedAt: updated.kitchenCompletedAt?.toISOString() ?? null,
      };
    });
  }
}
