import { describe, it, expect } from 'vitest';
import { InventoryItem } from '../../src/domain/inventory/entities/inventory-item.entity';
import { UnitOfMeasure } from '../../src/domain/inventory/enums';
import { Money } from '../../src/domain/shared/value-objects/money';
import { ValidationError } from '../../src/domain/shared/errors/domain-error';

describe('InventoryItem Entity', () => {
  it('creates a valid inventory item with Money value object', () => {
    const item = InventoryItem.create({
      sku: 'raw-beef-01',
      nameAr: 'لحم بقري مفروم',
      nameEn: 'Ground Beef',
      unit: UnitOfMeasure.KG,
      defaultCost: Money.fromMajor(250, 'EGP'),
      isActive: true,
    });

    expect(item.nameAr).toBe('لحم بقري مفروم');
    expect(item.nameEn).toBe('Ground Beef');
    expect(item.sku).toBe('RAW-BEEF-01');
    expect(item.unit).toBe(UnitOfMeasure.KG);
    expect(item.defaultCost.amount).toBe(25000);
    expect(item.isActive).toBe(true);
  });

  it('rejects short Arabic name', () => {
    expect(() =>
      InventoryItem.create({
        nameAr: 'أ',
        nameEn: 'Beef',
        unit: UnitOfMeasure.KG,
        defaultCost: Money.fromMajor(100, 'EGP'),
      })
    ).toThrow(ValidationError);
  });

  it('rejects short English name', () => {
    expect(() =>
      InventoryItem.create({
        nameAr: 'لحم',
        nameEn: 'B',
        unit: UnitOfMeasure.KG,
        defaultCost: Money.fromMajor(100, 'EGP'),
      })
    ).toThrow(ValidationError);
  });
});
