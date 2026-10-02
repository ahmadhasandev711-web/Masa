import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../src/infrastructure/db/prisma';
import { SaveDriverUseCase } from '../../src/application/delivery/use-cases/save-driver.use-case';
import { ListBranchDriversUseCase } from '../../src/application/delivery/use-cases/list-branch-drivers.use-case';
import { DispatchOrderUseCase } from '../../src/application/delivery/use-cases/dispatch-order.use-case';
import { GetDriverPendingSettlementUseCase } from '../../src/application/delivery/use-cases/get-driver-pending-settlement.use-case';
import { SettleDriverCashUseCase } from '../../src/application/delivery/use-cases/settle-driver-cash.use-case';
import { VehicleType, DriverStatus } from '../../src/domain/delivery/enums';
import { OrderStatus, OrderType, PaymentMethod, PaymentStatus } from '../../src/domain/ordering/enums';
import { ValidationError } from '../../src/domain/shared/errors/domain-error';

describe('Delivery Fleet Application Use Cases', () => {
  let branchId: string;
  let cashierId: string;
  let cashShiftId: string;
  let driverId: string;
  const testOrderIds: string[] = [];

  beforeAll(async () => {
    // 1. Ensure test branch exists
    let branch = await prisma.branch.findFirst({ where: { code: 'MAIN-01' } });
    if (!branch) {
      branch = await prisma.branch.create({
        data: {
          code: 'MAIN-01',
          nameAr: 'الفرع الرئيسي - المعادي',
          nameEn: 'Main Branch - Maadi',
          phone: '01012345678',
          address: 'المعادي - القاهرة',
          isActive: true,
        },
      });
    }
    branchId = branch.id;

    // 2. Ensure test cashier exists
    let cashier = await prisma.user.findFirst({ where: { username: 'cashier_test_user' } });
    if (!cashier) {
      const role = await prisma.role.findFirst() || await prisma.role.create({
        data: { name: 'CASHIER_ROLE', description: 'Cashier' },
      });
      cashier = await prisma.user.create({
        data: {
          username: 'cashier_test_user',
          fullName: 'كاشير التجربة',
          phone: '01011112222',
          passwordHash: 'dummy_hash',
          roleId: role.id,
        },
      });
    }
    cashierId = cashier.id;

    // 3. Create open cash shift for settlement testing
    const shift = await prisma.cashShift.create({
      data: {
        branchId,
        cashierId,
        status: 'OPEN',
        openingCashMinor: 50000,
        currency: 'EGP',
      },
    });
    cashShiftId = shift.id;
  });

  afterAll(async () => {
    // Cleanup created test records
    if (testOrderIds.length > 0) {
      await prisma.order.deleteMany({ where: { id: { in: testOrderIds } } });
    }
    if (driverId) {
      await prisma.driverSettlement.deleteMany({ where: { driverId } });
      await prisma.deliveryDriver.deleteMany({ where: { id: driverId } });
    }
    if (cashShiftId) {
      await prisma.cashShiftMovement.deleteMany({ where: { cashShiftId } });
      await prisma.cashShift.deleteMany({ where: { id: cashShiftId } });
    }
  });

  it('saves and updates a delivery driver', async () => {
    const saveDriver = new SaveDriverUseCase();

    // 1. Create Driver
    const created = await saveDriver.execute({
      branchId,
      fullName: 'سعيد التوصيل',
      phone: '01055556666',
      vehicleType: VehicleType.MOTORCYCLE,
      licensePlate: 'س ع د 111',
    });

    expect(created.id).toBeDefined();
    expect(created.fullName).toBe('سعيد التوصيل');
    expect(created.status).toBe(DriverStatus.AVAILABLE);
    driverId = created.id;

    // 2. Update Driver
    const updated = await saveDriver.execute({
      id: driverId,
      branchId,
      fullName: 'سعيد محمد التوصيل',
      phone: '01055556666',
      vehicleType: VehicleType.CAR,
      licensePlate: 'س ع د 222',
      status: DriverStatus.AVAILABLE,
      isActive: true,
    });

    expect(updated.fullName).toBe('سعيد محمد التوصيل');
    expect(updated.vehicleType).toBe(VehicleType.CAR);
  });

  it('rejects duplicate phone for another driver in the same branch', async () => {
    const saveDriver = new SaveDriverUseCase();

    await expect(
      saveDriver.execute({
        branchId,
        fullName: 'طيار آخر',
        phone: '01055556666', // same phone as created above
        vehicleType: VehicleType.MOTORCYCLE,
      })
    ).rejects.toThrow(ValidationError);
  });

  it('lists branch drivers with live operational metrics', async () => {
    const listDrivers = new ListBranchDriversUseCase();
    const drivers = await listDrivers.execute(branchId);

    expect(drivers.length).toBeGreaterThan(0);
    const found = drivers.find((d) => d.id === driverId);
    expect(found).toBeDefined();
    expect(found?.fullName).toBe('سعيد محمد التوصيل');
    expect(found?.activeOrdersCount).toBe(0);
    expect(found?.pendingCashMinor).toBe(0);
  });

  it('dispatches delivery orders to driver atomically', async () => {
    // Create 2 test orders in READY_FOR_PICKUP state
    const order1 = await prisma.order.create({
      data: {
        orderNumber: `TEST-ORD-DSP-1-${Date.now()}`,
        branchId,
        type: OrderType.DELIVERY,
        status: OrderStatus.READY_FOR_PICKUP,
        paymentMethod: PaymentMethod.CASH,
        paymentStatus: PaymentStatus.PENDING,
        totalMinor: 20000, // 200 EGP COD
        customerName: 'عميل 1',
        customerPhone: '01000000001',
      },
    });
    testOrderIds.push(order1.id);

    const order2 = await prisma.order.create({
      data: {
        orderNumber: `TEST-ORD-DSP-2-${Date.now()}`,
        branchId,
        type: OrderType.DELIVERY,
        status: OrderStatus.READY_FOR_PICKUP,
        paymentMethod: PaymentMethod.CASH,
        paymentStatus: PaymentStatus.PENDING,
        totalMinor: 15000, // 150 EGP COD
        customerName: 'عميل 2',
        customerPhone: '01000000002',
      },
    });
    testOrderIds.push(order2.id);

    const dispatchOrder = new DispatchOrderUseCase();
    const result = await dispatchOrder.execute({
      branchId,
      driverId,
      orderIds: [order1.id, order2.id],
    });

    expect(result.dispatchedCount).toBe(2);
    expect(result.driver.status).toBe(DriverStatus.ON_DELIVERY);

    // Verify orders in DB
    const fetched1 = await prisma.order.findUnique({ where: { id: order1.id } });
    expect(fetched1?.status).toBe(OrderStatus.OUT_FOR_DELIVERY);
    expect(fetched1?.driverId).toBe(driverId);
    expect(fetched1?.driverName).toBe('سعيد محمد التوصيل');
    expect(fetched1?.dispatchedAt).toBeDefined();
  });

  it('retrieves driver pending settlement after orders are marked delivered', async () => {
    // Mark both orders as DELIVERED
    await prisma.order.updateMany({
      where: { id: { in: testOrderIds } },
      data: {
        status: OrderStatus.DELIVERED,
        deliveredAt: new Date(),
      },
    });

    const getPendingSettlement = new GetDriverPendingSettlementUseCase();
    const result = await getPendingSettlement.execute(driverId);

    expect(result.driver.id).toBe(driverId);
    expect(result.summary.totalOrdersCount).toBe(2);
    expect(result.summary.codOrdersCount).toBe(2);
    expect(result.summary.totalCollectedCashMinor).toBe(35000); // 200 + 150 = 350 EGP
    expect(result.activeShift?.id).toBe(cashShiftId);
  });

  it('settles driver cash, credits active cash shift, and frees driver', async () => {
    const settleCash = new SettleDriverCashUseCase();

    const settlementResult = await settleCash.execute({
      branchId,
      driverId,
      cashierId,
      cashShiftId,
      notes: 'تسوية نهاية مشوار الغداء',
    });

    expect(settlementResult.settlement.settlementNumber).toMatch(/^STL-\d{8}-\d{4}$/);
    expect(settlementResult.settlement.totalOrdersCount).toBe(2);
    expect(settlementResult.settlement.totalCollectedMinor).toBe(35000);
    expect(settlementResult.driver.fullName).toBe('سعيد محمد التوصيل');

    // 1. Verify orders stamped with driverSettlementId
    const settledOrders = await prisma.order.findMany({
      where: { id: { in: testOrderIds } },
    });
    for (const o of settledOrders) {
      expect(o.driverSettlementId).toBe(settlementResult.settlement.id);
    }

    // 2. Verify CASH_IN movement in CashShift
    const movement = await prisma.cashShiftMovement.findFirst({
      where: {
        cashShiftId,
        type: 'CASH_IN',
        amountMinor: 35000,
      },
    });
    expect(movement).toBeDefined();
    expect(movement?.reason).toContain('سعيد محمد التوصيل');

    // 3. Verify driver returned to AVAILABLE
    const refreshedDriver = await prisma.deliveryDriver.findUnique({
      where: { id: driverId },
    });
    expect(refreshedDriver?.status).toBe(DriverStatus.AVAILABLE);

    // 4. Verify pending settlement is now 0
    const getPending = new GetDriverPendingSettlementUseCase();
    const pendingAfter = await getPending.execute(driverId);
    expect(pendingAfter.summary.totalOrdersCount).toBe(0);
    expect(pendingAfter.summary.totalCollectedCashMinor).toBe(0);
  });

  it('rejects settling cash when there are no delivered orders pending', async () => {
    const settleCash = new SettleDriverCashUseCase();

    await expect(
      settleCash.execute({
        branchId,
        driverId,
        cashierId,
        cashShiftId,
      })
    ).rejects.toThrow(ValidationError);
  });
});
