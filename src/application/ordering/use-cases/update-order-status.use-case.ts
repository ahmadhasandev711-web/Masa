import { prisma } from '../../../infrastructure/db/prisma';
import { NotFoundError, ValidationError } from '../../../domain/shared/errors/domain-error';
import { OrderStatus, PaymentMethod, PaymentStatus } from '../../../domain/ordering/enums';
import { OrderStateMachineService } from '../../../domain/ordering/services/order-state-machine.service';
import { InventoryMovementType } from '../../../domain/inventory/enums';
import { OrderInventoryDeductionService } from '../../../infrastructure/inventory/order-inventory-deduction.service';
import { UpdateOrderStatusDto, updateOrderStatusSchema } from '../dto/order.dto';

export class UpdateOrderStatusUseCase {
  public async execute(input: UpdateOrderStatusDto) {
    const validated = updateOrderStatusSchema.parse(input);

    const targetStatus = validated.nextStatus as OrderStatus;
    if (!Object.values(OrderStatus).includes(targetStatus)) {
      throw new ValidationError(`حالة الطلب غير صالحة: ${validated.nextStatus}`);
    }

    const order = await prisma.order.findUnique({
      where: { id: validated.orderId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        branchId: true,
        paymentMethod: true,
        paymentStatus: true,
      },
    });

    if (!order) {
      throw new NotFoundError('الطلب', validated.orderId);
    }

    const currentStatus = order.status as OrderStatus;

    // Strict Domain State Machine Transition Check
    OrderStateMachineService.assertCanTransition({
      currentStatus,
      nextStatus: targetStatus,
      branchId: order.branchId,
      cancelReason: validated.cancelReason,
    });

    const updateData: {
      status: string;
      cancelReason?: string | null;
      paymentStatus?: string;
      kitchenStartedAt?: Date;
    } = {
      status: targetStatus,
    };

    if (targetStatus === OrderStatus.PREPARING) {
      updateData.kitchenStartedAt = new Date();
    }

    if (validated.cancelReason !== undefined) {
      updateData.cancelReason = validated.cancelReason?.trim() || null;
    }

    // Cash On Delivery auto-marking to PAID upon successful delivery
    if (
      targetStatus === OrderStatus.DELIVERED &&
      order.paymentMethod === PaymentMethod.CASH &&
      order.paymentStatus === PaymentStatus.PENDING
    ) {
      updateData.paymentStatus = PaymentStatus.PAID;
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: updateData,
      include: {
        branch: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            code: true,
          },
        },
      },
    });

    // Deduct BOM Recipe inventory for online order (Idempotent: runs once per order)
    if (
      [
        OrderStatus.PREPARING,
        OrderStatus.READY_FOR_PICKUP,
        OrderStatus.OUT_FOR_DELIVERY,
        OrderStatus.DELIVERED,
      ].includes(targetStatus)
    ) {
      await OrderInventoryDeductionService.deductForOrder(
        order.id,
        prisma,
        InventoryMovementType.SALE_ONLINE,
        validated.userId
      );
    }

    return {
      ...updated,
      taxRatePercent: Number(updated.taxRatePercent),
    };
  }
}
