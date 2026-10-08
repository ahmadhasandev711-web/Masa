import { prisma } from '../../../infrastructure/db/prisma';
import { NotFoundError, ValidationError } from '../../../domain/shared/errors/domain-error';
import { BranchContextService, BranchScope } from '../../../infrastructure/auth/branch-context.service';
import { ToggleKitchenItemPreparedDto, toggleKitchenItemPreparedSchema } from '../dto/kitchen.dto';

export class ToggleKitchenItemPreparedUseCase {
  public async execute(input: ToggleKitchenItemPreparedDto, scope: BranchScope) {
    const validated = toggleKitchenItemPreparedSchema.parse(input);

    const item = await prisma.orderItem.findUnique({
      where: { id: validated.orderItemId },
      include: {
        order: {
          select: {
            id: true,
            branchId: true,
            status: true,
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundError('صنف الطلب', validated.orderItemId);
    }

    BranchContextService.assertResourceInScope(scope, item.order.branchId);

    if (validated.branchId && item.order.branchId && item.order.branchId !== validated.branchId) {
      throw new ValidationError('الصنف لا ينتمي إلى هذا الفرع التشغيلي');
    }

    const updated = await prisma.orderItem.update({
      where: { id: item.id },
      data: {
        isPrepared: validated.isPrepared,
        preparedAt: validated.isPrepared ? new Date() : null,
      },
    });

    return {
      id: updated.id,
      orderId: updated.orderId,
      isPrepared: updated.isPrepared,
      preparedAt: updated.preparedAt?.toISOString() ?? null,
    };
  }
}
