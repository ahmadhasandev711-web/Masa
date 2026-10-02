import { describe, it, expect } from 'vitest';
import { DeliveryDriverEntity } from '../../src/domain/delivery/entities/driver.entity';
import { DriverStatus, VehicleType } from '../../src/domain/delivery/enums';
import {
  DriverSettlementCalculatorService,
  UnsettledDeliveryOrder,
} from '../../src/domain/delivery/services/driver-settlement-calculator.service';
import { PaymentMethod, PaymentStatus } from '../../src/domain/ordering/enums';
import { ValidationError } from '../../src/domain/shared/errors/domain-error';

describe('DeliveryDriverEntity (Domain)', () => {
  it('creates a valid delivery driver entity', () => {
    const driver = new DeliveryDriverEntity({
      id: 'driver-1',
      branchId: 'branch-1',
      fullName: 'أحمد محمود',
      phone: '01012345678',
      vehicleType: VehicleType.MOTORCYCLE,
      status: DriverStatus.AVAILABLE,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(driver.id).toBe('driver-1');
    expect(driver.fullName).toBe('أحمد محمود');
    expect(driver.canTakeOrders()).toBe(true);
  });

  it('rejects driver with invalid name or phone', () => {
    expect(() => {
      new DeliveryDriverEntity({
        id: 'driver-1',
        branchId: 'branch-1',
        fullName: 'أ', // too short
        phone: '01012345678',
        vehicleType: VehicleType.MOTORCYCLE,
        status: DriverStatus.AVAILABLE,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }).toThrow(ValidationError);

    expect(() => {
      new DeliveryDriverEntity({
        id: 'driver-1',
        branchId: 'branch-1',
        fullName: 'أحمد محمود',
        phone: '123', // too short
        vehicleType: VehicleType.MOTORCYCLE,
        status: DriverStatus.AVAILABLE,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }).toThrow(ValidationError);
  });

  it('marks inactive driver as unable to take orders', () => {
    const driver = new DeliveryDriverEntity({
      id: 'driver-1',
      branchId: 'branch-1',
      fullName: 'محمود حسن',
      phone: '01098765432',
      vehicleType: VehicleType.CAR,
      status: DriverStatus.INACTIVE,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(driver.canTakeOrders()).toBe(false);
  });
});

describe('DriverSettlementCalculatorService (Domain)', () => {
  it('calculates collected cash for delivered COD orders accurately', () => {
    const orders: UnsettledDeliveryOrder[] = [
      {
        id: 'order-1',
        orderNumber: 'ORD-001',
        totalMinor: 25000, // 250.00 EGP COD
        paymentMethod: PaymentMethod.CASH,
        paymentStatus: PaymentStatus.PENDING,
        driverId: 'driver-1',
        deliveredAt: new Date(),
        driverSettlementId: null,
      },
      {
        id: 'order-2',
        orderNumber: 'ORD-002',
        totalMinor: 15000, // 150.00 EGP COD
        paymentMethod: PaymentMethod.CASH,
        paymentStatus: PaymentStatus.PENDING,
        driverId: 'driver-1',
        deliveredAt: new Date(),
        driverSettlementId: null,
      },
      {
        id: 'order-3',
        orderNumber: 'ORD-003',
        totalMinor: 30000, // 300.00 EGP Prepaid Card (driver holds no cash)
        paymentMethod: PaymentMethod.CARD,
        paymentStatus: PaymentStatus.PAID,
        driverId: 'driver-1',
        deliveredAt: new Date(),
        driverSettlementId: null,
      },
    ];

    const result = DriverSettlementCalculatorService.calculate(orders, 'EGP');

    expect(result.totalOrdersCount).toBe(3);
    expect(result.codOrdersCount).toBe(2);
    expect(result.prepaidOrdersCount).toBe(1);
    expect(result.totalCollectedCash.amount).toBe(40000); // 400.00 EGP
    expect(result.totalCollectedCash.format('en-US')).toContain('400');
    expect(result.orderIds).toEqual(['order-1', 'order-2', 'order-3']);
  });

  it('rejects already settled orders with ValidationError', () => {
    const orders: UnsettledDeliveryOrder[] = [
      {
        id: 'order-1',
        orderNumber: 'ORD-001',
        totalMinor: 25000,
        paymentMethod: PaymentMethod.CASH,
        paymentStatus: PaymentStatus.PENDING,
        driverId: 'driver-1',
        deliveredAt: new Date(),
        driverSettlementId: 'settlement-previous', // already settled!
      },
    ];

    expect(() => {
      DriverSettlementCalculatorService.calculate(orders, 'EGP');
    }).toThrow(ValidationError);
  });

  it('handles empty orders list gracefully', () => {
    const result = DriverSettlementCalculatorService.calculate([], 'EGP');
    expect(result.totalOrdersCount).toBe(0);
    expect(result.totalCollectedCash.amount).toBe(0);
  });
});
