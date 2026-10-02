import { prisma } from '../../../infrastructure/db/prisma';
import { CategoryInput, categorySchema } from '../dto/catalog.dto';

export class SaveCategoryUseCase {
  public async execute(input: CategoryInput) {
    const value = categorySchema.parse(input);
    const data = {
      nameAr: value.nameAr,
      nameEn: value.nameEn,
      description: value.description || null,
    };
    return value.id
      ? prisma.category.update({ where: { id: value.id }, data })
      : prisma.category.create({ data });
  }
}
