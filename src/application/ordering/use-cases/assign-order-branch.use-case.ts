import { prisma } from '../../../infrastructure/db/prisma';
import { NotFoundError, ValidationError } from '../../../domain/shared/errors/domain-error';
import { OrderStatus } from '../../../domain/ordering/enums';
import { AssignOrderBranchDto, assignOrderBranchSchema } from '../dto/order.dto';

export class AssignOrderBranchUseCase {
  public async execute(input: AssignOrderBranchDto) {
    const validated = assignOrderBranchSchema.parse(input);

    const [order, branch] = await Promise.all([
      prisma.order.findUnique({
        where: { id: validated.orderId },
        select: { id: true, orderNumber: true, status: true, branchId: true },
      }),
      prisma.branch.findUnique({
        where: { id: validated.branchId },
        select: { id: true, nameAr: true, nameEn: true, isActive: true },
      }),
    ]);

    if (!order) {
      throw new NotFoundError('الطلب', validated.orderId);
    }

    if (!branch) {
      throw new NotFoundError('الفرع', validated.branchId);
    }

    if (!branch.isActive) {
      throw new ValidationError('الفرع المحدد غير نشط حالياً ولا يمكن إسناد طلبات إليه');
    }

    // Branch reassignment is only allowed before kitchen starts preparing
    const assignableStatuses: string[] = [OrderStatus.PENDING, OrderStatus.CONFIRMED];
    if (!assignableStatuses.includes(order.status)) {
      throw new ValidationError(
        `لا يمكن تعديل فرع الطلب في حالته الراهنة (${order.status}). الإسناد متاح فقط للطلبات الجديدة أو المؤكدة.`
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        branchId: branch.id,
      },
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

    return {
      ...updatedOrder,
      taxRatePercent: Number(updatedOrder.taxRatePercent),
    };
  }
}
