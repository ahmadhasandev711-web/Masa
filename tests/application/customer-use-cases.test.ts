import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../../src/infrastructure/db/prisma';
import { CreateCustomerUseCase } from '../../src/application/customers/use-cases/create-customer.use-case';
import { UpdateCustomerUseCase } from '../../src/application/customers/use-cases/update-customer.use-case';
import { SaveCustomerAddressUseCase } from '../../src/application/customers/use-cases/save-customer-address.use-case';
import { MatchOrCreateCustomerUseCase } from '../../src/application/customers/use-cases/match-or-create-customer.use-case';
import { ConflictError } from '../../src/domain/shared/errors/domain-error';

describe('Customer Use Cases (Integration)', () => {
  const testPhone = '01099887766';
  const expectedE164 = '+201099887766';

  beforeEach(async () => {
    // Cleanup any test customer
    const existing = await prisma.customer.findUnique({
      where: { phone: expectedE164 },
    });
    if (existing) {
      await prisma.customer.delete({ where: { id: existing.id } });
    }
  });

  it('creates customer successfully with normalized phone', async () => {
    const useCase = new CreateCustomerUseCase();
    const customer = await useCase.execute({
      fullName: 'طارق فؤاد',
      phone: testPhone,
      email: 'tarek@example.com',
    });

    expect(customer.id).toBeDefined();
    expect(customer.phone).toBe(expectedE164);
    expect(customer.fullName).toBe('طارق فؤاد');
  });

  it('rejects duplicate customer with ConflictError when phone normalizes to same value', async () => {
    const useCase = new CreateCustomerUseCase();
    await useCase.execute({
      fullName: 'طارق فؤاد',
      phone: testPhone,
    });

    // Try creating with alternative formatting (+201099887766)
    await expect(
      useCase.execute({
        fullName: 'طارق آخر',
        phone: expectedE164,
      })
    ).rejects.toThrow(ConflictError);
  });

  it('saves customer address and manages default status properly', async () => {
    const createCustomer = new CreateCustomerUseCase();
    const customer = await createCustomer.execute({
      fullName: 'هدى كامل',
      phone: testPhone,
    });

    const saveAddress = new SaveCustomerAddressUseCase();

    // 1. Add first address (should auto-default)
    const addr1 = await saveAddress.execute({
      customerId: customer.id,
      title: 'المنزل',
      city: 'Cairo',
      area: 'المعادي',
      street: 'شارع النصر',
      isDefault: false,
    });

    expect(addr1.isDefault).toBe(true);

    // 2. Add second address with isDefault: true
    const addr2 = await saveAddress.execute({
      customerId: customer.id,
      title: 'المكتب',
      city: 'Cairo',
      area: 'التجمع الخامس',
      street: 'شارع التسعين',
      isDefault: true,
    });

    expect(addr2.isDefault).toBe(true);

    // Check that addr1 is no longer default
    const refetchedAddr1 = await prisma.customerAddress.findUnique({
      where: { id: addr1.id },
    });
    expect(refetchedAddr1?.isDefault).toBe(false);
  });

  it('matches existing customer and enriches profile in MatchOrCreateCustomerUseCase', async () => {
    const matchOrCreate = new MatchOrCreateCustomerUseCase();

    // First call: creates customer
    const firstResult = await matchOrCreate.execute({
      phone: testPhone,
      fullName: 'عمر',
      address: {
        title: 'البيت',
        city: 'Cairo',
        area: 'الدقي',
        street: 'شارع مصدق',
      },
    });

    expect(firstResult.customer.id).toBeDefined();
    expect(firstResult.customer.fullName).toBe('عمر');
    expect(firstResult.address?.isDefault).toBe(true);

    // Second call: enriches full name and matches existing address
    const secondResult = await matchOrCreate.execute({
      phone: testPhone,
      fullName: 'عمر شريف علي',
      address: {
        title: 'البيت',
        city: 'Cairo',
        area: 'الدقي',
        street: 'شارع مصدق',
      },
    });

    expect(secondResult.customer.id).toBe(firstResult.customer.id);
    expect(secondResult.customer.fullName).toBe('عمر شريف علي');
    expect(secondResult.address?.id).toBe(firstResult.address?.id);
  });

  it('updates customer profile successfully', async () => {
    const createCustomer = new CreateCustomerUseCase();
    const customer = await createCustomer.execute({
      fullName: 'يوسف رضوان',
      phone: testPhone,
    });

    const updateCustomer = new UpdateCustomerUseCase();
    const updated = await updateCustomer.execute({
      id: customer.id,
      fullName: 'يوسف رضوان حسن',
      email: 'youssef@example.com',
      notes: 'ملاحظة محدثة',
    });

    expect(updated.fullName).toBe('يوسف رضوان حسن');
    expect(updated.email).toBe('youssef@example.com');
    expect(updated.notes).toBe('ملاحظة محدثة');
  });
});
