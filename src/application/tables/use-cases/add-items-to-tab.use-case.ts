import { prisma } from '../../../infrastructure/db/prisma';
import { NotFoundError, ValidationError } from '../../../domain/shared/errors/domain-error';
import { TableStatus } from '../../../domain/tables/enums';
import { Money } from '../../../domain/shared/value-objects/money';
import { OrderPricingService, PricingItemInput } from '../../../domain/ordering/services/order-pricing.service';
import { AddItemsToTabDto, addItemsToTabSchema } from '../dto/table.dto';

interface ResolvedTabItemData {
  productId: string;
  sizeId: string;
  productNameAr: string;
  productNameEn: string;
  sizeNameAr: string;
  sizeNameEn: string;
  unitPriceMinor: number;
  quantity: number;
  modifiers: Array<{ id: string; nameAr: string; nameEn: string; priceDelta: number }>;
}

export class AddItemsToTabUseCase {
  public async execute(input: AddItemsToTabDto) {
    const validated = addItemsToTabSchema.parse(input);

    const order = await prisma.order.findUnique({
      where: { id: validated.orderId },
      include: {
        items: { include: { modifiers: true } },
        table: true,
      },
    });

    if (!order || !order.isTabOpen) {
      throw new NotFoundError('الطلب المفتوح للطاولة غير موجود أو تم إغلاقه');
    }

    const setting = await prisma.restaurantSetting.findFirst();
    const currency = setting?.currency ?? 'EGP';
    const taxRatePercent = Number(order.taxRatePercent);

    // 1. Resolve and verify incoming items
    const newPricingItems: PricingItemInput[] = [];
    const newItemsData: ResolvedTabItemData[] = [];

    for (const itemInput of validated.items) {
      const product = await prisma.product.findUnique({
        where: { id: itemInput.productId },
        include: {
          sizes: { where: { id: itemInput.sizeId, isActive: true } },
          modifierGroups: {
            include: {
              group: {
                include: {
                  modifiers: { where: { id: { in: itemInput.modifierIds } } },
                },
              },
            },
          },
        },
      });

      if (!product || !product.isActive || product.sizes.length === 0) {
        throw new ValidationError('الصنف غير متوفر حالياً');
      }

      const size = product.sizes[0];
      const selectedModifiers = [];
      for (const pmg of product.modifierGroups) {
        for (const mod of pmg.group.modifiers) {
          if (itemInput.modifierIds.includes(mod.id)) {
            selectedModifiers.push(mod);
          }
        }
      }

      const unitPrice = Money.fromMinor(size.price, currency);
      const modifierDeltas = selectedModifiers.map((m) => Money.fromMinor(m.priceDelta, currency));

      newPricingItems.push({
        unitPrice,
        quantity: itemInput.quantity,
        modifierDeltas,
      });

      newItemsData.push({
        productId: product.id,
        sizeId: size.id,
        productNameAr: product.nameAr,
        productNameEn: product.nameEn,
        sizeNameAr: size.nameAr,
        sizeNameEn: size.nameEn,
        unitPriceMinor: unitPrice.amount,
        quantity: itemInput.quantity,
        modifiers: selectedModifiers,
      });
    }

    // 2. Re-calculate existing + new totals
    const existingPricingItems: PricingItemInput[] = order.items.map((item) => ({
      unitPrice: Money.fromMinor(item.unitPriceMinor, currency),
      quantity: item.quantity,
      modifierDeltas: item.modifiers.map((m: { priceDeltaMinor: number }) => Money.fromMinor(m.priceDeltaMinor, currency)),
    }));

    const allPricingItems = [...existingPricingItems, ...newPricingItems];
    const newPricing = OrderPricingService.calculate(
      allPricingItems,
      Money.fromMinor(0, currency),
      taxRatePercent
    );

    // 3. Atomic Transaction: append items and update order totals
    return prisma.$transaction(async (tx) => {
      // Create new order items
      for (const item of newItemsData) {
        const itemTotalMinor =
          (item.unitPriceMinor + item.modifiers.reduce((sum: number, m: { priceDelta: number }) => sum + m.priceDelta, 0)) *
          item.quantity;

        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            sizeId: item.sizeId,
            productNameAr: item.productNameAr,
            productNameEn: item.productNameEn,
            sizeNameAr: item.sizeNameAr,
            sizeNameEn: item.sizeNameEn,
            unitPriceMinor: item.unitPriceMinor,
            quantity: item.quantity,
            totalPriceMinor: itemTotalMinor,
            modifiers: {
              create: item.modifiers.map((m) => ({
                modifierId: m.id,
                nameAr: m.nameAr,
                nameEn: m.nameEn,
                priceDeltaMinor: m.priceDelta,
              })),
            },
          },
        });
      }

      // Update order totals
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          subtotalMinor: newPricing.subtotal.amount,
          taxMinor: newPricing.tax.amount,
          totalMinor: newPricing.total.amount,
          billPrintedAt: null, // Reset bill printed state since new dishes were ordered
        },
        include: {
          items: { include: { modifiers: true } },
        },
      });

      // If table was in BILL_PRINTED status, return it to OCCUPIED
      if (order.tableId) {
        await tx.diningTable.update({
          where: { id: order.tableId },
          data: { status: TableStatus.OCCUPIED },
        });
      }

      return {
        ...updatedOrder,
        taxRatePercent: Number(updatedOrder.taxRatePercent),
      };
    });
  }
}
