import { PrismaInventoryRepository } from '../../../infrastructure/inventory/prisma-inventory.repository';
import { StockAdjustmentInputDto, StockAdjustmentSchema } from '../dto/inventory.dto';
import { BranchStockItemDto, InventoryMovementDto } from '../../../domain/inventory/contracts/inventory.repository';
import { ValidationError } from '../../../domain/shared/errors/domain-error';

export class GetBranchStockUseCase {
  constructor(private readonly repo = new PrismaInventoryRepository()) {}

  public async execute(branchId: string): Promise<BranchStockItemDto[]> {
    if (!branchId) throw new ValidationError('معرف الفرع مطلوب');
    return this.repo.getBranchStock(branchId);
  }
}

export class AdjustStockUseCase {
  constructor(private readonly repo = new PrismaInventoryRepository()) {}

  public async execute(input: StockAdjustmentInputDto, userId?: string): Promise<InventoryMovementDto> {
    const validated = StockAdjustmentSchema.parse(input);

    return this.repo.adjustStock({
      branchId: validated.branchId,
      inventoryItemId: validated.inventoryItemId,
      type: validated.type,
      quantityDelta: validated.quantityDelta,
      notes: validated.notes,
      createdById: userId,
    });
  }
}
