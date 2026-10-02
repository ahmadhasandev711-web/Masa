import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../src/infrastructure/db/prisma';
import { PrismaPosRepository } from '../../src/infrastructure/pos/prisma-pos.repository';
import { OrderType, PaymentMethod } from '../../src/domain/ordering/enums';
import { UnitOfMeasure, InventoryMovementType } from '../../src/domain/inventory/enums';
import { CashShiftStatus } from '../../src/domain/pos/enums';

describe('POS Sale Atomic Inventory Deduction (Phase 7)', () => {
  let branchId: string;
  let cashierId: string;
  let shiftId: string;
  let inventoryItemId: string;
  let productIdWithRecipe: string;
  let sizeIdWithRecipe: string;
  let productIdWithoutRecipe: string;
  let sizeIdWithoutRecipe: string;
  let categoryId: string;

  beforeAll(async () => {
    // 1. Create test branch & cashier user
    const branch = await prisma.branch.create({
      data: {
        code: 'BR-POS-INV-' + Date.now().toString().slice(-4),
        nameAr: 'فرع فحص خصم الـ POS',
        nameEn: 'POS Deduction Test Branch',
        phone: '01011111199',
        address: 'عنوان الفرع',
      },
    });
    branchId = branch.id;

    const role = await prisma.role.findFirst({ where: { name: 'CASHIER' } });
    const cashier = await prisma.user.create({
      data: {
        username: 'cashier_inv_test_' + Date.now().toString().slice(-4),
        fullName: 'كاشير فحص المخزون',
        phone: '01012345678',
        passwordHash: 'dummy-hash',
        roleId: role!.id,
      },
    });
    cashierId = cashier.id;

    // 2. Open Cash Shift
    const shift = await prisma.cashShift.create({
      data: {
        branchId,
        cashierId,
        currency: 'EGP',
        openingCashMinor: 10000,
        status: CashShiftStatus.OPEN,
      },
    });
    shiftId = shift.id;

    // 3. Create raw InventoryItem
    await prisma.inventoryMovement.deleteMany({ where: { inventoryItem: { sku: { startsWith: 'BEEF-PATTY-TEST' } } } });
    await prisma.branchInventory.deleteMany({ where: { inventoryItem: { sku: { startsWith: 'BEEF-PATTY-TEST' } } } });
    await prisma.recipeItem.deleteMany({ where: { inventoryItem: { sku: { startsWith: 'BEEF-PATTY-TEST' } } } });
    await prisma.inventoryItem.deleteMany({ where: { sku: { startsWith: 'BEEF-PATTY-TEST' } } });

    const item = await prisma.inventoryItem.create({
      data: {
        sku: 'BEEF-PATTY-TEST-' + Date.now().toString().slice(-4),
        nameAr: 'شريحة برجر لحم',
        nameEn: 'Beef Patty',
        unit: UnitOfMeasure.PIECE,
        defaultCostMinor: 2000, // 20.00 EGP
      },
    });
    inventoryItemId = item.id;

    // Initialize branch stock with 10 pieces
    await prisma.branchInventory.create({
      data: {
        branchId,
        inventoryItemId,
        quantity: 10,
        minThreshold: 2,
      },
    });

    // 4. Create Category
    const category = await prisma.category.create({
      data: {
        nameAr: 'سندوتشات فحص المخزون',
        nameEn: 'POS Inventory Test Burgers',
      },
    });
    categoryId = category.id;

    // 5. Product WITH recipe
    const prod1 = await prisma.product.create({
      data: {
        categoryId: category.id,
        nameAr: 'برجر بالوصفة',
        nameEn: 'Burger With Recipe',
        sizes: {
          create: [{ nameAr: 'سنجل', nameEn: 'Single', price: 7500 }],
        },
      },
      include: { sizes: true },
    });
    productIdWithRecipe = prod1.id;
    sizeIdWithRecipe = prod1.sizes[0].id;

    // Attach recipe: 1 burger single consumes 2 beef patties
    await prisma.recipeItem.create({
      data: {
        inventoryItemId,
        productId: prod1.id,
        productSizeId: sizeIdWithRecipe,
        quantity: 2,
      },
    });

    // 6. Product WITHOUT recipe (optional BOM rule)
    const prod2 = await prisma.product.create({
      data: {
        categoryId: category.id,
        nameAr: 'مشروب غازي بلا وصفة',
        nameEn: 'Soda Without Recipe',
        sizes: {
          create: [{ nameAr: 'علبة', nameEn: 'Can', price: 2000 }],
        },
      },
      include: { sizes: true },
    });
    productIdWithoutRecipe = prod2.id;
    sizeIdWithoutRecipe = prod2.sizes[0].id;
  });

  afterAll(async () => {
    // Cleanup in proper foreign key order
    if (shiftId) {
      await prisma.orderPayment.deleteMany({ where: { order: { cashShiftId: shiftId } } });
      await prisma.orderItemModifier.deleteMany({ where: { orderItem: { order: { cashShiftId: shiftId } } } });
      await prisma.orderItem.deleteMany({ where: { order: { cashShiftId: shiftId } } });
      await prisma.order.deleteMany({ where: { cashShiftId: shiftId } });
      await prisma.cashShift.deleteMany({ where: { id: shiftId } });
    }
    if (productIdWithRecipe) {
      await prisma.recipeItem.deleteMany({ where: { productId: productIdWithRecipe } });
      await prisma.productSize.deleteMany({ where: { productId: productIdWithRecipe } });
      await prisma.product.deleteMany({ where: { id: productIdWithRecipe } });
    }
    if (productIdWithoutRecipe) {
      await prisma.productSize.deleteMany({ where: { productId: productIdWithoutRecipe } });
      await prisma.product.deleteMany({ where: { id: productIdWithoutRecipe } });
    }
    if (inventoryItemId) {
      await prisma.inventoryMovement.deleteMany({ where: { inventoryItemId } });
      await prisma.branchInventory.deleteMany({ where: { inventoryItemId } });
      await prisma.inventoryItem.deleteMany({ where: { id: inventoryItemId } });
    }
    if (cashierId) {
      await prisma.user.deleteMany({ where: { id: cashierId } });
    }
    if (branchId) {
      await prisma.branch.deleteMany({ where: { id: branchId } });
    }
  });

  it('atomically deducts inventory when product has recipe, and preserves replay idempotency', async () => {
    const posRepo = new PrismaPosRepository();
    const idempotencyKey = crypto.randomUUID();

    const request = {
      branchId,
      cashShiftId: shiftId,
      idempotencyKey,
      type: OrderType.TAKEAWAY as const,
      discountMinor: 0,
      items: [
        {
          productId: productIdWithRecipe,
          sizeId: sizeIdWithRecipe,
          modifierIds: [],
          quantity: 3, // 3 burgers * 2 patties = 6 patties should be deducted
        },
      ],
      payments: [
        { method: PaymentMethod.CASH as const, amountMinor: 22500 },
      ],
    };

    const scope = { branchId, cashierId, canDiscount: false };

    // 1. Initial Sale execution
    const receipt = await posRepo.transaction(async (tx) => {
      await tx.lockShift(shiftId, scope);
      const replay = await tx.findReplay(idempotencyKey);
      if (replay) return replay;

      const settings = await tx.getSettings();
      const products = await tx.getProducts(branchId, [productIdWithRecipe]);
      const product = products.find((p) => p.id === productIdWithRecipe)!;
      const size = product.sizes.find((s) => s.id === sizeIdWithRecipe)!;

      const lines = [
        {
          productId: product.id,
          sizeId: size.id,
          productNameAr: product.nameAr,
          productNameEn: product.nameEn,
          sizeNameAr: size.nameAr,
          sizeNameEn: size.nameEn,
          unitPriceMinor: size.price,
          quantity: 3,
          totalPriceMinor: size.price * 3,
          modifiers: [],
        },
      ];

      const totals = {
        subtotalMinor: 22500,
        taxMinor: 0,
        discountMinor: 0,
        totalMinor: 22500,
      };

      return tx.saveSale(request, scope, settings, totals, lines);
    });

    expect(receipt.id).toBeDefined();

    // 2. Verify stock deduction in BranchInventory: was 10, now should be 10 - 6 = 4
    const stockAfterSale = await prisma.branchInventory.findUnique({
      where: { branchId_inventoryItemId: { branchId, inventoryItemId } },
    });
    expect(Number(stockAfterSale?.quantity)).toBe(4);

    // 3. Verify movement was logged in immutable ledger
    const movement = await prisma.inventoryMovement.findFirst({
      where: {
        branchId,
        inventoryItemId,
        type: InventoryMovementType.SALE_POS,
      },
    });
    expect(movement).toBeDefined();
    expect(Number(movement?.quantityDelta)).toBe(-6);
    expect(Number(movement?.quantityBefore)).toBe(10);
    expect(Number(movement?.quantityAfter)).toBe(4);
    expect(movement?.unitCostMinor).toBe(2000);

    // 4. Test Replay Idempotency: replaying same request MUST return receipt WITHOUT re-deducting stock
    const replayedReceipt = await posRepo.transaction(async (tx) => {
      await tx.lockShift(shiftId, scope);
      const replay = await tx.findReplay(idempotencyKey);
      if (replay) return replay;
      throw new Error('Should not reach here');
    });

    expect(replayedReceipt.id).toBe(receipt.id);

    // Stock must STILL be 4 (not deducted again!)
    const stockAfterReplay = await prisma.branchInventory.findUnique({
      where: { branchId_inventoryItemId: { branchId, inventoryItemId } },
    });
    expect(Number(stockAfterReplay?.quantity)).toBe(4);
  });

  it('allows sale of product without recipe without any inventory deduction (Optional BOM rule)', async () => {
    const posRepo = new PrismaPosRepository();
    const idempotencyKey = crypto.randomUUID();

    const request = {
      branchId,
      cashShiftId: shiftId,
      idempotencyKey,
      type: OrderType.TAKEAWAY as const,
      discountMinor: 0,
      items: [
        {
          productId: productIdWithoutRecipe,
          sizeId: sizeIdWithoutRecipe,
          modifierIds: [],
          quantity: 2,
        },
      ],
      payments: [
        { method: PaymentMethod.CASH as const, amountMinor: 4000 },
      ],
    };

    const scope = { branchId, cashierId, canDiscount: false };

    const receipt = await posRepo.transaction(async (tx) => {
      await tx.lockShift(shiftId, scope);
      const replay = await tx.findReplay(idempotencyKey);
      if (replay) return replay;

      const settings = await tx.getSettings();
      const products = await tx.getProducts(branchId, [productIdWithoutRecipe]);
      const product = products.find((p) => p.id === productIdWithoutRecipe)!;
      const size = product.sizes.find((s) => s.id === sizeIdWithoutRecipe)!;

      const lines = [
        {
          productId: product.id,
          sizeId: size.id,
          productNameAr: product.nameAr,
          productNameEn: product.nameEn,
          sizeNameAr: size.nameAr,
          sizeNameEn: size.nameEn,
          unitPriceMinor: size.price,
          quantity: 2,
          totalPriceMinor: size.price * 2,
          modifiers: [],
        },
      ];

      const totals = {
        subtotalMinor: 4000,
        taxMinor: 0,
        discountMinor: 0,
        totalMinor: 4000,
      };

      return tx.saveSale(request, scope, settings, totals, lines);
    });

    expect(receipt.id).toBeDefined();

    // Stock for beef patty should remain 4
    const stock = await prisma.branchInventory.findUnique({
      where: { branchId_inventoryItemId: { branchId, inventoryItemId } },
    });
    expect(Number(stock?.quantity)).toBe(4);
  });

  afterAll(async () => {
    try {
      if (branchId) {
        await prisma.inventoryMovement.deleteMany({ where: { branchId } }).catch(() => {});
        await prisma.orderPayment.deleteMany({ where: { order: { branchId } } }).catch(() => {});
        await prisma.orderItemModifier.deleteMany({ where: { orderItem: { order: { branchId } } } }).catch(() => {});
        await prisma.orderItem.deleteMany({ where: { order: { branchId } } }).catch(() => {});
        await prisma.order.deleteMany({ where: { branchId } }).catch(() => {});
        await prisma.cashShiftMovement.deleteMany({ where: { cashShift: { branchId } } }).catch(() => {});
        await prisma.cashShift.deleteMany({ where: { branchId } }).catch(() => {});
        await prisma.branchInventory.deleteMany({ where: { branchId } }).catch(() => {});
      }
      if (productIdWithRecipe) {
        await prisma.recipeItem.deleteMany({ where: { productId: productIdWithRecipe } }).catch(() => {});
        await prisma.productSize.deleteMany({ where: { productId: productIdWithRecipe } }).catch(() => {});
        await prisma.product.deleteMany({ where: { id: productIdWithRecipe } }).catch(() => {});
      }
      if (productIdWithoutRecipe) {
        await prisma.productSize.deleteMany({ where: { productId: productIdWithoutRecipe } }).catch(() => {});
        await prisma.product.deleteMany({ where: { id: productIdWithoutRecipe } }).catch(() => {});
      }
      if (categoryId) {
        await prisma.category.deleteMany({ where: { id: categoryId } }).catch(() => {});
      }
      if (inventoryItemId) {
        await prisma.inventoryItem.deleteMany({ where: { id: inventoryItemId } }).catch(() => {});
      }
      if (cashierId) {
        await prisma.userBranch.deleteMany({ where: { userId: cashierId } }).catch(() => {});
        await prisma.user.deleteMany({ where: { id: cashierId } }).catch(() => {});
      }
      if (branchId) {
        await prisma.branch.deleteMany({ where: { id: branchId } }).catch(() => {});
      }
    } catch {
      // safe cleanup fallback
    }
  });
});
