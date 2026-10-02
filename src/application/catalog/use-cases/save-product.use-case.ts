import { prisma } from '../../../infrastructure/db/prisma';
import { ProductInput, productSchema, toMinorUnits } from '../dto/catalog.dto';

export class SaveProductUseCase {
  public async execute(input: ProductInput) {
    const value = productSchema.parse(input);
    const { sizes, modifierGroupIds, ...fields } = value;
    const productId = value.id;

    return prisma.$transaction(async (transaction) => {
      const data = {
        categoryId: fields.categoryId,
        nameAr: fields.nameAr,
        nameEn: fields.nameEn,
        description: fields.description || null,
        imageUrl: fields.imageUrl || null,
        isFeatured: fields.isFeatured ?? false,
        modifierGroups: {
          deleteMany: {},
          create: modifierGroupIds.map((groupId, sortOrder) => ({ groupId, sortOrder })),
        },
        sizes: {
          deleteMany: {},
          create: sizes.map((size, sortOrder) => ({
            nameAr: size.nameAr,
            nameEn: size.nameEn,
            price: toMinorUnits(size.price),
            sortOrder,
          })),
        },
      };

      return productId
        ? transaction.product.update({ where: { id: productId }, data, include: { sizes: true } })
        : transaction.product.create({ data, include: { sizes: true } });
    });
  }
}
