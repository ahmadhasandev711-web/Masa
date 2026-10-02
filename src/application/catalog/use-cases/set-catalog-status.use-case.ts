import { prisma } from '../../../infrastructure/db/prisma';
import { CatalogResource } from '../../../domain/catalog/enums/catalog-resource.enum';
import { z } from 'zod';

const inputSchema = z.object({ resource: z.nativeEnum(CatalogResource), id: z.string().min(1), isActive: z.boolean() });

export class SetCatalogStatusUseCase {
  public async execute(input: unknown) {
    const value = inputSchema.parse(input);
    if (value.resource === CatalogResource.CATEGORY) {
      return prisma.category.update({ where: { id: value.id }, data: { isActive: value.isActive } });
    }
    if (value.resource === CatalogResource.PRODUCT) {
      return prisma.product.update({ where: { id: value.id }, data: { isActive: value.isActive } });
    }
    return prisma.modifierGroup.update({ where: { id: value.id }, data: { isActive: value.isActive } });
  }
}
