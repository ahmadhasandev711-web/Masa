import { prisma } from '../../../infrastructure/db/prisma';
import { NotFoundError, ValidationError } from '../../../domain/shared/errors/domain-error';
import { DeliveryDriverEntity } from '../../../domain/delivery/entities/driver.entity';
import { SaveDriverDto, saveDriverSchema } from '../dto/delivery.dto';
import { DriverStatus } from '../../../domain/delivery/enums';

export class SaveDriverUseCase {
  public async execute(input: SaveDriverDto) {
    const validated = saveDriverSchema.parse(input);

    const branch = await prisma.branch.findUnique({
      where: { id: validated.branchId },
    });
    if (!branch) {
      throw new NotFoundError('الفرع', validated.branchId);
    }

    // Validate using pure domain entity
    new DeliveryDriverEntity({
      id: validated.id ?? crypto.randomUUID(),
      branchId: validated.branchId,
      fullName: validated.fullName,
      phone: validated.phone,
      vehicleType: validated.vehicleType,
      licensePlate: validated.licensePlate,
      status: validated.status ?? DriverStatus.AVAILABLE,
      isActive: validated.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    if (validated.id) {
      const existing = await prisma.deliveryDriver.findUnique({
        where: { id: validated.id },
      });
      if (!existing || existing.branchId !== validated.branchId) {
        throw new NotFoundError('الطيار', validated.id);
      }

      return prisma.deliveryDriver.update({
        where: { id: validated.id },
        data: {
          fullName: validated.fullName.trim(),
          phone: validated.phone.trim(),
          vehicleType: validated.vehicleType,
          licensePlate: validated.licensePlate?.trim() || null,
          status: validated.status,
          isActive: validated.isActive,
        },
      });
    }

    // Check duplicate phone in the same branch
    const existingWithPhone = await prisma.deliveryDriver.findFirst({
      where: {
        branchId: validated.branchId,
        phone: validated.phone.trim(),
      },
    });
    if (existingWithPhone) {
      throw new ValidationError(`رقم الهاتف مسجل مسبقاً للطيار ${existingWithPhone.fullName} في هذا الفرع`);
    }

    return prisma.deliveryDriver.create({
      data: {
        branchId: validated.branchId,
        fullName: validated.fullName.trim(),
        phone: validated.phone.trim(),
        vehicleType: validated.vehicleType,
        licensePlate: validated.licensePlate?.trim() || null,
        status: validated.status ?? DriverStatus.AVAILABLE,
        isActive: validated.isActive ?? true,
      },
    });
  }
}
