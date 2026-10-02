import { prisma } from '../../../infrastructure/db/prisma';
import { ConflictError, NotFoundError } from '../../../domain/shared/errors/domain-error';
import { PhoneNumber } from '../../../domain/customers/value-objects/phone-number';
import { UpdateCustomerDto, updateCustomerSchema } from '../dto/customer.dto';

export class UpdateCustomerUseCase {
  public async execute(input: UpdateCustomerDto) {
    const validated = updateCustomerSchema.parse(input);

    const existing = await prisma.customer.findUnique({
      where: { id: validated.id },
    });

    if (!existing) {
      throw new NotFoundError('العميل غير موجود');
    }

    let phoneValue = existing.phone;
    if (validated.phone) {
      const parsedPhone = PhoneNumber.fromString(validated.phone);
      if (parsedPhone.value !== existing.phone) {
        const phoneTaken = await prisma.customer.findUnique({
          where: { phone: parsedPhone.value },
        });
        if (phoneTaken) {
          throw new ConflictError(`رقم الهاتف '${parsedPhone.formatNational()}' مستخدم لعميل آخر`);
        }
        phoneValue = parsedPhone.value;
      }
    }

    return await prisma.customer.update({
      where: { id: validated.id },
      data: {
        fullName: validated.fullName.trim(),
        phone: phoneValue,
        email: validated.email?.trim() || null,
        notes: validated.notes?.trim() || null,
        isActive: validated.isActive !== undefined ? validated.isActive : existing.isActive,
      },
    });
  }
}
