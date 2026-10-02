import { PrismaInventoryRepository } from '../../../infrastructure/inventory/prisma-inventory.repository';
import { InventoryMovementDto } from '../../../domain/inventory/contracts/inventory.repository';
import { InventoryMovementType } from '../../../domain/inventory/enums';

export class ListInventoryMovementsUseCase {
  constructor(private readonly repo = new PrismaInventoryRepository()) {}

  public async execute(filter: {
    branchId?: string;
    inventoryItemId?: string;
    type?: InventoryMovementType;
    limit?: number;
  }): Promise<InventoryMovementDto[]> {
    return this.repo.listMovements(filter);
  }
}
