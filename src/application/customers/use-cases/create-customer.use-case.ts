import { prisma } from '../../../infrastructure/db/prisma';
import { ConflictError } from '../../../domain/shared/errors/domain-error';
import { PhoneNumber } from '../../../domain/customers/value-objects/phone-number';
import { Customer } from '../../../domain/customers/entities/customer.entity';
import { CreateCustomerDto, createCustomerSchema } from '../dto/customer.dto';

export class CreateCustomerUseCase {
  public async execute(input: CreateCustomerDto) {
    const validated = createCustomerSchema.parse(input);
    const phone = PhoneNumber.fromString(validated.phone);

    const existing = await prisma.customer.findUnique({
      where: { phone: phone.value },
    });

    if (existing) {
      throw new ConflictError(`العميل برقم الهاتف '${phone.formatNational()}' مسجل مسبقاً`);
    }

    const domainCustomer = Customer.create({
      fullName: validated.fullName,
      phone,
      email: validated.email || null,
      notes: validated.notes || null,
    });

    return await prisma.customer.create({
      data: {
        id: domainCustomer.id,
        phone: domainCustomer.phone.value,
        fullName: domainCustomer.fullName,
        email: domainCustomer.email,
        notes: domainCustomer.notes,
        totalOrders: 0,
        totalSpent: 0,
        isActive: domainCustomer.isActive,
      },
    });
  }
}
