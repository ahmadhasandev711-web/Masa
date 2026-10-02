import { prisma } from '../../../infrastructure/db/prisma';
import { BranchAvailabilityInput, branchAvailabilitySchema } from '../dto/catalog.dto';

export class SetBranchAvailabilityUseCase {
  public async execute(input: BranchAvailabilityInput) {
    const value = branchAvailabilitySchema.parse(input);
    return prisma.branchProductAvailability.upsert({
      where: { branchId_productId: { branchId: value.branchId, productId: value.productId } },
      create: value,
      update: { isAvailable: value.isAvailable },
    });
  }
}
