import { Prisma, PrismaClient } from '@prisma/client';
import { InventoryMovementType } from '../../domain/inventory/enums';
import { InventoryConsumptionService } from '../../domain/inventory/services/inventory-consumption.service';

export type PrismaTransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export class OrderInventoryDeductionService {
  /**
   * Atomically deducts inventory recipe items for an order (POS or Online).
   * Ensures idempotency: will not double-deduct if movements for this order already exist.
   */
  public static async deductForOrder(
    orderId: string,
    client: PrismaTransactionClient,
    movementType: InventoryMovementType = InventoryMovementType.SALE_ONLINE,
    createdById?: string | null
  ): Promise<void> {
    // 1. Idempotency Guard (GR-4.1): Never double-deduct an order
    const existingMovement = await client.inventoryMovement.findFirst({
      where: {
        referenceId: orderId,
        type: {
          in: [InventoryMovementType.SALE_POS, InventoryMovementType.SALE_ONLINE],
        },
      },
    });

    if (existingMovement) {
      return;
    }

    // 2. Fetch Order with Items and Modifiers
    const order = await client.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            modifiers: true,
          },
        },
      },
    });

    if (!order || !order.branchId || order.items.length === 0) {
      return;
    }

    const productIds = order.items.map((i) => i.productId);
    const sizeIds = order.items
      .map((i) => i.sizeId)
      .filter((s): s is string => Boolean(s));
    const modifierIds = order.items.flatMap((i) =>
      i.modifiers.map((m) => m.modifierId)
    );

    // 3. Fetch applicable BOM Recipe Items
    const recipeItems = await client.recipeItem.findMany({
      where: {
        OR: [
          { productId: { in: productIds } },
          { productSizeId: { in: sizeIds } },
          { modifierId: { in: modifierIds } },
        ],
      },
      include: {
        inventoryItem: true,
      },
    });

    if (recipeItems.length === 0) {
      return;
    }

    // 4. Calculate exact ingredient deductions (GR-1.3)
    const deductions = InventoryConsumptionService.calculateDeductions(
      order.items.map((i) => ({
        productId: i.productId,
        sizeId: i.sizeId,
        modifierIds: i.modifiers.map((m) => m.modifierId),
        quantity: i.quantity,
      })),
      recipeItems.map((r) => ({
        inventoryItemId: r.inventoryItemId,
        productId: r.productId,
        productSizeId: r.productSizeId,
        modifierId: r.modifierId,
        quantity: Number(r.quantity),
      }))
    );

    if (deductions.length === 0) {
      return;
    }

    // 5. Atomic Stock Decrement & Immutable Ledger Entry (GR-4.1, GR-5.2)
    for (const deduction of deductions) {
      const updatedStock = await client.branchInventory.upsert({
        where: {
          branchId_inventoryItemId: {
            branchId: order.branchId,
            inventoryItemId: deduction.inventoryItemId,
          },
        },
        create: {
          branchId: order.branchId,
          inventoryItemId: deduction.inventoryItemId,
          quantity: new Prisma.Decimal(-deduction.quantity),
        },
        update: {
          quantity: {
            decrement: new Prisma.Decimal(deduction.quantity),
          },
        },
      });

      const qtyAfter = Number(updatedStock.quantity);
      const qtyBefore = Number((qtyAfter + deduction.quantity).toFixed(3));
      const unitCostMinor =
        recipeItems.find((r) => r.inventoryItemId === deduction.inventoryItemId)
          ?.inventoryItem.defaultCostMinor ?? 0;

      await client.inventoryMovement.create({
        data: {
          branchId: order.branchId,
          inventoryItemId: deduction.inventoryItemId,
          type: movementType,
          quantityDelta: new Prisma.Decimal(-deduction.quantity),
          quantityBefore: new Prisma.Decimal(qtyBefore),
          quantityAfter: new Prisma.Decimal(qtyAfter),
          unitCostMinor,
          referenceId: order.id,
          notes:
            movementType === InventoryMovementType.SALE_POS
              ? `خصم بيع كاشير فاتورة ${order.orderNumber}`
              : `خصم مكونات طلب توصيل ${order.orderNumber}`,
          createdById: createdById ?? null,
        },
      });
    }
  }
}
