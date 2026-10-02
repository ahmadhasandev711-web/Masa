import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import crypto from 'crypto';
import { prisma } from '../../src/infrastructure/db/prisma';
import { OrderStatus, OrderSource, OrderType, PaymentStatus, PaymentMethod } from '../../src/domain/ordering/enums';
import { GetKitchenOrdersUseCase } from '../../src/application/kitchen/use-cases/get-kitchen-orders.use-case';
import { BumpKitchenOrderUseCase } from '../../src/application/kitchen/use-cases/bump-kitchen-order.use-case';
import { ToggleKitchenItemPreparedUseCase } from '../../src/application/kitchen/use-cases/toggle-kitchen-item-prepared.use-case';
import { NotFoundError, ValidationError } from '../../src/domain/shared/errors/domain-error';

describe('Kitchen KDS & KOT Engine Use Cases', () => {
  let branchId: string;
  let otherBranchId: string;
  let categoryId: string;
  let productId: string;
  let sizeId: string;
  const createdOrderIds: string[] = [];

  beforeAll(async () => {
    // 1. Setup primary and secondary branches
    let branch = await prisma.branch.findFirst({ where: { isActive: true } });
    if (!branch) {
      branch = await prisma.branch.create({
        data: {
          code: 'KITCHEN-BR-01',
          nameAr: 'فرع تجارب المطبخ',
          nameEn: 'Kitchen Test Branch',
          phone: '01000000001',
          address: 'شارع المعز',
        },
      });
    }
    branchId = branch.id;

    let otherBranch = await prisma.branch.findFirst({ where: { isActive: true, id: { not: branchId } } });
    if (!otherBranch) {
      otherBranch = await prisma.branch.create({
        data: {
          code: 'KITCHEN-BR-02',
          nameAr: 'فرع المطبخ الثاني',
          nameEn: 'Kitchen Second Branch',
          phone: '01000000002',
          address: 'شارع التحرير',
        },
      });
    }
    otherBranchId = otherBranch.id;

    // 2. Setup Category and Product
    const category = await prisma.category.create({
      data: {
        nameAr: 'أطباق ساخنة للمطبخ',
        nameEn: 'Hot Kitchen Dishes',
      },
    });
    categoryId = category.id;

    const product = await prisma.product.create({
      data: {
        categoryId,
        nameAr: 'برجر ماسا المشوي',
        nameEn: 'MASA Grilled Burger',
        sizes: {
          create: {
            nameAr: 'كبير',
            nameEn: 'Large',
            price: 15000,
          },
        },
      },
      include: { sizes: true },
    });
    productId = product.id;
    sizeId = product.sizes[0].id;
  });

  afterAll(async () => {
    // Cleanup test orders
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
    if (productId) {
      await prisma.productSize.deleteMany({ where: { productId } });
      await prisma.product.deleteMany({ where: { id: productId } });
    }
    if (categoryId) {
      await prisma.category.deleteMany({ where: { id: categoryId } });
    }
  });

  it('retrieves active preparing kitchen orders in FIFO order with items and elapsed time', async () => {
    // 1. Create two preparing orders with staggered kitchenStartedAt
    const order1 = await prisma.order.create({
      data: {
        orderNumber: `KDS-${Date.now()}-1`,
        branchId,
        source: OrderSource.POS,
        type: OrderType.DINE_IN,
        status: OrderStatus.PREPARING,
        paymentStatus: PaymentStatus.PENDING,
        paymentMethod: PaymentMethod.CASH,
        tableName: 'طاولة 5',
        kitchenStartedAt: new Date(Date.now() - 15 * 60 * 1000), // 15 mins ago
        items: {
          create: {
            productId,
            sizeId,
            productNameAr: 'برجر ماسا المشوي',
            productNameEn: 'MASA Grilled Burger',
            sizeNameAr: 'كبير',
            sizeNameEn: 'Large',
            unitPriceMinor: 15000,
            quantity: 2,
            totalPriceMinor: 30000,
            isPrepared: false,
          },
        },
      },
    });
    createdOrderIds.push(order1.id);

    const order2 = await prisma.order.create({
      data: {
        orderNumber: `KDS-${Date.now()}-2`,
        branchId,
        source: OrderSource.ONLINE,
        type: OrderType.DELIVERY,
        status: OrderStatus.PREPARING,
        paymentStatus: PaymentStatus.PENDING,
        paymentMethod: PaymentMethod.CASH,
        customerName: 'أحمد علي',
        customerNotes: 'بدون بصل حار',
        kitchenStartedAt: new Date(Date.now() - 5 * 60 * 1000), // 5 mins ago
        items: {
          create: {
            productId,
            sizeId,
            productNameAr: 'برجر ماسا المشوي',
            productNameEn: 'MASA Grilled Burger',
            sizeNameAr: 'كبير',
            sizeNameEn: 'Large',
            unitPriceMinor: 15000,
            quantity: 1,
            totalPriceMinor: 15000,
            isPrepared: false,
          },
        },
      },
    });
    createdOrderIds.push(order2.id);

    const useCase = new GetKitchenOrdersUseCase();
    const tickets = await useCase.execute({ branchId });

    // Assert tickets returned
    expect(tickets.length).toBeGreaterThanOrEqual(2);

    // Verify FIFO ordering: order1 (15m ago) must precede order2 (5m ago)
    const idx1 = tickets.findIndex((t) => t.id === order1.id);
    const idx2 = tickets.findIndex((t) => t.id === order2.id);
    expect(idx1).toBeGreaterThanOrEqual(0);
    expect(idx2).toBeGreaterThanOrEqual(0);
    expect(idx1).toBeLessThan(idx2);

    const ticket1 = tickets[idx1];
    expect(ticket1.tableName).toBe('طاولة 5');
    expect(ticket1.type).toBe(OrderType.DINE_IN);
    expect(ticket1.elapsedSeconds).toBeGreaterThanOrEqual(14 * 60);
    expect(ticket1.totalItemsCount).toBe(1);
    expect(ticket1.preparedItemsCount).toBe(0);
    expect(ticket1.items[0].productNameAr).toBe('برجر ماسا المشوي');

    const ticket2 = tickets[idx2];
    expect(ticket2.customerName).toBe('أحمد علي');
    expect(ticket2.customerNotes).toBe('بدون بصل حار');
    expect(ticket2.type).toBe(OrderType.DELIVERY);
  });

  it('toggles kitchen item prepared state back and forth', async () => {
    const order = await prisma.order.create({
      data: {
        orderNumber: `KDS-${Date.now()}-ITEM`,
        branchId,
        source: OrderSource.POS,
        type: OrderType.TAKEAWAY,
        status: OrderStatus.PREPARING,
        paymentStatus: PaymentStatus.PAID,
        paymentMethod: PaymentMethod.CASH,
        kitchenStartedAt: new Date(),
        items: {
          create: {
            productId,
            sizeId,
            productNameAr: 'برجر ماسا المشوي',
            productNameEn: 'MASA Grilled Burger',
            unitPriceMinor: 15000,
            quantity: 1,
            totalPriceMinor: 15000,
            isPrepared: false,
          },
        },
      },
      include: { items: true },
    });
    createdOrderIds.push(order.id);
    const orderItemId = order.items[0].id;

    const useCase = new ToggleKitchenItemPreparedUseCase();

    // 1. Mark as prepared
    const res1 = await useCase.execute({
      orderItemId,
      isPrepared: true,
      branchId,
    });
    expect(res1.isPrepared).toBe(true);
    expect(res1.preparedAt).not.toBeNull();

    // 2. Un-mark as prepared
    const res2 = await useCase.execute({
      orderItemId,
      isPrepared: false,
      branchId,
    });
    expect(res2.isPrepared).toBe(false);
    expect(res2.preparedAt).toBeNull();

    // 3. Rejects branch mismatch
    await expect(
      useCase.execute({
        orderItemId,
        isPrepared: true,
        branchId: otherBranchId,
      })
    ).rejects.toThrow(ValidationError);

    // 4. Rejects not found item
    await expect(
      useCase.execute({
        orderItemId: crypto.randomUUID(),
        isPrepared: true,
        branchId,
      })
    ).rejects.toThrow(NotFoundError);
  });

  it('bumps kitchen order to READY_FOR_PICKUP, stamps kitchenCompletedAt, and auto-prepares remaining items', async () => {
    const order = await prisma.order.create({
      data: {
        orderNumber: `KDS-${Date.now()}-BUMP`,
        branchId,
        source: OrderSource.ONLINE,
        type: OrderType.DELIVERY,
        status: OrderStatus.PREPARING,
        paymentStatus: PaymentStatus.PENDING,
        paymentMethod: PaymentMethod.CASH,
        kitchenStartedAt: new Date(Date.now() - 8 * 60 * 1000),
        items: {
          create: [
            {
              productId,
              sizeId,
              productNameAr: 'برجر ماسا المشوي 1',
              productNameEn: 'MASA Grilled Burger 1',
              unitPriceMinor: 15000,
              quantity: 1,
              totalPriceMinor: 15000,
              isPrepared: true, // Already prepared
              preparedAt: new Date(),
            },
            {
              productId,
              sizeId,
              productNameAr: 'برجر ماسا المشوي 2',
              productNameEn: 'MASA Grilled Burger 2',
              unitPriceMinor: 15000,
              quantity: 1,
              totalPriceMinor: 15000,
              isPrepared: false, // Unprepared
            },
          ],
        },
      },
    });
    createdOrderIds.push(order.id);

    const bumpUseCase = new BumpKitchenOrderUseCase();

    // 1. Attempt bump with wrong branch fails
    await expect(
      bumpUseCase.execute({
        orderId: order.id,
        branchId: otherBranchId,
      })
    ).rejects.toThrow(ValidationError);

    // 2. Successful bump
    const bumpResult = await bumpUseCase.execute({
      orderId: order.id,
      branchId,
    });

    expect(bumpResult.status).toBe(OrderStatus.READY_FOR_PICKUP);
    expect(bumpResult.kitchenCompletedAt).not.toBeNull();

    // 3. Verify in database: order status is READY_FOR_PICKUP and all items are marked isPrepared = true
    const updatedOrder = await prisma.order.findUniqueOrThrow({
      where: { id: order.id },
      include: { items: true },
    });
    expect(updatedOrder.status).toBe(OrderStatus.READY_FOR_PICKUP);
    expect(updatedOrder.kitchenCompletedAt).not.toBeNull();
    expect(updatedOrder.items.every((i) => i.isPrepared)).toBe(true);

    // 4. Order is no longer in active PREPARING list
    const getUseCase = new GetKitchenOrdersUseCase();
    const activeTickets = await getUseCase.execute({ branchId });
    expect(activeTickets.some((t) => t.id === order.id)).toBe(false);

    // 5. Attempting to bump again should throw validation error because status is no longer PREPARING
    await expect(
      bumpUseCase.execute({
        orderId: order.id,
        branchId,
      })
    ).rejects.toThrow(ValidationError);
  });
});
