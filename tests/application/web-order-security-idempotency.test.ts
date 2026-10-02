import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import crypto from 'crypto';
import { prisma } from '../../src/infrastructure/db/prisma';
import { PlaceOnlineOrderUseCase } from '../../src/application/ordering/use-cases/place-online-order.use-case';
import { GetOrderTrackerUseCase } from '../../src/application/ordering/use-cases/get-order-tracker.use-case';
import { GetOrderDetailUseCase } from '../../src/application/ordering/use-cases/get-order-detail.use-case';
import { RateLimiter } from '../../src/infrastructure/security/rate-limiter';
import { LogMasker } from '../../src/infrastructure/logging/log-masker';

describe('Web Order Security, Privacy & Idempotency Suite', () => {
  const testPhone = '01199887766';
  const expectedE164 = '+201199887766';
  let testProductId: string;
  let testSizeId: string;
  const createdOrderIds: string[] = [];

  beforeAll(async () => {
    // Ensure settings
    const setting = await prisma.restaurantSetting.findFirst();
    if (!setting) {
      await prisma.restaurantSetting.create({
        data: {
          nameAr: 'ماسا',
          nameEn: 'MASA',
          currency: 'EGP',
          currencySymbol: 'ج.م',
          deliveryFee: 1500,
          taxRatePercent: 14,
        },
      });
    }

    // Get an active product
    let product = await prisma.product.findFirst({
      where: { isActive: true },
      include: { sizes: { where: { isActive: true } } },
    });

    if (!product || product.sizes.length === 0) {
      const category = await prisma.category.create({
        data: { nameAr: 'وجبات أمنية', nameEn: 'Security Meals', sortOrder: 99 },
      });
      product = await prisma.product.create({
        data: {
          categoryId: category.id,
          nameAr: 'وجبة أمان',
          nameEn: 'Security Meal',
          description: 'وجبة آمنة',
          sizes: {
            create: { nameAr: 'وسط', nameEn: 'Medium', price: 6500 },
          },
        },
        include: { sizes: true },
      });
    }

    testProductId = product.id;
    testSizeId = product.sizes[0].id;
  });

  afterAll(async () => {
    // Clean up created orders and customer
    if (createdOrderIds.length > 0) {
      await prisma.orderItemModifier.deleteMany({
        where: { orderItem: { orderId: { in: createdOrderIds } } },
      });
      await prisma.orderItem.deleteMany({
        where: { orderId: { in: createdOrderIds } },
      });
      await prisma.order.deleteMany({
        where: { id: { in: createdOrderIds } },
      });
    }

    const customer = await prisma.customer.findUnique({
      where: { phone: expectedE164 },
    });
    if (customer) {
      await prisma.customerAddress.deleteMany({ where: { customerId: customer.id } });
      await prisma.customer.delete({ where: { id: customer.id } });
    }
  });

  describe('1. LogMasker Utility Tests', () => {
    it('correctly masks customer names for public consumption', () => {
      expect(LogMasker.maskCustomerName('أحمد محمود إبراهيم')).toBe('أحمد م.');
      expect(LogMasker.maskCustomerName('John Doe')).toBe('John D.');
      expect(LogMasker.maskCustomerName('سارة')).toBe('سارة');
      expect(LogMasker.maskCustomerName('')).toBe('');
      expect(LogMasker.maskCustomerName(null)).toBe('');
    });

    it('correctly masks delivery addresses for public consumption', () => {
      const arabicAddress = 'المعادي، شارع 9، عمارة 12، طابق 4، شقة 8، (علامة: قرب بنك مصر)';
      const maskedArabic = LogMasker.maskPublicAddress(arabicAddress);
      expect(maskedArabic).toBe('المعادي (محجوب للخصوصية)');
      expect(maskedArabic).not.toContain('عمارة 12');
      expect(maskedArabic).not.toContain('شقة 8');

      const englishAddress = 'Downtown, 15 Main St, Building 4, Apt 10';
      const maskedEnglish = LogMasker.maskPublicAddress(englishAddress);
      expect(maskedEnglish).toBe('Downtown (محجوب للخصوصية)');
    });
  });

  describe('2. RateLimiter Tests', () => {
    it('enforces limit threshold and provides correct remaining count', () => {
      const testKey = `test-ip-${Date.now()}`;
      RateLimiter.reset(testKey);

      // 3 allowed calls
      const res1 = RateLimiter.check(testKey, 3, 1000);
      expect(res1.allowed).toBe(true);
      expect(res1.remaining).toBe(2);

      const res2 = RateLimiter.check(testKey, 3, 1000);
      expect(res2.allowed).toBe(true);
      expect(res2.remaining).toBe(1);

      const res3 = RateLimiter.check(testKey, 3, 1000);
      expect(res3.allowed).toBe(true);
      expect(res3.remaining).toBe(0);

      // 4th call should be blocked
      const res4 = RateLimiter.check(testKey, 3, 1000);
      expect(res4.allowed).toBe(false);
      expect(res4.remaining).toBe(0);

      // Reset works
      RateLimiter.reset(testKey);
      const resAfterReset = RateLimiter.check(testKey, 3, 1000);
      expect(resAfterReset.allowed).toBe(true);
    });
  });

  describe('3. Web Order Idempotency & High Entropy', () => {
    it('returns the same order without creating duplicate on repeated submissions with same idempotencyKey', async () => {
      const placeUseCase = new PlaceOnlineOrderUseCase();
      const idempotencyKey = crypto.randomUUID();

      const orderPayload = {
        customerName: 'طارق عبد العزيز',
        customerPhone: testPhone,
        area: 'الزمالك',
        street: 'شارع حسن صبري',
        building: 'عمارة 20',
        floor: 'الدور 5',
        apartment: 'شقة 15',
        landmark: 'بجوار النادي',
        deliveryNotes: 'برجاء الاتصال قبل الوصول بدقيقتين - كود البوابة 1234',
        idempotencyKey,
        items: [
          {
            productId: testProductId,
            sizeId: testSizeId,
            modifierIds: [],
            quantity: 1,
          },
        ],
      };

      // First submission
      const order1 = await placeUseCase.execute(orderPayload);
      expect(order1).toBeDefined();
      expect(order1.id).toBeDefined();
      expect(order1.orderNumber).toMatch(/^WEB-\d{8}-\d{3}$/);
      createdOrderIds.push(order1.id);

      // Customer stats after 1st order
      const customerAfterFirst = await prisma.customer.findUnique({
        where: { phone: expectedE164 },
      });
      expect(customerAfterFirst?.totalOrders).toBe(1);

      // Second submission with identical idempotencyKey (simulating double-click or network retry)
      const order2 = await placeUseCase.execute(orderPayload);
      expect(order2).toBeDefined();
      expect(order2.id).toBe(order1.id);
      expect(order2.orderNumber).toBe(order1.orderNumber);

      // Ensure customer stats were NOT incremented again
      const customerAfterSecond = await prisma.customer.findUnique({
        where: { phone: expectedE164 },
      });
      expect(customerAfterSecond?.totalOrders).toBe(1);

      // Verify only ONE order exists in database for this key
      const ordersInDb = await prisma.order.findMany({
        where: { onlineIdempotencyKey: idempotencyKey },
      });
      expect(ordersInDb.length).toBe(1);
    });
  });

  describe('4. Staff Detail vs Public Tracker Privacy Segregation', () => {
    it('provides 100% full unmasked data to staff and masked safe data to public guests', async () => {
      const placeUseCase = new PlaceOnlineOrderUseCase();
      const trackerUseCase = new GetOrderTrackerUseCase();
      const staffDetailUseCase = new GetOrderDetailUseCase();

      const order = await placeUseCase.execute({
        customerName: 'محمود عصام رضوان',
        customerPhone: testPhone,
        area: 'المعادي',
        street: 'شارع 250',
        building: 'عمارة 7',
        floor: 'الدور 3',
        apartment: 'شقة 9',
        landmark: 'أمام المحطة',
        deliveryNotes: 'الرجاء عدم رن الجرس لأن الطفل نائم',
        idempotencyKey: crypto.randomUUID(),
        items: [
          {
            productId: testProductId,
            sizeId: testSizeId,
            modifierIds: [],
            quantity: 1,
          },
        ],
      });
      createdOrderIds.push(order.id);

      // 1. Staff View (GetOrderDetailUseCase) -> 100% RAW & UNMASKED
      const staffData = await staffDetailUseCase.execute(order.id);
      expect(staffData.customerName).toBe('محمود عصام رضوان');
      expect(staffData.customerPhone).toBe(expectedE164);
      expect(staffData.deliveryAddress).toContain('عمارة 7');
      expect(staffData.deliveryAddress).toContain('شقة 9');
      expect(staffData.deliveryNotes).toBe('الرجاء عدم رن الجرس لأن الطفل نائم');

      // 2. Public Guest Tracker (GetOrderTrackerUseCase) -> STRICTLY MASKED
      const publicData = await trackerUseCase.execute(order.orderNumber);
      expect(publicData.customerName).toBe('محمود ع.');
      expect(publicData.customerPhoneMasked).toContain('****');
      expect(publicData.customerPhoneMasked).not.toBe(expectedE164);
      expect(publicData.deliveryAddress).toBe('المعادي (محجوب للخصوصية)');
      expect(publicData.deliveryAddress).not.toContain('عمارة 7');
      expect(publicData.deliveryAddress).not.toContain('شقة 9');
      // Delivery notes must NOT leak into the public tracker
      expect(publicData.deliveryNotes).toBeNull();
    });
  });
});
