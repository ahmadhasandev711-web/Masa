import { describe, expect, it } from 'vitest';
import { categorySchema, modifierGroupSchema, productSchema, toMinorUnits } from '../../src/application/catalog/dto/catalog.dto';

describe('Catalog input validation', () => {
  it('converts decimal price strings to integer minor units without float math', () => {
    expect(toMinorUnits('24')).toBe(2400);
    expect(toMinorUnits('24.5')).toBe(2450);
    expect(toMinorUnits('24.05')).toBe(2405);
  });

  it('rejects prices with more than two decimal places', () => {
    const result = productSchema.safeParse({
      categoryId: 'category-1', nameAr: 'وجبة', nameEn: 'Meal',
      sizes: [{ nameAr: 'عادي', nameEn: 'Regular', price: '12.345' }],
    });
    expect(result.success).toBe(false);
  });

  it('requires category names in both languages', () => {
    expect(categorySchema.safeParse({ nameAr: 'وجبات', nameEn: 'Meals' }).success).toBe(true);
    expect(categorySchema.safeParse({ nameAr: 'و', nameEn: '' }).success).toBe(false);
  });

  it('requires a valid modifier selection range and at least one option', () => {
    const base = { nameAr: 'الصوص', nameEn: 'Sauce', minSelect: 0, maxSelect: 1, modifiers: [{ nameAr: 'حار', nameEn: 'Hot', price: '0' }] };
    expect(modifierGroupSchema.safeParse(base).success).toBe(true);
    expect(modifierGroupSchema.safeParse({ ...base, minSelect: 2 }).success).toBe(false);
    expect(modifierGroupSchema.safeParse({ ...base, modifiers: [] }).success).toBe(false);
  });

  it('accepts and defaults isFeatured in productSchema', () => {
    const parsedDefault = productSchema.safeParse({
      categoryId: 'category-1', nameAr: 'وجبة تجريبية', nameEn: 'Test Meal',
      sizes: [{ nameAr: 'عادي', nameEn: 'Regular', price: '25.00' }],
    });
    expect(parsedDefault.success).toBe(true);
    if (parsedDefault.success) {
      expect(parsedDefault.data.isFeatured).toBe(false);
    }

    const parsedFeatured = productSchema.safeParse({
      categoryId: 'category-1', nameAr: 'وجبة مميزة', nameEn: 'Featured Meal',
      isFeatured: true,
      sizes: [{ nameAr: 'عادي', nameEn: 'Regular', price: '25.00' }],
    });
    expect(parsedFeatured.success).toBe(true);
    if (parsedFeatured.success) {
      expect(parsedFeatured.data.isFeatured).toBe(true);
    }
  });
});
