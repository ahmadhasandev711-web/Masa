import { prisma } from '../../../infrastructure/db/prisma';
import { ValidationError, NotFoundError } from '../../../domain/shared/errors/domain-error';
import { deleteCatalogItemSchema, DeleteCatalogItemInput } from '../dto/catalog.dto';

export class DeleteCategoryUseCase {
  public async execute(input: DeleteCatalogItemInput) {
    const value = deleteCatalogItemSchema.parse(input);
    const categoryId = value.id;

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        products: {
          where: { deletedAt: null },
        },
      },
    });

    if (!category || category.deletedAt) {
      throw new NotFoundError('التصنيف', categoryId);
    }

    if (category.products.length > 0) {
      throw new ValidationError(
        'لا يمكن حذف هذا التصنيف لاحتوائه على أصناف مسجلة. يرجى نقل الأصناف لتصنيف آخر أو حذفها أولاً.'
      );
    }

    // Rule 4.1: Soft delete category
    return prisma.category.update({
      where: { id: categoryId },
      data: {
        isActive: false,
        deletedAt: new Date(),
        deletedById: value.deletedById ?? null,
      },
    });
  }
}
