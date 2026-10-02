import { prisma } from '../../../infrastructure/db/prisma';
import { OrderStatus, PaymentMethod, PaymentStatus } from '../../../domain/ordering/enums';
import { VehicleType, DriverStatus } from '../../../domain/delivery/enums';

export interface DriverViewItem {
  id: string;
  branchId: string;
  fullName: string;
  phone: string;
  vehicleType: VehicleType;
  licensePlate: string | null;
  status: DriverStatus;
  isActive: boolean;
  activeOrdersCount: number; // In transit right now
  unsettledDeliveredCount: number; // Delivered, waiting for cash settlement
  pendingCashMinor: number; // Total COD cash currently held by this driver
  createdAt: Date;
}

export class ListBranchDriversUseCase {
  public async execute(branchId: string): Promise<DriverViewItem[]> {
    const drivers = await prisma.deliveryDriver.findMany({
      where: { branchId },
      orderBy: [{ isActive: 'desc' }, { fullName: 'asc' }],
      include: {
        orders: {
          where: {
            OR: [
              { status: OrderStatus.OUT_FOR_DELIVERY },
              { status: OrderStatus.DELIVERED, driverSettlementId: null },
            ],
          },
          select: {
            id: true,
            status: true,
            totalMinor: true,
            paymentMethod: true,
            paymentStatus: true,
            driverSettlementId: true,
          },
        },
      },
    });

    return drivers.map((driver) => {
      const activeOrdersCount = driver.orders.filter(
        (o) => o.status === OrderStatus.OUT_FOR_DELIVERY
      ).length;

      const unsettledOrders = driver.orders.filter(
        (o) => o.status === OrderStatus.DELIVERED && o.driverSettlementId === null
      );

      const pendingCashMinor = unsettledOrders.reduce((sum, o) => {
        if (
          o.paymentMethod === PaymentMethod.CASH ||
          o.paymentStatus === PaymentStatus.PENDING
        ) {
          return sum + o.totalMinor;
        }
        return sum;
      }, 0);

      return {
        id: driver.id,
        branchId: driver.branchId,
        fullName: driver.fullName,
        phone: driver.phone,
        vehicleType: driver.vehicleType as VehicleType,
        licensePlate: driver.licensePlate,
        status: driver.status as DriverStatus,
        isActive: driver.isActive,
        activeOrdersCount,
        unsettledDeliveredCount: unsettledOrders.length,
        pendingCashMinor,
        createdAt: driver.createdAt,
      };
    });
  }
}
