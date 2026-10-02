import { Money } from '../../shared/value-objects/money';
import { PaymentMethod, PaymentStatus } from '../../ordering/enums';
import { ValidationError } from '../../shared/errors/domain-error';

export interface UnsettledDeliveryOrder {
  id: string;
  orderNumber: string;
  totalMinor: number;
  paymentMethod: string;
  paymentStatus: string;
  driverId: string | null;
  deliveredAt: Date | null;
  driverSettlementId: string | null;
}

export interface DriverSettlementCalculation {
  totalOrdersCount: number;
  codOrdersCount: number;
  prepaidOrdersCount: number;
  totalCollectedCash: Money;
  orderIds: string[];
}

export class DriverSettlementCalculatorService {
  /**
   * Calculates total cash in driver's custody from delivered orders (GR-1.1 & GR-8.2).
   */
  public static calculate(
    orders: UnsettledDeliveryOrder[],
    currency: string = 'EGP'
  ): DriverSettlementCalculation {
    if (!orders || orders.length === 0) {
      return {
        totalOrdersCount: 0,
        codOrdersCount: 0,
        prepaidOrdersCount: 0,
        totalCollectedCash: Money.zero(currency),
        orderIds: [],
      };
    }

    let codMinor = 0;
    let codCount = 0;
    let prepaidCount = 0;
    const orderIds: string[] = [];

    for (const order of orders) {
      if (order.driverSettlementId) {
        throw new ValidationError(`الطلب ${order.orderNumber} تم تسوية عهدته مسبقاً`);
      }

      orderIds.push(order.id);

      // Only CASH / COD orders require cash remittance from the driver
      if (
        order.paymentMethod === PaymentMethod.CASH ||
        order.paymentStatus === PaymentStatus.PENDING
      ) {
        codMinor += order.totalMinor;
        codCount++;
      } else {
        prepaidCount++;
      }
    }

    return {
      totalOrdersCount: orders.length,
      codOrdersCount: codCount,
      prepaidOrdersCount: prepaidCount,
      totalCollectedCash: Money.fromMinor(codMinor, currency),
      orderIds,
    };
  }
}
