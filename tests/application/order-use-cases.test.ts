import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../src/infrastructure/db/prisma';
import { PlaceOnlineOrderUseCase } from '../../src/application/ordering/use-cases/place-online-order.use-case';
import { GetOrderTrackerUseCase } from '../../src/application/ordering/use-cases/get-order-tracker.use-case';
import { NotFoundError } from '../../src/domain/shared/errors/domain-error';

describe('Order Use Cases (Integration)', () => {
  const testPhone = '01055556677';
  const expectedE164 = '+201055556677';
  let testProductId: string;
  let testSizeId: string;
  let testUnitPrice: number;
  let createdOrderNumber: string;

  beforeAll(async () => {
    // Ensure restaurant settings exist
    const setting = await prisma.restaurantSetting.findFirst();
    if (!setting) {
      await prisma.restaurantSetting.create({
        data: {
          nameAr: 'ماسا',
          nameEn: 'MASA Kitchen',
          currency: 'EGP',
          currencySymbol: 'ج.م',
          deliveryFee: 2000,
          taxRatePercent: 14,
        },
      });
    }

    // Find or create test category and product
    let product = await prisma.product.findFirst({
      where: { isActive: true },
      include: { sizes: { where: { isActive: true } } },
    });

    if (!product || product.sizes.length === 0) {
      let category = await prisma.category.findFirst();
      if (!category) {
        category = await prisma.category.create({
          data: {
            nameAr: 'برجر ماسا',
            nameEn: 'Masa Burgers',
            sortOrder: 1,
            isActive: true,
          },
        });
      }

      product = await prisma.product.create({
        data: {
          categoryId: category.id,
          nameAr: 'برجر كريسبي تجريبي',
          nameEn: 'Test Crispy Burger',
          description: 'برجر تجريبي لذيذ ومقرمش',
          isActive: true,
          sizes: {
            create: {
              nameAr: 'عادي',
              nameEn: 'Regular',
              price: 9500, // 95.00 EGP
              isActive: true,
            },
          },
        },
        include: { sizes: true },
      });
    }

    if (!product || product.sizes.length === 0) {
      throw new Error('Test product setup failed');
    }

    testProductId = product.id;
    testSizeId = product.sizes[0].id;
    testUnitPrice = product.sizes[0].price;

    // Clean up test customer if already exists
    const existingCust = await prisma.customer.findUnique({
      where: { phone: expectedE164 },
    });
    if (existingCust) {
      await prisma.order.deleteMany({ where: { customerId: existingCust.id } });
      await prisma.customerAddress.deleteMany({ where: { customerId: existingCust.id } });
      await prisma.customer.delete({ where: { id: existingCust.id } });
    }
  });

  afterAll(async () => {
    // Cleanup created orders and customer
    const existingCust = await prisma.customer.findUnique({
      where: { phone: expectedE164 },
    });
    if (existingCust) {
      await prisma.order.deleteMany({ where: { customerId: existingCust.id } });
      await prisma.customerAddress.deleteMany({ where: { customerId: existingCust.id } });
      await prisma.customer.delete({ where: { id: existingCust.id } });
    }
  });

  it('places an online delivery order successfully with CRM customer and address linkage', async () => {
    const placeOrderUseCase = new PlaceOnlineOrderUseCase();

    const order = await placeOrderUseCase.execute({
      customerName: 'أحمد محمود',
      customerPhone: testPhone,
      customerEmail: 'ahmed.m@example.com',
      area: 'المعادي',
      street: 'شارع النصر',
      building: 'عمارة 14',
      floor: '4',
      apartment: '12',
      landmark: 'بجوار محطة المترو',
      deliveryNotes: 'يرجى الاتصال عند الوصول',
      customerNotes: 'بدون شطة إضافية',
      items: [
        {
          productId: testProductId,
          sizeId: testSizeId,
          modifierIds: [],
          quantity: 2,
        },
      ],
    });

    expect(order).toBeDefined();
    expect(order.orderNumber.startsWith('WEB-')).toBe(true);
    expect(order.customerPhone).toBe(expectedE164);
    expect(order.subtotalMinor).toBe(testUnitPrice * 2);
    expect(order.items.length).toBe(1);
    expect(order.items[0].quantity).toBe(2);
    expect(order.items[0].unitPriceMinor).toBe(testUnitPrice);

    createdOrderNumber = order.orderNumber;

    // Verify CRM customer was created and updated
    const customer = await prisma.customer.findUnique({
      where: { phone: expectedE164 },
      include: { addresses: true },
    });

    expect(customer).not.toBeNull();
    expect(customer?.fullName).toBe('أحمد محمود');
    expect(customer?.totalOrders).toBe(1);
    expect(customer?.totalSpent).toBe(order.totalMinor);
    expect(customer?.addresses.length).toBeGreaterThan(0);
    expect(customer?.addresses[0].area).toBe('المعادي');
  });

  it('retrieves order tracking data securely with masked phone number', async () => {
    const trackerUseCase = new GetOrderTrackerUseCase();

    const tracked = await trackerUseCase.execute(createdOrderNumber);

    expect(tracked).toBeDefined();
    expect(tracked.orderNumber).toBe(createdOrderNumber);
    expect(tracked.customerName).toBe('أحمد م.');
    // Ensure phone is masked
    expect(tracked.customerPhoneMasked).toContain('****');
    expect(tracked.customerPhoneMasked).not.toBe(expectedE164);
    expect(tracked.items.length).toBe(1);
    expect(tracked.deliveryAddress).toContain('المعادي');
    expect(tracked.deliveryAddress).toContain('محجوب للخصوصية');
    expect(tracked.deliveryNotes).toBeNull();
    expect(tracked.status).toBe('PENDING');
  });

  it('throws NotFoundError for non-existent order tracking code', async () => {
    const trackerUseCase = new GetOrderTrackerUseCase();

    await expect(trackerUseCase.execute('MASA-INVALID-CODE')).rejects.toThrow(NotFoundError);
  });
});
