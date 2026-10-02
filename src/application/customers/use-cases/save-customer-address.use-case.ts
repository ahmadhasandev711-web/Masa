import { prisma } from '../../../infrastructure/db/prisma';
import { NotFoundError } from '../../../domain/shared/errors/domain-error';
import { CustomerAddress } from '../../../domain/customers/entities/customer-address.entity';
import { CustomerAddressDto, customerAddressSchema } from '../dto/customer.dto';

export class SaveCustomerAddressUseCase {
  public async execute(input: CustomerAddressDto) {
    const validated = customerAddressSchema.parse(input);

    const customer = await prisma.customer.findUnique({
      where: { id: validated.customerId },
      include: { addresses: true },
    });

    if (!customer) {
      throw new NotFoundError('العميل غير موجود');
    }

    // If it's the customer's first address, make it default automatically
    const isFirstAddress = customer.addresses.length === 0;
    const shouldBeDefault = validated.isDefault || isFirstAddress;

    if (shouldBeDefault) {
      await prisma.customerAddress.updateMany({
        where: { customerId: validated.customerId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const domainAddress = CustomerAddress.create({
      id: validated.id,
      customerId: validated.customerId,
      title: validated.title,
      city: validated.city,
      area: validated.area,
      street: validated.street,
      building: validated.building,
      floor: validated.floor,
      apartment: validated.apartment,
      landmark: validated.landmark,
      deliveryNotes: validated.deliveryNotes,
      isDefault: shouldBeDefault,
    });

    if (validated.id) {
      return await prisma.customerAddress.update({
        where: { id: validated.id },
        data: {
          title: domainAddress.title,
          city: domainAddress.city,
          area: domainAddress.area,
          street: domainAddress.street,
          building: domainAddress.building,
          floor: domainAddress.floor,
          apartment: domainAddress.apartment,
          landmark: domainAddress.landmark,
          deliveryNotes: domainAddress.deliveryNotes,
          isDefault: domainAddress.isDefault,
        },
      });
    }

    return await prisma.customerAddress.create({
      data: {
        id: domainAddress.id,
        customerId: domainAddress.customerId,
        title: domainAddress.title,
        city: domainAddress.city,
        area: domainAddress.area,
        street: domainAddress.street,
        building: domainAddress.building,
        floor: domainAddress.floor,
        apartment: domainAddress.apartment,
        landmark: domainAddress.landmark,
        deliveryNotes: domainAddress.deliveryNotes,
        isDefault: domainAddress.isDefault,
      },
    });
  }
}
