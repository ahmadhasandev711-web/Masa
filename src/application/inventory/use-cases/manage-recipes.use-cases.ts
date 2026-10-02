import { PrismaInventoryRepository } from '../../../infrastructure/inventory/prisma-inventory.repository';
import { SaveProductRecipesInput, SaveProductRecipesSchema } from '../dto/inventory.dto';
import { RecipeItemDto } from '../../../domain/inventory/contracts/inventory.repository';
import { ValidationError } from '../../../domain/shared/errors/domain-error';

export class GetProductRecipesUseCase {
  constructor(private readonly repo = new PrismaInventoryRepository()) {}

  public async execute(productId: string): Promise<RecipeItemDto[]> {
    if (!productId) throw new ValidationError('معرف الصنف مطلوب');
    return this.repo.getProductRecipes(productId);
  }
}

export class SaveProductRecipesUseCase {
  constructor(private readonly repo = new PrismaInventoryRepository()) {}

  public async execute(input: SaveProductRecipesInput): Promise<void> {
    const validated = SaveProductRecipesSchema.parse(input);
    return this.repo.saveProductRecipes(validated.productId, validated.items);
  }
}
