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

    if (!product) {
      throw new NotFoundError('الصنف', productId);
    }

    if (product._count.orderItems > 0) {
      throw new ValidationError(
        'لا يمكن حذف هذا الصنف نهائياً لوجود طلبات ومعاملات مالية سابقة مرتبطة به. لحفظ السجلات المحاسبية والتقارير، يرجى إيقاف أو أرشفة الصنف بدلاً من حذفه.'
      );
    }

    return prisma.$transaction(async (tx) => {
      // 1. Delete Recipe items linked to this product or its sizes
      await tx.recipeItem.deleteMany({
        where: {
          OR: [
            { productId },
            { productSize: { productId } },
          ],
        },
      });

      // 2. Delete branch availability
      await tx.branchProductAvailability.deleteMany({
        where: { productId },
      });

      // 3. Delete modifier group associations
      await tx.productModifierGroup.deleteMany({
        where: { productId },
      });

      // 4. Delete product sizes
      await tx.productSize.deleteMany({
        where: { productId },
      });

      // 5. Delete the product itself
      return tx.product.delete({
        where: { id: productId },
      });
    });
  }
}
