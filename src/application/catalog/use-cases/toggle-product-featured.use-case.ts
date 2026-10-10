import { prisma } from '../../../infrastructure/db/prisma';
import { NotFoundError } from '../../../domain/shared/errors/domain-error';

export interface ToggleProductFeaturedInput {
  productId: string;
}

export interface ToggleProductFeaturedResult {
  isFeatured: boolean;
}

export class ToggleProductFeaturedUseCase {
  public async execute(input: ToggleProductFeaturedInput): Promise<ToggleProductFeaturedResult> {
    const product = await prisma.product.findUnique({
      where: { id: input.productId },
      select: { id: true, isFeatured: true },
    });

    if (!product) {
      throw new NotFoundError('الصنف غير موجود');
    }

    const updated = await prisma.product.update({
      where: { id: input.productId },
      data: { isFeatured: !product.isFeatured },
      select: { isFeatured: true },
    });

    return { isFeatured: updated.isFeatured };
  }
}
