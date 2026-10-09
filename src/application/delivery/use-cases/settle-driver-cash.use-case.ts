import { prisma } from '../../../infrastructure/db/prisma';
import { NotFoundError, ValidationError } from '../../../domain/shared/errors/domain-error';
import { OrderStatus } from '../../../domain/ordering/enums';
import { DriverStatus } from '../../../domain/delivery/enums';
import { DriverSettlementCalculatorService } from '../../../domain/delivery/services/driver-settlement-calculator.service';
import { SettleDriverCashDto, settleDriverCashSchema } from '../dto/delivery.dto';

export class SettleDriverCashUseCase {
  public async execute(input: SettleDriverCashDto) {
    const validated = settleDriverCashSchema.parse(input);

    const driver = await prisma.deliveryDriver.findUnique({
      where: { id: validated.driverId },
      include: { branch: true },
    });

    if (!driver || driver.branchId !== validated.branchId) {
      throw new NotFoundError('الطيار', validated.driverId);
    }

    const cashier = await prisma.user.findUnique({
      where: { id: validated.cashierId },
    });
    if (!cashier) {
      throw new NotFoundError('الموظف المستلم', validated.cashierId);
    }

    const deliveredOrders = await prisma.order.findMany({
      where: {
        driverId: driver.id,
        status: OrderStatus.DELIVERED,
        driverSettlementId: null,
      },
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        totalMinor: true,
        paymentMethod: true,
        paymentStatus: true,
        driverId: true,
        deliveredAt: true,
        driverSettlementId: true,
      },
    });

    if (deliveredOrders.length === 0) {
      throw new ValidationError(`لا توجد أي طلبات مسلّمة بانتظار التسوية للطيار ${driver.fullName}`);
    }

    const restaurantSetting = await prisma.restaurantSetting.findFirst();
    const currency = restaurantSetting?.currency || 'EGP';
    const currencySymbol = restaurantSetting?.currencySymbol || 'ج.م';

    const calculation = DriverSettlementCalculatorService.calculate(
      deliveredOrders,
      currency
    );

    // Resolve active cash shift
    let effectiveShiftId = validated.cashShiftId ?? null;
    if (!effectiveShiftId) {
      const activeShift = await prisma.cashShift.findFirst({
        where: {
          branchId: validated.branchId,
          status: 'OPEN',
        },
        orderBy: { openedAt: 'desc' },
      });
      if (activeShift) {
        effectiveShiftId = activeShift.id;
      }
    }

    // Generate unique settlement number (STL-YYYYMMDD-XXXX)
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000).toString();
    const settlementNumber = `STL-${dateStr}-${randSuffix}`;

    return prisma.$transaction(async (tx) => {
      // 1. Create settlement record
      const settlement = await tx.driverSettlement.create({
        data: {
          settlementNumber,
          branchId: validated.branchId,
          driverId: driver.id,
          cashierId: cashier.id,
          cashShiftId: effectiveShiftId,
          totalOrdersCount: calculation.totalOrdersCount,
          totalCollectedMinor: calculation.totalCollectedCash.amount,
          notes: validated.notes?.trim() || null,
          settledAt: now,
        },
      });

      // 2. Link settled orders & generate OrderPayment records for settled COD
      for (const order of deliveredOrders) {
        if (order.paymentMethod === 'CASH') {
          const existingPayment = await tx.orderPayment.findFirst({
            where: { orderId: order.id, method: 'CASH' },
          });
          if (!existingPayment) {
            await tx.orderPayment.create({
              data: {
                orderId: order.id,
                method: 'CASH',
                amountMinor: order.totalMinor,
              },
            });
          }
        }
      }

      await tx.order.updateMany({
        where: { id: { in: calculation.orderIds } },
        data: {
          driverSettlementId: settlement.id,
          cashierId: cashier.id,
        },
      });

      // 3. Financial Bridge: Create CASH_IN CashShiftMovement if cash was collected
      if (calculation.totalCollectedCash.amount > 0 && effectiveShiftId) {
        await tx.cashShiftMovement.create({
          data: {
            cashShiftId: effectiveShiftId,
            type: 'CASH_IN',
            amountMinor: calculation.totalCollectedCash.amount,
            reason: `توريد عهدة دليفري من كابتن ${driver.fullName} - تسوية رقم ${settlementNumber}`,
            performedById: cashier.id,
          },
        });
      }

      // 4. Check if driver has other orders currently out
      const remainingOrdersCount = await tx.order.count({
        where: {
          driverId: driver.id,
          status: OrderStatus.OUT_FOR_DELIVERY,
        },
      });

      if (remainingOrdersCount === 0) {
        await tx.deliveryDriver.update({
          where: { id: driver.id },
          data: { status: DriverStatus.AVAILABLE },
        });
      }

      // Return complete printable settlement data
      return {
        settlement: {
          id: settlement.id,
          settlementNumber: settlement.settlementNumber,
          settledAt: settlement.settledAt,
          totalOrdersCount: settlement.totalOrdersCount,
          totalCollectedMinor: settlement.totalCollectedMinor,
          notes: settlement.notes,
        },
        driver: {
          id: driver.id,
          fullName: driver.fullName,
          phone: driver.phone,
        },
        cashier: {
          id: cashier.id,
          fullName: cashier.fullName,
        },
        branch: {
          id: driver.branch.id,
          nameAr: driver.branch.nameAr,
          nameEn: driver.branch.nameEn,
        },
        financials: {
          currency,
          currencySymbol,
          codOrdersCount: calculation.codOrdersCount,
          prepaidOrdersCount: calculation.prepaidOrdersCount,
          totalCollectedMinor: calculation.totalCollectedCash.amount,
          linkedCashShiftId: effectiveShiftId,
        },
        orders: deliveredOrders.map((o) => ({
          orderNumber: o.orderNumber,
          customerName: o.customerName,
          totalMinor: o.totalMinor,
          paymentMethod: o.paymentMethod,
        })),
      };
    });
  }
}
