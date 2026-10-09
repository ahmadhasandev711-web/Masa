import { prisma } from '../../../infrastructure/db/prisma';
import { ProductInput, productSchema, toMinorUnits } from '../dto/catalog.dto';

export class SaveProductUseCase {
  public async execute(input: ProductInput) {
    const value = productSchema.parse(input);
    const { sizes, modifierGroupIds, ...fields } = value;
    const productId = value.id;

    const baseData = {
      categoryId: fields.categoryId,
      nameAr: fields.nameAr,
      nameEn: fields.nameEn,
      description: fields.description || null,
      imageUrl: fields.imageUrl || null,
      isFeatured: fields.isFeatured ?? false,
    };

    const modifierGroupCreate = modifierGroupIds.map((groupId, sortOrder) => ({
      groupId,
      sortOrder,
    }));

    const sizesCreate = sizes.map((size, sortOrder) => ({
      nameAr: size.nameAr,
      nameEn: size.nameEn,
      price: toMinorUnits(size.price),
      sortOrder,
    }));

    return prisma.$transaction(async (transaction) => {
      if (productId) {
        return transaction.product.update({
          where: { id: productId },
          data: {
            ...baseData,
            modifierGroups: {
              deleteMany: {},
              create: modifierGroupCreate,
            },
            sizes: {
              deleteMany: {},
              create: sizesCreate,
            },
          },
          include: { sizes: true },
        });
      }

      return transaction.product.create({
        data: {
          ...baseData,
          modifierGroups: {
            create: modifierGroupCreate,
          },
          sizes: {
            create: sizesCreate,
          },
        },
        include: { sizes: true },
      });
    });
  }
}
