import { prisma } from '../../../infrastructure/db/prisma';
import { ValidationError, NotFoundError } from '../../../domain/shared/errors/domain-error';
import { deleteCatalogItemSchema, DeleteCatalogItemInput } from '../dto/catalog.dto';

export class DeleteProductUseCase {
  public async execute(input: DeleteCatalogItemInput) {
    const value = deleteCatalogItemSchema.parse(input);
    const productId = value.id;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        _count: {
          select: { orderItems: true },
        },
      },
    });

    if (!product || product.deletedAt) {
      throw new NotFoundError('الصنف', productId);
    }

    if (product._count.orderItems > 0) {
      throw new ValidationError(
        'لا يمكن حذف هذا الصنف نهائياً لوجود طلبات ومعاملات مالية سابقة مرتبطة به. لحفظ السجلات المحاسبية والتقارير، يرجى إيقاف أو أرشفة الصنف بدلاً من حذفه.'
      );
    }

    // Rule 4.1: Soft delete product, mark deletedAt, and remove active branch availability
    return prisma.$transaction(async (tx) => {
      await tx.productModifierGroup.deleteMany({
        where: { productId },
      });
      await tx.branchProductAvailability.deleteMany({
        where: { productId },
      });

      return tx.product.update({
        where: { id: productId },
        data: {
          isActive: false,
          deletedAt: new Date(),
          deletedById: value.deletedById ?? null,
        },
      });
    });
  }
}
