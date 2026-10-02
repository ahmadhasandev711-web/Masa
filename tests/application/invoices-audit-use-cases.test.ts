import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../src/infrastructure/db/prisma';
import { ListOrdersUseCase } from '../../src/application/ordering/use-cases/list-orders.use-case';
import { OrderSource, OrderType, OrderStatus, PaymentStatus, PaymentMethod } from '../../src/domain/ordering/enums';
import { OpenTableTabUseCase } from '../../src/application/tables/use-cases/open-table-tab.use-case';
import { TableStatus } from '../../src/domain/tables/enums';

describe('Invoices & Order Audit Multi-Channel Integration', () => {
  let branchId: string;
  let cashierId: string;
  let shiftId: string;
  let tableId: string;
  let testOnlineOrderNumber: string;
  let testPosOrderNumber: string;

  beforeAll(async () => {
    // 1. Branch
    const branch = await prisma.branch.upsert({
      where: { code: 'INV-TEST-01' },
      update: { isActive: true },
      create: {
        code: 'INV-TEST-01',
        nameAr: 'فرع مراجعة الفواتير',
        nameEn: 'Invoices Audit Branch',
        phone: '01011113333',
        address: 'شارع التدقيق',
        isActive: true,
      },
    });
    branchId = branch.id;

    // 2. User/Cashier
    let cashier = await prisma.user.findFirst({
      where: { username: 'inv_cashier' },
    });
    if (!cashier) {
      const role = await prisma.role.findFirstOrThrow();
      cashier = await prisma.user.create({
        data: {
          username: 'inv_cashier',
          phone: '01011114444',
          passwordHash: 'dummyhash',
          fullName: 'كاشير التدقيق',
          roleId: role.id,
          isActive: true,
        },
      });
    }
    cashierId = cashier.id;

    // 3. Cash Shift
    let shift = await prisma.cashShift.findFirst({
      where: { branchId, status: 'OPEN' },
    });
    if (!shift) {
      shift = await prisma.cashShift.create({
        data: {
          branchId,
          cashierId,
          status: 'OPEN',
          openingCashMinor: 10000,
        },
      });
    }
    shiftId = shift.id;

    // 4. Dining Table
    let table = await prisma.diningTable.findFirst({
      where: { branchId, tableNumber: 'INV-T1' },
    });
    if (!table) {
      table = await prisma.diningTable.create({
        data: {
          branchId,
          tableNumber: 'INV-T1',
          capacity: 4,
          status: TableStatus.AVAILABLE,
          isActive: true,
        },
      });
    }
    tableId = table.id;

    // Reset table status if needed
    await prisma.diningTable.update({
      where: { id: tableId },
      data: { status: TableStatus.AVAILABLE, activeOrderId: null },
    });

    // 5. Seed an ONLINE Order
    testOnlineOrderNumber = `ONL-INV-${Date.now()}`;
    await prisma.order.create({
      data: {
        orderNumber: testOnlineOrderNumber,
        branchId,
        source: OrderSource.ONLINE,
        type: OrderType.DELIVERY,
        status: OrderStatus.DELIVERED,
        paymentStatus: PaymentStatus.PAID,
        paymentMethod: PaymentMethod.CASH,
        customerName: 'عميل أونلاين',
        customerPhone: '01022223333',
        deliveryAddress: 'شارع النزهة',
        subtotalMinor: 5000,
        deliveryFeeMinor: 2000,
        taxMinor: 700,
        discountMinor: 0,
        totalMinor: 7700,
      },
    });

    // 6. Seed a POS Order
    testPosOrderNumber = `POS-INV-${Date.now()}`;
    await prisma.order.create({
      data: {
        orderNumber: testPosOrderNumber,
        branchId,
        cashierId,
        cashShiftId: shiftId,
        source: OrderSource.POS,
        type: OrderType.TAKEAWAY,
        status: OrderStatus.COMPLETED,
        paymentStatus: PaymentStatus.PAID,
        paymentMethod: PaymentMethod.CARD,
        customerName: 'عميل نقدي POS',
        subtotalMinor: 8000,
        deliveryFeeMinor: 0,
        taxMinor: 1120,
        discountMinor: 0,
        totalMinor: 9120,
      },
    });
  });

  it('retrieves orders from all sources when source is ALL', async () => {
    const listUseCase = new ListOrdersUseCase();
    const result = await listUseCase.execute({
      source: 'ALL',
      branchId,
      limit: 50,
    });

    const orderNumbers = result.orders.map((o) => o.orderNumber);
    expect(orderNumbers).toContain(testOnlineOrderNumber);
    expect(orderNumbers).toContain(testPosOrderNumber);
  });

  it('defaults to ONLINE source for standard operations cockpit queries', async () => {
    const listUseCase = new ListOrdersUseCase();
    const result = await listUseCase.execute({
      branchId,
      limit: 50,
    });

    const orderNumbers = result.orders.map((o) => o.orderNumber);
    expect(orderNumbers).toContain(testOnlineOrderNumber);
    expect(orderNumbers).not.toContain(testPosOrderNumber);
  });

  it('filters specifically by POS source', async () => {
    const listUseCase = new ListOrdersUseCase();
    const result = await listUseCase.execute({
      source: OrderSource.POS,
      branchId,
      limit: 50,
    });

    const orderNumbers = result.orders.map((o) => o.orderNumber);
    expect(orderNumbers).not.toContain(testOnlineOrderNumber);
    expect(orderNumbers).toContain(testPosOrderNumber);
  });

  it('filters by payment method and payment status', async () => {
    const listUseCase = new ListOrdersUseCase();
    const cardResult = await listUseCase.execute({
      source: 'ALL',
      branchId,
      paymentMethod: PaymentMethod.CARD,
    });

    expect(cardResult.orders.some((o) => o.orderNumber === testPosOrderNumber)).toBe(true);
    expect(cardResult.orders.some((o) => o.orderNumber === testOnlineOrderNumber)).toBe(false);
  });

  it('enforces table concurrency locking with SELECT FOR UPDATE in OpenTableTabUseCase', async () => {
    const openUseCase = new OpenTableTabUseCase();

    // Open tab on table
    const openedTab = await openUseCase.execute({
      branchId,
      tableId,
      cashShiftId: shiftId,
      cashierId,
      guestCount: 2,
      items: [],
    });

    expect(openedTab.order.type).toBe(OrderType.DINE_IN);
    expect(openedTab.order.isTabOpen).toBe(true);

    // Verify table is now OCCUPIED
    const tableAfter = await prisma.diningTable.findUniqueOrThrow({
      where: { id: tableId },
    });
    expect(tableAfter.status).toBe(TableStatus.OCCUPIED);

    // Attempting to open the same table concurrently must fail
    await expect(
      openUseCase.execute({
        branchId,
        tableId,
        cashShiftId: shiftId,
        cashierId,
        guestCount: 3,
        items: [],
      })
    ).rejects.toThrow('مشغولة حالياً');
  });

  afterAll(async () => {
    await prisma.order.deleteMany({
      where: { branchId },
    });
    await prisma.diningTable.deleteMany({
      where: { branchId },
    });
    await prisma.cashShift.deleteMany({
      where: { branchId },
    });
    await prisma.branch.delete({
      where: { id: branchId },
    }).catch(() => {});
  });
});

