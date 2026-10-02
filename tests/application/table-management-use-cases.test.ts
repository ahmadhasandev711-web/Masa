import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../src/infrastructure/db/prisma';
import { Money } from '../../src/domain/shared/value-objects/money';
import { SplitBillService } from '../../src/domain/tables/services/split-bill.service';
import { TableStateMachine } from '../../src/domain/tables/services/table-state-machine';
import { TableStatus, TableShape } from '../../src/domain/tables/enums';
import { ManageSectionsUseCase } from '../../src/application/tables/use-cases/manage-sections.use-case';
import { ManageTablesUseCase } from '../../src/application/tables/use-cases/manage-tables.use-case';
import { ListTablesUseCase } from '../../src/application/tables/use-cases/list-tables.use-case';
import { OpenTableTabUseCase } from '../../src/application/tables/use-cases/open-table-tab.use-case';
import { AddItemsToTabUseCase } from '../../src/application/tables/use-cases/add-items-to-tab.use-case';
import { TransferTableUseCase } from '../../src/application/tables/use-cases/transfer-table.use-case';
import { PrintTableBillUseCase } from '../../src/application/tables/use-cases/print-table-bill.use-case';
import { CloseTableTabUseCase } from '../../src/application/tables/use-cases/close-table-tab.use-case';
import { ValidationError } from '../../src/domain/shared/errors/domain-error';

describe('Table Management & Split Bill Suite (Phase 10)', () => {
  let branchId: string;
  let cashierId: string;
  let cashShiftId: string;
  let sectionId: string;
  let table1Id: string;
  let table2Id: string;
  let productId: string;
  let sizeId: string;
  let unitPrice: number;

  beforeAll(async () => {
    // 1. Ensure branch
    let branch = await prisma.branch.findFirst({ where: { isActive: true } });
    if (!branch) {
      branch = await prisma.branch.create({
        data: {
          code: 'BR-TEST-TBL',
          nameAr: 'فرع تجارب الطاولات',
          nameEn: 'Tables Test Branch',
          phone: '01011112222',
          address: 'شارع التحرير',
        },
      });
    }
    branchId = branch.id;

    // 2. Ensure user and cash shift
    let user = await prisma.user.findFirst({ where: { isActive: true } });
    if (!user) {
      let role = await prisma.role.findFirst({ where: { name: 'CASHIER' } });
      if (!role) {
        role = await prisma.role.create({ data: { name: 'CASHIER', isSystem: true } });
      }
      user = await prisma.user.create({
        data: {
          username: 'cashier_tbl_test',
          fullName: 'كاشير الطاولات',
          phone: '01012345678',
          roleId: role.id,
          passwordHash: 'dummy',
        },
      });
    }
    cashierId = user.id;

    let shift = await prisma.cashShift.findFirst({
      where: { branchId, status: 'OPEN' },
    });
    if (!shift) {
      shift = await prisma.cashShift.create({
        data: {
          branchId,
          cashierId,
          status: 'OPEN',
          openingCashMinor: 50000,
        },
      });
    }
    cashShiftId = shift.id;

    // 3. Ensure product & size
    let product = await prisma.product.findFirst({
      where: { isActive: true },
      include: { sizes: { where: { isActive: true } } },
    });
    if (!product || product.sizes.length === 0) {
      const category = await prisma.category.create({
        data: { nameAr: 'وجبات الصالة', nameEn: 'Dine-in Meals' },
      });
      product = await prisma.product.create({
        data: {
          categoryId: category.id,
          nameAr: 'ستيك لحم مخصوص',
          nameEn: 'Special Beef Steak',
          sizes: {
            create: { nameAr: 'وسط', nameEn: 'Medium', price: 15000 },
          },
        },
        include: { sizes: true },
      });
    }
    productId = product.id;
    sizeId = product.sizes[0].id;
    unitPrice = product.sizes[0].price;
  });

  afterAll(async () => {
    // Clean up created tables and sections
    if (table1Id || table2Id) {
      await prisma.diningTable.deleteMany({
        where: { id: { in: [table1Id, table2Id].filter(Boolean) } },
      });
    }
    if (sectionId) {
      await prisma.tableSection.deleteMany({ where: { id: sectionId } });
    }
  });

  describe('1. SplitBillService Pure Math (GR-1.1, GR-8.2)', () => {
    it('splits odd totals exactly without lost minor units', () => {
      // 100.00 EGP split among 3 people: 33.34 + 33.33 + 33.33 = 100.00
      const total = Money.fromMinor(10000, 'EGP');
      const splits = SplitBillService.splitEqually(total, 3);

      expect(splits).toHaveLength(3);
      expect(splits[0].amount).toBe(3334);
      expect(splits[1].amount).toBe(3333);
      expect(splits[2].amount).toBe(3333);

      const sum = splits.reduce((acc, p) => acc + p.amount, 0);
      expect(sum).toBe(10000);
    });

    it('splits among 7 people with remainder distribution', () => {
      // 250.00 EGP (25000) on 7 people
      const total = Money.fromMinor(25000, 'EGP');
      const splits = SplitBillService.splitEqually(total, 7);

      expect(splits).toHaveLength(7);
      const sum = splits.reduce((acc, p) => acc + p.amount, 0);
      expect(sum).toBe(25000);
    });

    it('rejects invalid split counts', () => {
      const total = Money.fromMinor(5000, 'EGP');
      expect(() => SplitBillService.splitEqually(total, 0)).toThrow(ValidationError);
      expect(() => SplitBillService.splitEqually(total, -2)).toThrow(ValidationError);
    });

    it('validates custom split amounts', () => {
      const total = Money.fromMinor(10000, 'EGP');
      const validParts = [
        Money.fromMinor(4000, 'EGP'),
        Money.fromMinor(6000, 'EGP'),
      ];
      expect(SplitBillService.validateCustomSplits(total, validParts)).toBe(true);

      const invalidParts = [
        Money.fromMinor(4000, 'EGP'),
        Money.fromMinor(5000, 'EGP'),
      ];
      expect(SplitBillService.validateCustomSplits(total, invalidParts)).toBe(false);
    });
  });

  describe('2. TableStateMachine Transitions (GR-6.2)', () => {
    it('allows valid transitions according to business lifecycle', () => {
      expect(() =>
        TableStateMachine.assertTransition(TableStatus.AVAILABLE, TableStatus.OCCUPIED)
      ).not.toThrow();

      expect(() =>
        TableStateMachine.assertTransition(TableStatus.OCCUPIED, TableStatus.BILL_PRINTED)
      ).not.toThrow();

      expect(() =>
        TableStateMachine.assertTransition(TableStatus.BILL_PRINTED, TableStatus.AVAILABLE)
      ).not.toThrow();
    });

    it('blocks illegal state jumps', () => {
      expect(() =>
        TableStateMachine.assertTransition(TableStatus.AVAILABLE, TableStatus.BILL_PRINTED)
      ).toThrow(ValidationError);

      expect(() =>
        TableStateMachine.assertTransition(TableStatus.CLEANING, TableStatus.OCCUPIED)
      ).toThrow(ValidationError);
    });
  });

  describe('3. End-to-End Table Lifecycle & Tabs', () => {
    it('creates sections and dining tables', async () => {
      const manageSections = new ManageSectionsUseCase();
      const manageTables = new ManageTablesUseCase();

      // Create Section
      const section = await manageSections.create({
        branchId,
        nameAr: 'صالة العائلات التجريبية',
        nameEn: 'Test Family Section',
        sortOrder: 1,
      });
      expect(section).toBeDefined();
      sectionId = section.id;

      // Create Table 1
      const table1 = await manageTables.create({
        branchId,
        sectionId,
        tableNumber: `T-TEST-${Date.now()}-1`,
        capacity: 4,
        shape: TableShape.SQUARE,
        sortOrder: 1,
      });
      expect(table1).toBeDefined();
      expect(table1.status).toBe(TableStatus.AVAILABLE);
      table1Id = table1.id;

      // Create Table 2
      const table2 = await manageTables.create({
        branchId,
        sectionId,
        tableNumber: `T-TEST-${Date.now()}-2`,
        capacity: 6,
        shape: TableShape.RECTANGLE,
        sortOrder: 2,
      });
      expect(table2).toBeDefined();
      expect(table2.status).toBe(TableStatus.AVAILABLE);
      table2Id = table2.id;
    });

    it('lists tables with live status and section groupings', async () => {
      const listUseCase = new ListTablesUseCase();
      const result = await listUseCase.execute(branchId);

      expect(result.sections.length).toBeGreaterThan(0);
      const foundTable1 = result.tables.find((t) => t.id === table1Id);
      expect(foundTable1).toBeDefined();
      expect(foundTable1?.status).toBe(TableStatus.AVAILABLE);
    });

    it('opens an active tab on a table (Table becomes OCCUPIED)', async () => {
      const openTabUseCase = new OpenTableTabUseCase();

      const result = await openTabUseCase.execute({
        branchId,
        tableId: table1Id,
        cashShiftId,
        cashierId,
        guestCount: 3,
        items: [
          {
            productId,
            sizeId,
            modifierIds: [],
            quantity: 2, // 2x 15000 = 30000
          },
        ],
      });

      expect(result.order).toBeDefined();
      expect(result.order.isTabOpen).toBe(true);
      expect(result.order.subtotalMinor).toBe(unitPrice * 2);
      expect(result.table.status).toBe(TableStatus.OCCUPIED);
      expect(result.table.activeOrderId).toBe(result.order.id);
    });

    it('adds extra rounds of dishes to the open tab', async () => {
      const table1 = await prisma.diningTable.findUnique({ where: { id: table1Id } });
      expect(table1?.activeOrderId).toBeDefined();

      const addItemsUseCase = new AddItemsToTabUseCase();
      const updatedOrder = await addItemsUseCase.execute({
        orderId: table1!.activeOrderId!,
        items: [
          {
            productId,
            sizeId,
            modifierIds: [],
            quantity: 1, // +unitPrice -> unitPrice * 3
          },
        ],
      });

      expect(updatedOrder.subtotalMinor).toBe(unitPrice * 3);
      expect(updatedOrder.items.length).toBe(2);
    });

    it('transfers active tab from Table 1 to Table 2 atomically', async () => {
      const transferUseCase = new TransferTableUseCase();

      const transferResult = await transferUseCase.execute({
        fromTableId: table1Id,
        toTableId: table2Id,
      });

      expect(transferResult.fromTable.status).toBe(TableStatus.AVAILABLE);
      expect(transferResult.fromTable.activeOrderId).toBeNull();

      expect(transferResult.toTable.status).toBe(TableStatus.OCCUPIED);
      expect(transferResult.toTable.activeOrderId).toBe(transferResult.order.id);
      expect(transferResult.order.tableId).toBe(table2Id);
    });

    it('prints guest bill and transitions table to BILL_PRINTED', async () => {
      const printBillUseCase = new PrintTableBillUseCase();

      const billResult = await printBillUseCase.execute({
        tableId: table2Id,
      });

      expect(billResult.billHeader.tableNumber).toBeDefined();
      expect(billResult.pricing.subtotalMinor).toBe(unitPrice * 3);

      const table2 = await prisma.diningTable.findUnique({ where: { id: table2Id } });
      expect(table2?.status).toBe(TableStatus.BILL_PRINTED);
    });

    it('closes and settles the tab with split payments (freed to AVAILABLE)', async () => {
      const table2 = await prisma.diningTable.findUnique({ where: { id: table2Id } });
      const order = await prisma.order.findUnique({ where: { id: table2!.activeOrderId! } });
      expect(order).toBeDefined();

      const closeTabUseCase = new CloseTableTabUseCase();
      const totalToPay = order!.totalMinor;

      // Settle using split payment: half cash, half card
      const half1 = Math.floor(totalToPay / 2);
      const half2 = totalToPay - half1;

      const settledResult = await closeTabUseCase.execute({
        orderId: order!.id,
        tableId: table2Id,
        cashShiftId,
        cashierId,
        paymentMethod: 'MIXED',
        payments: [
          { method: 'CASH', amountMinor: half1 },
          { method: 'CARD', amountMinor: half2 },
        ],
      });

      expect(settledResult.order.isTabOpen).toBe(false);
      expect(settledResult.order.paymentStatus).toBe('PAID');
      expect(settledResult.table.status).toBe(TableStatus.AVAILABLE);
      expect(settledResult.table.activeOrderId).toBeNull();

      // Verify payments recorded in DB
      const payments = await prisma.orderPayment.findMany({
        where: { orderId: order!.id },
      });
      expect(payments).toHaveLength(2);
      expect(payments[0].amountMinor + payments[1].amountMinor).toBe(totalToPay);
    });
  });
});
