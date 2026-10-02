export interface SoldLine {
  productId: string;
  sizeId?: string | null;
  modifierIds?: string[];
  quantity: number;
}

export interface AvailableRecipeItem {
  inventoryItemId: string;
  productId?: string | null;
  productSizeId?: string | null;
  modifierId?: string | null;
  quantity: number;
}

export interface IngredientDeduction {
  inventoryItemId: string;
  quantity: number;
}

/**
 * Domain service to compute inventory ingredient deductions from sold order lines (GR-1.3).
 * Recipes are completely optional: products, sizes, or modifiers without a recipe consume 0.
 */
export class InventoryConsumptionService {
  public static calculateDeductions(
    lines: SoldLine[],
    recipeItems: AvailableRecipeItem[]
  ): IngredientDeduction[] {
    const deductionsMap = new Map<string, number>();

    for (const line of lines) {
      if (line.quantity <= 0) continue;

      // 1. Resolve size-specific recipes first; if none exist, fallback to product-level recipe
      let matchingProductRecipes: AvailableRecipeItem[] = [];
      if (line.sizeId) {
        matchingProductRecipes = recipeItems.filter(
          (r) => r.productSizeId === line.sizeId
        );
      }

      if (matchingProductRecipes.length === 0) {
        matchingProductRecipes = recipeItems.filter(
          (r) => r.productId === line.productId && !r.productSizeId && !r.modifierId
        );
      }

      for (const recipe of matchingProductRecipes) {
        const current = deductionsMap.get(recipe.inventoryItemId) ?? 0;
        const toDeduct = recipe.quantity * line.quantity;
        deductionsMap.set(recipe.inventoryItemId, current + toDeduct);
      }

      // 2. Resolve modifier recipes
      if (line.modifierIds && line.modifierIds.length > 0) {
        for (const modId of line.modifierIds) {
          const matchingModRecipes = recipeItems.filter(
            (r) => r.modifierId === modId
          );
          for (const modRecipe of matchingModRecipes) {
            const current = deductionsMap.get(modRecipe.inventoryItemId) ?? 0;
            const toDeduct = modRecipe.quantity * line.quantity;
            deductionsMap.set(modRecipe.inventoryItemId, current + toDeduct);
          }
        }
      }
    }

    return Array.from(deductionsMap.entries()).map(([inventoryItemId, qty]) => ({
      inventoryItemId,
      quantity: Number(qty.toFixed(3)),
    }));
  }
}
