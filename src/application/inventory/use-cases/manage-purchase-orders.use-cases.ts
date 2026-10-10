import { PrismaInventoryRepository } from '../../../infrastructure/inventory/prisma-inventory.repository';
import { CreatePurchaseOrderInput, CreatePurchaseOrderSchema } from '../dto/inventory.dto';
import { PurchaseOrderDto } from '../../../domain/inventory/contracts/inventory.repository';
import { Money } from '../../../domain/shared/value-objects/money';
import { ForbiddenError, NotFoundError, ValidationError } from '../../../domain/shared/errors/domain-error';

import { prisma } from '../../../infrastructure/db/prisma';

export class ListPurchaseOrdersUseCase {
  constructor(private readonly repo = new PrismaInventoryRepository()) {}

  public async execute(branchId?: string): Promise<PurchaseOrderDto[]> {
    return this.repo.findPurchaseOrders(branchId);
  }
}

export class CreatePurchaseOrderUseCase {
  constructor(private readonly repo = new PrismaInventoryRepository()) {}

  public async execute(input: CreatePurchaseOrderInput, userId?: string): Promise<PurchaseOrderDto> {
    const validated = CreatePurchaseOrderSchema.parse(input);
    const setting = await prisma.restaurantSetting.findFirst();
    const currency = setting?.currency ?? 'EGP';

    const items = validated.items.map((item) => {
      const money = Money.fromMajor(item.unitCostDecimal, currency);
      return {
        inventoryItemId: item.inventoryItemId,
        quantity: item.quantity,
        unitCostMinor: money.amount,
      };
    });

    return this.repo.createPurchaseOrder(
      {
        supplierId: validated.supplierId,
        branchId: validated.branchId,
        invoiceNumber: validated.invoiceNumber,
        notes: validated.notes,
        items,
      },
      userId
    );
  }
}

export class ReceivePurchaseOrderUseCase {
  constructor(private readonly repo = new PrismaInventoryRepository()) {}

  public async execute(orderId: string, userId?: string, allowedBranchIds?: string[]): Promise<PurchaseOrderDto> {
    if (!orderId) throw new ValidationError('معرف أمر الشراء مطلوب');

    if (allowedBranchIds) {
      const order = await prisma.purchaseOrder.findUnique({
        where: { id: orderId },
        select: { branchId: true },
      });
      if (!order) {
        throw new NotFoundError('أمر الشراء', orderId);
      }
      if (!allowedBranchIds.includes(order.branchId)) {
        throw new ForbiddenError('غير مصرح لك باستلام أمر شراء تابع لفرع آخر');
      }
    }

    return this.repo.receivePurchaseOrder(orderId, userId);
  }
}
