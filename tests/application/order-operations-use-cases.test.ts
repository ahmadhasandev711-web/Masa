import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../src/infrastructure/db/prisma';
import { AssignOrderBranchUseCase } from '../../src/application/ordering/use-cases/assign-order-branch.use-case';
import { UpdateOrderStatusUseCase } from '../../src/application/ordering/use-cases/update-order-status.use-case';
import { ListOrdersUseCase } from '../../src/application/ordering/use-cases/list-orders.use-case';
import { GetOrderDetailUseCase } from '../../src/application/ordering/use-cases/get-order-detail.use-case';
import { GetOrdersMetricsUseCase } from '../../src/application/ordering/use-cases/get-orders-metrics.use-case';
import { OrderStatus, PaymentMethod, PaymentStatus } from '../../src/domain/ordering/enums';
import { ValidationError } from '../../src/domain/shared/errors/domain-error';

describe('Order Operations Use Cases (Integration)', () => {
  let testBranchId: string;
  let inactiveBranchId: string;
  let testOrderId: string;
  let testOrderNumber: string;

  beforeAll(async () => {
    // 1. Create or ensure active branch
    const branch = await prisma.branch.upsert({
      where: { code: 'OP-TEST-01' },
      update: { isActive: true },
      create: {
        code: 'OP-TEST-01',
        nameAr: 'فرع العمليات التجريبي',
        nameEn: 'Operations Test Branch',
        phone: '01011112222',
        address: 'شارع العمليات',
        isActive: true,
      },
    });
    testBranchId = branch.id;

    // 2. Create inactive branch for testing validation
    const inactiveBranch = await prisma.branch.upsert({
      where: { code: 'OP-INACTIVE-01' },
      update: { isActive: false },
      create: {
        code: 'OP-INACTIVE-01',
        nameAr: 'فرع غير نشط',
        nameEn: 'Inactive Branch',
        phone: '01099998888',
        address: 'عنوان فرع غير نشط',
        isActive: false,
      },
    });
    inactiveBranchId = inactiveBranch.id;

    // 3. Create a test product
    let product = await prisma.product.findFirst({
      where: { isActive: true },
    });
    if (!product) {
      const cat = await prisma.category.create({
        data: { nameAr: 'قسم تجريبي', nameEn: 'Test Cat', sortOrder: 1 },
      });
      product = await prisma.product.create({
        data: {
          categoryId: cat.id,
          nameAr: 'وجبة تجريبية',
          nameEn: 'Test Meal',
          isActive: true,
        },
      });
    }

    // 4. Create an unassigned test order
    testOrderNumber = `ORD-TEST-${Date.now()}`;
    const order = await prisma.order.create({
      data: {
        orderNumber: testOrderNumber,
        source: 'ONLINE',
        type: 'DELIVERY',
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        paymentMethod: PaymentMethod.CASH,
        subtotalMinor: 5000,
        deliveryFeeMinor: 1500,
        taxMinor: 700,
        totalMinor: 7200,
        customerName: 'أحمد محمود',
        customerPhone: '+201012345678',
        deliveryAddress: 'المعادي - شارع 9',
        items: {
          create: {
            productId: product.id,
            productNameAr: 'وجبة تجريبية',
            productNameEn: 'Test Meal',
            unitPriceMinor: 5000,
            quantity: 1,
            totalPriceMinor: 5000,
          },
        },
      },
    });
    testOrderId = order.id;
  });

  afterAll(async () => {
    // Cleanup created test orders & branches
    await prisma.order.deleteMany({
      where: { orderNumber: { startsWith: 'ORD-TEST-' } },
    });
    await prisma.branch.deleteMany({
      where: { code: { in: ['OP-TEST-01', 'OP-INACTIVE-01'] } },
    });
  });

  it('lists orders with filters and pagination via ListOrdersUseCase', async () => {
    const listUseCase = new ListOrdersUseCase();
    const result = await listUseCase.execute({
      status: OrderStatus.PENDING,
      search: testOrderNumber,
      limit: 10,
    });

    expect(result.orders.length).toBeGreaterThanOrEqual(1);
    expect(result.orders[0].orderNumber).toBe(testOrderNumber);
    expect(result.pagination.total).toBeGreaterThanOrEqual(1);
  });

  it('retrieves full order details via GetOrderDetailUseCase', async () => {
    const detailUseCase = new GetOrderDetailUseCase();
    const detail = await detailUseCase.execute(testOrderId);

    expect(detail.id).toBe(testOrderId);
    expect(detail.orderNumber).toBe(testOrderNumber);
    expect(detail.items.length).toBe(1);
    expect(detail.items[0].productNameAr).toBe('وجبة تجريبية');
  });

  it('rejects assigning an inactive branch to an order', async () => {
    const assignUseCase = new AssignOrderBranchUseCase();
    await expect(
      assignUseCase.execute({
        orderId: testOrderId,
        branchId: inactiveBranchId,
      })
    ).rejects.toThrow(ValidationError);
  });

  it('assigns an active branch to a PENDING order successfully', async () => {
    const assignUseCase = new AssignOrderBranchUseCase();
    const updated = await assignUseCase.execute({
      orderId: testOrderId,
      branchId: testBranchId,
    });

    expect(updated.branchId).toBe(testBranchId);
    expect(updated.branch?.nameAr).toBe('فرع العمليات التجريبي');
  });

  it('progresses order status sequentially through the lifecycle', async () => {
    const updateUseCase = new UpdateOrderStatusUseCase();

    // 1. PENDING -> CONFIRMED
    const confirmed = await updateUseCase.execute({
      orderId: testOrderId,
      nextStatus: OrderStatus.CONFIRMED,
    });
    expect(confirmed.status).toBe(OrderStatus.CONFIRMED);

    // 2. CONFIRMED -> PREPARING (Branch is assigned, should succeed)
    const preparing = await updateUseCase.execute({
      orderId: testOrderId,
      nextStatus: OrderStatus.PREPARING,
    });
    expect(preparing.status).toBe(OrderStatus.PREPARING);

    // 3. PREPARING -> READY_FOR_PICKUP
    const ready = await updateUseCase.execute({
      orderId: testOrderId,
      nextStatus: OrderStatus.READY_FOR_PICKUP,
    });
    expect(ready.status).toBe(OrderStatus.READY_FOR_PICKUP);

    // 4. READY_FOR_PICKUP -> OUT_FOR_DELIVERY
    const outForDelivery = await updateUseCase.execute({
      orderId: testOrderId,
      nextStatus: OrderStatus.OUT_FOR_DELIVERY,
    });
    expect(outForDelivery.status).toBe(OrderStatus.OUT_FOR_DELIVERY);

    // 5. OUT_FOR_DELIVERY -> DELIVERED (Cash on Delivery should auto-mark as PAID)
    const delivered = await updateUseCase.execute({
      orderId: testOrderId,
      nextStatus: OrderStatus.DELIVERED,
    });
    expect(delivered.status).toBe(OrderStatus.DELIVERED);

    const freshOrder = await prisma.order.findUniqueOrThrow({
      where: { id: testOrderId },
    });
    expect(freshOrder.paymentStatus).toBe(PaymentStatus.PAID);
  });

  it('prevents transitioning an order after reaching terminal status DELIVERED', async () => {
    const updateUseCase = new UpdateOrderStatusUseCase();
    await expect(
      updateUseCase.execute({
        orderId: testOrderId,
        nextStatus: OrderStatus.PENDING,
      })
    ).rejects.toThrow(ValidationError);
  });

  it('computes correct orders metrics via GetOrdersMetricsUseCase', async () => {
    const metricsUseCase = new GetOrdersMetricsUseCase();
    const metrics = await metricsUseCase.execute();

    expect(typeof metrics.pendingCount).toBe('number');
    expect(typeof metrics.preparingCount).toBe('number');
    expect(typeof metrics.inDeliveryCount).toBe('number');
    expect(typeof metrics.deliveredTodayCount).toBe('number');
    expect(typeof metrics.todaySalesMinor).toBe('number');
    expect(metrics.deliveredTodayCount).toBeGreaterThanOrEqual(1);
  });
});
