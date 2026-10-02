import { prisma } from '../../../infrastructure/db/prisma';
import { NotFoundError } from '../../../domain/shared/errors/domain-error';
import { LogMasker } from '../../../infrastructure/logging/log-masker';
import { OrderSource } from '../../../domain/ordering/enums';

export class GetOrderTrackerUseCase {
  public async execute(orderNumber: string) {
    if (!orderNumber || typeof orderNumber !== 'string' || orderNumber.trim() === '') {
      throw new NotFoundError('الطلب غير موجود، يرجى التأكد من رقم الطلب');
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber: orderNumber.trim() },
      include: {
        items: {
          include: { modifiers: true },
        },
        branch: {
          select: { nameAr: true, nameEn: true, phone: true },
        },
        driver: {
          select: { fullName: true, phone: true },
        },
      },
    });

    if (!order || order.source !== OrderSource.ONLINE) {
      throw new NotFoundError('الطلب غير موجود، يرجى التأكد من رقم الطلب');
    }

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      type: order.type,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      subtotalMinor: order.subtotalMinor,
      deliveryFeeMinor: order.deliveryFeeMinor,
      taxMinor: order.taxMinor,
      discountMinor: order.discountMinor,
      totalMinor: order.totalMinor,
      customerName: LogMasker.maskCustomerName(order.customerName),
      customerPhoneMasked: LogMasker.maskPhone(order.customerPhone),
      deliveryAddress: LogMasker.maskPublicAddress(order.deliveryAddress),
      deliveryNotes: null,
      createdAt: order.createdAt,
      branch: order.branch,
      driver: order.driver ? {
        fullName: order.driver.fullName,
        phone: order.driver.phone,
      } : null,
      items: order.items.map((item) => ({
        id: item.id,
        productNameAr: item.productNameAr,
        productNameEn: item.productNameEn,
        sizeNameAr: item.sizeNameAr,
        sizeNameEn: item.sizeNameEn,
        unitPriceMinor: item.unitPriceMinor,
        quantity: item.quantity,
        totalPriceMinor: item.totalPriceMinor,
        modifiers: item.modifiers.map((m) => ({
          nameAr: m.nameAr,
          nameEn: m.nameEn,
          priceDeltaMinor: m.priceDeltaMinor,
        })),
      })),
    };
  }
}
