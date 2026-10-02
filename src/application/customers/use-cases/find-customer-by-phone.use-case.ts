import { prisma } from '../../../infrastructure/db/prisma';
import { PhoneNumber } from '../../../domain/customers/value-objects/phone-number';

export class FindCustomerByPhoneUseCase {
  public async execute(rawPhone: string) {
    const phone = PhoneNumber.fromString(rawPhone);

    return await prisma.customer.findUnique({
      where: { phone: phone.value },
      include: {
        addresses: {
          orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        },
      },
    });
  }
}
