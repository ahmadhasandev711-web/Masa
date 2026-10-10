import { Prisma } from '@prisma/client';
import { prisma } from '../../../infrastructure/db/prisma';
import { NotFoundError, ValidationError } from '../../../domain/shared/errors/domain-error';
import { Money } from '../../../domain/shared/value-objects/money';
import { OrderPricingService, PricingItemInput } from '../../../domain/ordering/services/order-pricing.service';
import { OrderStatus, OrderSource, OrderType, PaymentStatus, PaymentMethod } from '../../../domain/ordering/enums';
import { MatchOrCreateCustomerUseCase } from '../../customers/use-cases/match-or-create-customer.use-case';
import { PlaceOnlineOrderDto, placeOnlineOrderSchema } from '../dto/order.dto';

interface ResolvedModifierData {
  id: string;
  nameAr: string;
  nameEn: string;
  priceDelta: number;
}

interface ResolvedOrderItemData {
  productId: string;
  sizeId: string;
  productNameAr: string;
  productNameEn: string;
  sizeNameAr: string;
  sizeNameEn: string;
  unitPriceMinor: number;
  quantity: number;
  modifiers: ResolvedModifierData[];
}

export class PlaceOnlineOrderUseCase {
  public async execute(input: PlaceOnlineOrderDto) {
    const validated = placeOnlineOrderSchema.parse(input);

    // 0. Idempotent Replay Check (GR-4.1)
    if (validated.idempotencyKey) {
      const existing = await prisma.order.findUnique({
        where: { onlineIdempotencyKey: validated.idempotencyKey },
        include: {
          items: {
            include: { modifiers: true },
          },
        },
      });
      if (existing) {
        return existing;
      }
    }

    const setting = await prisma.restaurantSetting.findFirst();
    if (!setting) {
      throw new NotFoundError('إعدادات المطعم غير مهيأة');
    }

    const currency = setting.currency;
    const isTakeaway = validated.type === 'TAKEAWAY';
    const orderType = isTakeaway ? OrderType.TAKEAWAY : OrderType.DELIVERY;
    const effectiveDeliveryFee = isTakeaway ? Money.zero(currency) : Money.fromMinor(setting.deliveryFee, currency);
    const taxRatePercent = Number(setting.taxRatePercent);


    // 1. Fetch & Verify all items directly from database (GR-3.2: server-verified prices)
    const pricingItems: PricingItemInput[] = [];
    const resolvedItemsData: ResolvedOrderItemData[] = [];

    for (const itemInput of validated.items) {
      const product = await prisma.product.findUnique({
        where: { id: itemInput.productId },
        include: {
          sizes: { where: { id: itemInput.sizeId, isActive: true } },
          modifierGroups: {
            include: {
              group: {
                include: {
                  modifiers: { where: { isActive: true } },
                },
              },
            },
          },
        },
      });

      if (!product || !product.isActive) {
        throw new NotFoundError(`الصنف غير متوفر حالياً`);
      }

      const size = product.sizes[0];
      if (!size) {
        throw new ValidationError(`المقاس المختار غير متوفر للصنف: ${product.nameAr}`);
      }

      // Collect valid selected modifiers & enforce minSelect / maxSelect
      const selectedModifiers = [];
      for (const pmg of product.modifierGroups) {
        if (!pmg.group.isActive) continue;

        const chosenInThisGroup = pmg.group.modifiers.filter((mod) =>
          itemInput.modifierIds.includes(mod.id)
        );

        if (chosenInThisGroup.length < pmg.group.minSelect) {
          throw new ValidationError(
            `يجب اختيار ${pmg.group.minSelect} على الأقل من مجموعة: ${pmg.group.nameAr}`
          );
        }

        if (chosenInThisGroup.length > pmg.group.maxSelect) {
          throw new ValidationError(
            `الحد الأقصى للاختيار من مجموعة ${pmg.group.nameAr} هو ${pmg.group.maxSelect}`
          );
        }

        selectedModifiers.push(...chosenInThisGroup);
      }

      const unitPrice = Money.fromMinor(size.price, currency);
      const modifierDeltas = selectedModifiers.map((m) => Money.fromMinor(m.priceDelta, currency));

      pricingItems.push({
        unitPrice,
        quantity: itemInput.quantity,
        modifierDeltas,
      });

      resolvedItemsData.push({
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

    // 2. Compute Exact Pricing
    const pricing = OrderPricingService.calculate(pricingItems, effectiveDeliveryFee, taxRatePercent);

    // 3. Address Formatting
    const fullAddressSummary = isTakeaway
      ? 'استلام من الفرع'
      : [
          validated.area,
          validated.street,
          validated.building ? `عمارة ${validated.building}` : null,
          validated.floor ? `طابق ${validated.floor}` : null,
          validated.apartment ? `شقة ${validated.apartment}` : null,
          validated.landmark ? `(علامة: ${validated.landmark})` : null,
        ].filter(Boolean).join('، ');


    // 5. Atomic All-or-Nothing Transaction (GR-4.1, ACID)
    try {
      return await prisma.$transaction(async (tx) => {
        // Match or create customer inside transaction so no orphaned CRM records occur on failure
        const customerResult = await new MatchOrCreateCustomerUseCase().execute(
          {
            phone: validated.customerPhone,
            fullName: validated.customerName,
            email: validated.customerEmail || undefined,
            address: isTakeaway || !validated.area || !validated.street ? undefined : {
              title: 'عنوان التوصيل',
              city: 'Cairo',
              area: validated.area,
              street: validated.street,
              building: validated.building,
              floor: validated.floor,
              apartment: validated.apartment,
              landmark: validated.landmark,
              deliveryNotes: validated.deliveryNotes,
            },
          },
          tx
        );

        // 4. Generate sequential daily order number: WEB-YYYYMMDD-NNN (atomic inside tx)
        const orderNumber = await generateDailyWebOrderNumber(tx);

        let branchId = validated.branchId ?? null;
        if (!branchId) {
          const defaultBranch = await tx.branch.findFirst({
            where: { isActive: true },
            orderBy: { createdAt: 'asc' },
            select: { id: true },
          });
          if (defaultBranch) {
            branchId = defaultBranch.id;
          }
        }

        const createdOrder = await tx.order.create({
          data: {
            orderNumber,
            onlineIdempotencyKey: validated.idempotencyKey || null,
            customerId: customerResult.customer.id,
            branchId,
            source: OrderSource.ONLINE,
            type: orderType,
            status: OrderStatus.PENDING,
            paymentStatus: PaymentStatus.PENDING,
            paymentMethod: PaymentMethod.CASH,
            subtotalMinor: pricing.subtotal.amount,
            deliveryFeeMinor: pricing.deliveryFee.amount,
            taxRatePercent: setting.taxRatePercent,
            taxMinor: pricing.tax.amount,
            discountMinor: pricing.discount.amount,
            totalMinor: pricing.total.amount,

            customerName: validated.customerName.trim(),
            customerPhone: customerResult.customer.phone,
            deliveryAddress: fullAddressSummary,
            deliveryNotes: validated.deliveryNotes?.trim() || null,
            customerNotes: validated.customerNotes?.trim() || null,
            items: {
              create: resolvedItemsData.map((item) => {
                const itemTotalMinor = (item.unitPriceMinor + item.modifiers.reduce((sum, m) => sum + m.priceDelta, 0)) * item.quantity;
                return {
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
                };
              }),
            },
          },
          include: {
            items: {
              include: { modifiers: true },
            },
          },
        });

        // Update customer recent activity and order totals
        await tx.customer.update({
          where: { id: customerResult.customer.id },
          data: {
            totalOrders: { increment: 1 },
            totalSpent: { increment: pricing.total.amount },
            lastOrderAt: new Date(),
          },
        });

        return {
          ...createdOrder,
          taxRatePercent: Number(createdOrder.taxRatePercent),
        };
      });
    } catch (err: unknown) {
      // If concurrent request already inserted with same idempotencyKey, return existing
      const errorObj = err as { code?: string; message?: string } | null;
      if (
        validated.idempotencyKey &&
        errorObj &&
        (errorObj.code === 'P2002' || errorObj.message?.includes('online_idempotency_key'))
      ) {
        const replay = await prisma.order.findUnique({
          where: { onlineIdempotencyKey: validated.idempotencyKey },
          include: {
            items: {
              include: { modifiers: true },
            },
          },
        });
        if (replay) {
          return {
            ...replay,
            taxRatePercent: Number(replay.taxRatePercent),
          };
        }
      }
      throw err;
    }
  }
}

/**
 * Generates a clean, human-readable online order number with a daily sequential counter.
 * Format: WEB-YYYYMMDD-NNN  (e.g. WEB-20261002-001, WEB-20261002-002 …)
 *
 * Must run INSIDE a Prisma transaction with FOR UPDATE to prevent race conditions
 * when concurrent requests land on the same second.
 */
async function generateDailyWebOrderNumber(tx: Prisma.TransactionClient): Promise<string> {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm   = String(now.getMonth() + 1).padStart(2, '0');
  const dd   = String(now.getDate()).padStart(2, '0');
  const datePrefix = `${yyyy}${mm}${dd}`;          // e.g. 20261002
  const pattern    = `WEB-${datePrefix}-%`;

  const rows = await tx.$queryRawUnsafe<Array<{ cnt: number | bigint }>>(
    `SELECT COUNT(*) AS cnt FROM orders WHERE order_number LIKE ? FOR UPDATE`,
    pattern
  );

  const todayCount = rows?.[0]?.cnt ? Number(rows[0].cnt) : 0;
  const seq        = String(todayCount + 1).padStart(3, '0'); // 001, 002 …

  return `WEB-${datePrefix}-${seq}`;
}
