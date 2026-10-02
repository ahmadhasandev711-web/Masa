import { PrismaInventoryRepository } from '../../../infrastructure/inventory/prisma-inventory.repository';
import { SaveSupplierInput, SaveSupplierSchema } from '../dto/inventory.dto';
import { SupplierDto } from '../../../domain/inventory/contracts/inventory.repository';

export class ListSuppliersUseCase {
  constructor(private readonly repo = new PrismaInventoryRepository()) {}

  public async execute(): Promise<SupplierDto[]> {
    return this.repo.findSuppliers();
  }
}

export class SaveSupplierUseCase {
  constructor(private readonly repo = new PrismaInventoryRepository()) {}

  public async execute(input: SaveSupplierInput): Promise<SupplierDto> {
    const validated = SaveSupplierSchema.parse(input);
    return this.repo.saveSupplier({
      id: validated.id,
      name: validated.name,
      contactName: validated.contactName,
      phone: validated.phone,
      email: validated.email,
      address: validated.address,
      taxNumber: validated.taxNumber,
      isActive: validated.isActive,
    });
  }
}
