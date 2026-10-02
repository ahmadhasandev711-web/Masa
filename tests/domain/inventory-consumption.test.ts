import { describe, it, expect } from 'vitest';
import {
  InventoryConsumptionService,
  SoldLine,
  AvailableRecipeItem,
} from '../../src/domain/inventory/services/inventory-consumption.service';

describe('InventoryConsumptionService (GR-1.3)', () => {
  const beefId = 'item-beef-1';
  const cheeseId = 'item-cheese-2';
  const sauceId = 'item-sauce-3';

  const sampleRecipes: AvailableRecipeItem[] = [
    // Product 1 general recipe (e.g. Burger)
    {
      inventoryItemId: beefId,
      productId: 'prod-burger',
      productSizeId: null,
      modifierId: null,
      quantity: 150, // 150g beef
    },
    // Product 1 Large Size specific recipe (overrides general recipe)
    {
      inventoryItemId: beefId,
      productId: 'prod-burger',
      productSizeId: 'size-burger-large',
      modifierId: null,
      quantity: 250, // 250g beef for large
    },
    // Modifier recipe (extra cheese)
    {
      inventoryItemId: cheeseId,
      productId: null,
      productSizeId: null,
      modifierId: 'mod-extra-cheese',
      quantity: 50, // 50g cheese
    },
    // Modifier recipe (extra sauce)
    {
      inventoryItemId: sauceId,
      productId: null,
      productSizeId: null,
      modifierId: 'mod-extra-sauce',
      quantity: 20, // 20g sauce
    },
  ];

  it('correctly calculates deductions for general product recipe', () => {
    const lines: SoldLine[] = [
      {
        productId: 'prod-burger',
        sizeId: null,
        modifierIds: [],
        quantity: 2,
      },
    ];

    const deductions = InventoryConsumptionService.calculateDeductions(lines, sampleRecipes);

    expect(deductions).toHaveLength(1);
    expect(deductions[0]).toEqual({
      inventoryItemId: beefId,
      quantity: 300, // 150g * 2
    });
  });

  it('prioritizes size-specific recipe when sizeId is present', () => {
    const lines: SoldLine[] = [
      {
        productId: 'prod-burger',
        sizeId: 'size-burger-large',
        modifierIds: [],
        quantity: 2,
      },
    ];

    const deductions = InventoryConsumptionService.calculateDeductions(lines, sampleRecipes);

    expect(deductions).toHaveLength(1);
    expect(deductions[0]).toEqual({
      inventoryItemId: beefId,
      quantity: 500, // 250g * 2
    });
  });

  it('aggregates modifier recipes along with product recipe', () => {
    const lines: SoldLine[] = [
      {
        productId: 'prod-burger',
        sizeId: null,
        modifierIds: ['mod-extra-cheese', 'mod-extra-sauce'],
        quantity: 3,
      },
    ];

    const deductions = InventoryConsumptionService.calculateDeductions(lines, sampleRecipes);

    expect(deductions).toHaveLength(3);
    const beef = deductions.find((d) => d.inventoryItemId === beefId);
    const cheese = deductions.find((d) => d.inventoryItemId === cheeseId);
    const sauce = deductions.find((d) => d.inventoryItemId === sauceId);

    expect(beef?.quantity).toBe(450); // 150 * 3
    expect(cheese?.quantity).toBe(150); // 50 * 3
    expect(sauce?.quantity).toBe(60); // 20 * 3
  });

  it('returns empty deductions array if product has no recipe (Optional BOM rule)', () => {
    const lines: SoldLine[] = [
      {
        productId: 'prod-drink-without-recipe',
        sizeId: null,
        modifierIds: [],
        quantity: 5,
      },
    ];

    const deductions = InventoryConsumptionService.calculateDeductions(lines, sampleRecipes);

    expect(deductions).toEqual([]);
  });

  it('aggregates quantities when multiple different lines consume the same ingredient', () => {
    const lines: SoldLine[] = [
      {
        productId: 'prod-burger',
        sizeId: null, // consumes 150g beef
        modifierIds: [],
        quantity: 1,
      },
      {
        productId: 'prod-burger',
        sizeId: 'size-burger-large', // consumes 250g beef
        modifierIds: [],
        quantity: 2,
      },
    ];

    const deductions = InventoryConsumptionService.calculateDeductions(lines, sampleRecipes);

    expect(deductions).toHaveLength(1);
    expect(deductions[0].inventoryItemId).toBe(beefId);
    expect(deductions[0].quantity).toBe(650); // 150 + (250 * 2) = 650
  });
});
