import { prisma } from '../../../infrastructure/db/prisma';
import { ValidationError, NotFoundError } from '../../../domain/shared/errors/domain-error';
import { deleteCatalogItemSchema, DeleteCatalogItemInput } from '../dto/catalog.dto';

export class DeleteModifierGroupUseCase {
  public async execute(input: DeleteCatalogItemInput) {
    const value = deleteCatalogItemSchema.parse(input);
    const groupId = value.id;

    const group = await prisma.modifierGroup.findUnique({
      where: { id: groupId },
      include: {
        modifiers: {
          select: { id: true },
        },
        products: {
          where: {
            product: { deletedAt: null },
          },
        },
      },
    });

    if (!group) {
      throw new NotFoundError('مجموعة الإضافات', groupId);
    }

    if (group.products.length > 0) {
      throw new ValidationError(
        'لا يمكن حذف هذه المجموعة لارتباطها بأصناف في المنيو. يرجى فك ارتباطها من الأصناف أولاً أو أرشفتها.'
      );
    }

    const modifierIds = group.modifiers.map((m) => m.id);
    if (modifierIds.length > 0) {
      const orderModifierCount = await prisma.orderItemModifier.count({
        where: {
          modifierId: { in: modifierIds },
        },
      });

      if (orderModifierCount > 0) {
        throw new ValidationError(
          'لا يمكن حذف هذه المجموعة لوجود طلبات سابقة مسجلة بهذه الخيارات. لحفظ السجلات المالية، يرجى أرشفة المجموعة بدلاً من حذفها.'
        );
      }
    }

    return prisma.$transaction(async (tx) => {
      // 1. Delete any Recipe items linked to modifiers in this group
      if (modifierIds.length > 0) {
        await tx.recipeItem.deleteMany({
          where: { modifierId: { in: modifierIds } },
        });
      }

      // 2. Modifiers cascade-delete automatically via Prisma relation onDelete: Cascade
      return tx.modifierGroup.delete({
        where: { id: groupId },
      });
    });
  }
}
