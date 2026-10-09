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
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundError('التصنيف', categoryId);
    }

    if (category._count.products > 0) {
      throw new ValidationError(
        'لا يمكن حذف هذا التصنيف لاحتوائه على أصناف مسجلة. يرجى نقل الأصناف لتصنيف آخر أو حذفها أولاً.'
      );
    }

    return prisma.category.delete({
      where: { id: categoryId },
    });
  }
}
