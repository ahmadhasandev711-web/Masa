import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../src/infrastructure/db/prisma';
import { SaveInventoryItemUseCase } from '../../src/application/inventory/use-cases/manage-inventory-items.use-cases';
import { GetBranchStockUseCase, AdjustStockUseCase } from '../../src/application/inventory/use-cases/manage-branch-stock.use-cases';
import { SaveProductRecipesUseCase, GetProductRecipesUseCase } from '../../src/application/inventory/use-cases/manage-recipes.use-cases';
import { CreatePurchaseOrderUseCase, ReceivePurchaseOrderUseCase } from '../../src/application/inventory/use-cases/manage-purchase-orders.use-cases';
import { SaveSupplierUseCase } from '../../src/application/inventory/use-cases/manage-suppliers.use-cases';
import { ListInventoryMovementsUseCase } from '../../src/application/inventory/use-cases/list-inventory-movements.use-case';
import { UnitOfMeasure, InventoryMovementType, PurchaseOrderStatus } from '../../src/domain/inventory/enums';

describe('Inventory Application Use Cases', () => {
  let testBranchId: string;
  let testCategoryId: string;
  let testProductId: string;
  let createdItemId: string;
  let createdSupplierId: string;

  beforeAll(async () => {
    // 1. Ensure a test branch exists
    const branch = await prisma.branch.create({
      data: {
        code: 'BR-INV-TEST-' + Date.now().toString().slice(-4),
        nameAr: 'فرع اختبار المخزون',
        nameEn: 'Inventory Test Branch',
        phone: '01000000099',
        address: 'عنوان تجريبي',
      },
    });
    testBranchId = branch.id;

    // 2. Ensure category & product for recipe test
    const category = await prisma.category.create({
      data: {
        nameAr: 'تصنيف المخزون',
        nameEn: 'Inventory Category',
      },
    });
    testCategoryId = category.id;

    const product = await prisma.product.create({
      data: {
        categoryId: category.id,
        nameAr: 'برجر تجريبي للمخزون',
        nameEn: 'Test Inventory Burger',
        sizes: {
          create: [
            { nameAr: 'عادي', nameEn: 'Regular', price: 10000 },
          ],
        },
      },
    });
    testProductId = product.id;
  });

  afterAll(async () => {
    // Clean up created test entities
    if (testProductId) {
      await prisma.recipeItem.deleteMany({ where: { productId: testProductId } });
      await prisma.productSize.deleteMany({ where: { productId: testProductId } });
      await prisma.product.deleteMany({ where: { id: testProductId } });
    }
    if (testCategoryId) {
      await prisma.category.deleteMany({ where: { id: testCategoryId } });
    }
    if (createdSupplierId) {
      await prisma.purchaseOrderItem.deleteMany({ where: { purchaseOrder: { supplierId: createdSupplierId } } });
      await prisma.purchaseOrder.deleteMany({ where: { supplierId: createdSupplierId } });
      await prisma.supplier.deleteMany({ where: { id: createdSupplierId } });
    }
    if (createdItemId) {
      await prisma.inventoryMovement.deleteMany({ where: { inventoryItemId: createdItemId } });
      await prisma.branchInventory.deleteMany({ where: { inventoryItemId: createdItemId } });
      await prisma.inventoryItem.deleteMany({ where: { id: createdItemId } });
    }
    if (testBranchId) {
      await prisma.branch.deleteMany({ where: { id: testBranchId } });
    }
  });

  it('creates and updates an inventory item', async () => {
    const saveUseCase = new SaveInventoryItemUseCase();
    const item = await saveUseCase.execute({
      sku: 'TEST-RAW-01',
      nameAr: 'بطاطس نصف مقلية',
      nameEn: 'French Fries',
      unit: UnitOfMeasure.KG,
      defaultCostDecimal: 45.5,
      isActive: true,
    });

    expect(item.id).toBeDefined();
    expect(item.sku).toBe('TEST-RAW-01');
    expect(item.defaultCostMinor).toBe(4550);
    createdItemId = item.id;

    // Update
    const updated = await saveUseCase.execute({
      id: item.id,
      sku: 'TEST-RAW-01-V2',
      nameAr: 'بطاطس مقلية ممتازة',
      nameEn: 'Premium French Fries',
      unit: UnitOfMeasure.KG,
      defaultCostDecimal: 50.0,
      isActive: true,
    });

    expect(updated.nameAr).toBe('بطاطس مقلية ممتازة');
    expect(updated.sku).toBe('TEST-RAW-01-V2');
    expect(updated.defaultCostMinor).toBe(5000);
  });

  it('adjusts branch stock and allows negative stock with audit logging', async () => {
    const adjustUseCase = new AdjustStockUseCase();
    const getStockUseCase = new GetBranchStockUseCase();

    // 1. Initial manual operational issue (e.g. 10 kg issue to kitchen)
    const movement = await adjustUseCase.execute({
      branchId: testBranchId,
      inventoryItemId: createdItemId,
      type: InventoryMovementType.OPERATIONAL_CONSUMPTION,
      quantityDelta: -10,
      notes: 'صرف تجريبي للمطبخ',
    });

    expect(movement.id).toBeDefined();
    expect(movement.type).toBe(InventoryMovementType.OPERATIONAL_CONSUMPTION);
    expect(movement.quantityBefore).toBe(0);
    expect(movement.quantityDelta).toBe(-10);
    expect(movement.quantityAfter).toBe(-10);

    // 2. Query branch stock
    const stockList = await getStockUseCase.execute(testBranchId);
    const itemStock = stockList.find((s) => s.id === createdItemId);

    expect(itemStock).toBeDefined();
    expect(itemStock?.quantity).toBe(-10);
    expect(itemStock?.isNegative).toBe(true);
  });

  it('saves and retrieves BOM recipes for a product', async () => {
    const saveRecipeUseCase = new SaveProductRecipesUseCase();
    const getRecipeUseCase = new GetProductRecipesUseCase();

    await saveRecipeUseCase.execute({
      productId: testProductId,
      items: [
        {
          inventoryItemId: createdItemId,
          quantity: 0.25, // 250 grams
        },
      ],
    });

    const recipes = await getRecipeUseCase.execute(testProductId);
    expect(recipes).toHaveLength(1);
    expect(recipes[0].inventoryItemId).toBe(createdItemId);
    expect(recipes[0].quantity).toBe(0.25);
  });

  it('creates a supplier, creates purchase order, and receives it atomically into branch stock', async () => {
    const saveSupplierUseCase = new SaveSupplierUseCase();
    const createPOUseCase = new CreatePurchaseOrderUseCase();
    const receivePOUseCase = new ReceivePurchaseOrderUseCase();
    const getStockUseCase = new GetBranchStockUseCase();
    const listMovementsUseCase = new ListInventoryMovementsUseCase();

    // 1. Create Supplier
    const supplier = await saveSupplierUseCase.execute({
      name: 'شركة مزارع الدلتا للتوريد',
      phone: '01222222222',
      isActive: true,
    });
    createdSupplierId = supplier.id;

    // 2. Create Purchase Order for 50 kg of createdItemId
    const po = await createPOUseCase.execute({
      supplierId: supplier.id,
      branchId: testBranchId,
      invoiceNumber: 'INV-TEST-001',
      items: [
        {
          inventoryItemId: createdItemId,
          quantity: 50,
          unitCostDecimal: 48,
        },
      ],
    });

    expect(po.status).toBe(PurchaseOrderStatus.DRAFT);
    expect(po.items).toHaveLength(1);
    expect(po.totalMinor).toBe(240000); // 50 * 48 = 2400.00 EGP = 240000 minor

    // 3. Receive the Purchase Order
    const receivedPO = await receivePOUseCase.execute(po.id);
    expect(receivedPO.status).toBe(PurchaseOrderStatus.RECEIVED);
    expect(receivedPO.receivedAt).toBeDefined();

    // 4. Verify branch stock was increased from -10 to +40 (-10 + 50 = 40)
    const stockList = await getStockUseCase.execute(testBranchId);
    const itemStock = stockList.find((s) => s.id === createdItemId);
    expect(itemStock?.quantity).toBe(40);
    expect(itemStock?.isNegative).toBe(false);

    // 5. Verify movements ledger contains the PURCHASE movement
    const movements = await listMovementsUseCase.execute({
      branchId: testBranchId,
      inventoryItemId: createdItemId,
      type: InventoryMovementType.PURCHASE,
    });

    expect(movements.length).toBeGreaterThan(0);
    expect(movements[0].quantityDelta).toBe(50);
  });
});
