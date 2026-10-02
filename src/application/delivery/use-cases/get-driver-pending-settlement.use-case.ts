import { prisma } from '../../../infrastructure/db/prisma';
import { NotFoundError } from '../../../domain/shared/errors/domain-error';
import { OrderStatus } from '../../../domain/ordering/enums';
import { DriverSettlementCalculatorService } from '../../../domain/delivery/services/driver-settlement-calculator.service';

export class GetDriverPendingSettlementUseCase {
  public async execute(driverId: string) {
    const driver = await prisma.deliveryDriver.findUnique({
      where: { id: driverId },
      include: {
        branch: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
          },
        },
      },
    });

    if (!driver) {
      throw new NotFoundError('الطيار', driverId);
    }

    const restaurantSetting = await prisma.restaurantSetting.findFirst();
    const currency = restaurantSetting?.currency || 'EGP';

    const deliveredOrders = await prisma.order.findMany({
      where: {
        driverId: driver.id,
        status: OrderStatus.DELIVERED,
        driverSettlementId: null,
      },
      orderBy: { deliveredAt: 'desc' },
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

    const calculation = DriverSettlementCalculatorService.calculate(
      deliveredOrders,
      currency
    );

    // Check if there is an active cash shift in this branch
    const activeShift = await prisma.cashShift.findFirst({
      where: {
        branchId: driver.branchId,
        status: 'OPEN',
      },
      orderBy: { openedAt: 'desc' },
      select: {
        id: true,
        cashierId: true,
        cashier: { select: { fullName: true } },
      },
    });

    return {
      driver: {
        id: driver.id,
        fullName: driver.fullName,
        phone: driver.phone,
        branchId: driver.branchId,
        branchNameAr: driver.branch.nameAr,
      },
      summary: {
        totalOrdersCount: calculation.totalOrdersCount,
        codOrdersCount: calculation.codOrdersCount,
        prepaidOrdersCount: calculation.prepaidOrdersCount,
        totalCollectedCashMinor: calculation.totalCollectedCash.amount,
        formattedCash: calculation.totalCollectedCash.format('ar-EG'),
        currency,
      },
      orders: deliveredOrders,
      activeShift: activeShift
        ? {
            id: activeShift.id,
            cashierName: activeShift.cashier.fullName,
          }
        : null,
    };
  }
}
