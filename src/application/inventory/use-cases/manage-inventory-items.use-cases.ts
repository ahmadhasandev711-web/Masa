import { PrismaInventoryRepository } from '../../../infrastructure/inventory/prisma-inventory.repository';
import { SaveInventoryItemInput, SaveInventoryItemSchema } from '../dto/inventory.dto';
import { InventoryItemDto } from '../../../domain/inventory/contracts/inventory.repository';
import { Money } from '../../../domain/shared/value-objects/money';
import { InventoryItem } from '../../../domain/inventory/entities/inventory-item.entity';

import { prisma } from '../../../infrastructure/db/prisma';

export class ListInventoryItemsUseCase {
  constructor(private readonly repo = new PrismaInventoryRepository()) {}

  public async execute(activeOnly = false): Promise<InventoryItemDto[]> {
    return this.repo.findInventoryItems(activeOnly);
  }
}

export class SaveInventoryItemUseCase {
  constructor(private readonly repo = new PrismaInventoryRepository()) {}

  public async execute(input: SaveInventoryItemInput): Promise<InventoryItemDto> {
    const validated = SaveInventoryItemSchema.parse(input);
    const setting = await prisma.restaurantSetting.findFirst();
    const currency = setting?.currency ?? 'EGP';
    const defaultCost = Money.fromMajor(validated.defaultCostDecimal, currency);

    // Domain validation
    InventoryItem.create({
      id: validated.id,
      sku: validated.sku,
      nameAr: validated.nameAr,
      nameEn: validated.nameEn,
      unit: validated.unit,
      defaultCost,
      isActive: validated.isActive,
    });

    return this.repo.saveInventoryItem({
      id: validated.id,
      sku: validated.sku,
      nameAr: validated.nameAr,
      nameEn: validated.nameEn,
      unit: validated.unit,
      defaultCostMinor: defaultCost.amount,
      isActive: validated.isActive,
    });
  }
}
