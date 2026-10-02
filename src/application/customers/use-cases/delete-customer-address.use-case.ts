import { prisma } from '../../../infrastructure/db/prisma';
import { NotFoundError } from '../../../domain/shared/errors/domain-error';

export class DeleteCustomerAddressUseCase {
  public async execute(addressId: string, customerId: string) {
    const address = await prisma.customerAddress.findFirst({
      where: { id: addressId, customerId },
    });

    if (!address) {
      throw new NotFoundError('العنوان غير موجود');
    }

    await prisma.customerAddress.delete({
      where: { id: addressId },
    });

    // If deleted address was default, promote another address if one exists
    if (address.isDefault) {
      const remaining = await prisma.customerAddress.findFirst({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
      });
      if (remaining) {
        await prisma.customerAddress.update({
          where: { id: remaining.id },
          data: { isDefault: true },
        });
      }
    }
  }
}
