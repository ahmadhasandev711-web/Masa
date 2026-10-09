import { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma';
import { PosRepository, PosScope, PosShift, PosShiftClose, PosTransaction } from '../../domain/pos/contracts/pos.repository';
import { CashShiftStatus } from '../../domain/pos/enums';
import { ConflictError, ValidationError } from '../../domain/shared/errors/domain-error';
import { Money } from '../../domain/shared/value-objects/money';
import { OrderSource, PaymentMethod } from '../../domain/ordering/enums';
import { PrismaPosTransaction } from './prisma-pos-transaction';
import { mapPosReceipt, posReceiptInclude } from './prisma-pos.mapper';

export class PrismaPosRepository implements PosRepository {
  public transaction<T>(work: (transaction: PosTransaction) => Promise<T>): Promise<T> {
    return prisma.$transaction((client) => work(new PrismaPosTransaction(client)), { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
  }
  public getSettings() { return new PrismaPosTransaction(prisma).getSettings(); }
  public async getActiveShift(cashierId: string): Promise<PosShift | null> {
    const shift = await prisma.cashShift.findFirst({ where: { cashierId, status: CashShiftStatus.OPEN }, orderBy: { openedAt: 'desc' } });
    if (!shift) return null;
    const settings = await this.getSettings();
    return { id: shift.id, branchId: shift.branchId, currency: shift.currency ?? settings.currency, openingCashMinor: shift.openingCashMinor, openedAt: shift.openedAt.toISOString() };
  }
  public async openShift(branchId: string, cashierId: string, openingCashMinor: number): Promise<PosShift> {
    return prisma.$transaction(async (client) => {
      await client.$queryRaw(Prisma.sql`SELECT id FROM users WHERE id = ${cashierId} FOR UPDATE`);
      const existing = await client.cashShift.findFirst({ where: { cashierId, status: CashShiftStatus.OPEN } });
      if (existing) throw new ConflictError('لديك وردية مفتوحة؛ أغلقها قبل فتح وردية جديدة');
      const settings = await new PrismaPosTransaction(client).getSettings();
      const shift = await client.cashShift.create({ data: { branchId, cashierId, openingCashMinor, currency: settings.currency, status: CashShiftStatus.OPEN } });
      return { id: shift.id, branchId, currency: settings.currency, openingCashMinor, openedAt: shift.openedAt.toISOString() };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
  }
  public async closeShift(branchId: string, cashierId: string, shiftId: string, closingCashMinor: number): Promise<PosShiftClose> {
    return prisma.$transaction(async (client) => {
      const transaction = new PrismaPosTransaction(client);
      await transaction.lockShift(shiftId, { branchId, cashierId, canDiscount: false }, false);
      const openTabsCount = await client.order.count({
        where: {
          cashShiftId: shiftId,
          isTabOpen: true,
        },
      });
      if (openTabsCount > 0) {
        throw new ValidationError(
          `لا يمكن إغلاق الوردية: توجد (${openTabsCount}) طاولات مفتوحة لم يتم تسوية شيكاتها بعد. يرجى إغلاق حساب الطاولات أولاً.`
        );
      }
      const shift = await client.cashShift.findUniqueOrThrow({ where: { id: shiftId } });
      const settings = await transaction.getSettings();
      const [cash, movements, expenses] = await Promise.all([
        client.orderPayment.aggregate({ where: { method: PaymentMethod.CASH, order: { cashShiftId: shiftId, source: OrderSource.POS } }, _sum: { amountMinor: true } }),
        client.cashShiftMovement.findMany({ where: { cashShiftId: shiftId } }),
        client.expense.aggregate({ where: { cashShiftId: shiftId }, _sum: { amountMinor: true } }),
      ]);
      const currency = shift.currency ?? settings.currency;
      let cashInMinor = 0;
      let cashDropMinor = 0;
      for (const m of movements) {
        if (m.type === 'CASH_IN') cashInMinor += m.amountMinor;
        else if (m.type === 'CASH_DROP') cashDropMinor += m.amountMinor;
      }
      const registerExpensesMinor = expenses._sum.amountMinor ?? 0;
      const expected = Money.fromMinor(shift.openingCashMinor, currency)
        .add(Money.fromMinor(cash._sum.amountMinor ?? 0, currency))
        .add(Money.fromMinor(cashInMinor, currency))
        .subtract(Money.fromMinor(cashDropMinor, currency))
        .subtract(Money.fromMinor(registerExpensesMinor, currency));
      const counted = Money.fromMinor(closingCashMinor, currency);
      const variance = counted.subtract(expected);
      await client.cashShift.update({
        where: { id: shiftId },
        data: {
          status: CashShiftStatus.CLOSED,
          closingCashMinor,
          expectedCashMinor: expected.amount,
          varianceMinor: variance.amount,
          closedAt: new Date(),
        },
      });
      return { expectedCashMinor: expected.amount, closingCashMinor, varianceMinor: variance.amount };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
  }
  public async getCatalog(branchId: string) {
    const products = await new PrismaPosTransaction(prisma).getProducts(branchId, (await prisma.product.findMany({ where: { isActive: true }, select: { id: true } })).map((product) => product.id));
    const categories = await prisma.category.findMany({ where: { isActive: true }, select: { id: true, nameAr: true }, orderBy: { sortOrder: 'asc' } });
    return categories.map((category) => ({ ...category, products: products.filter((product) => product.categoryId === category.id && product.sizes.length > 0) })).filter((category) => category.products.length > 0);
  }
  public async recentReceipts(scope: PosScope) {
    const [settings, orders] = await Promise.all([this.getSettings(), prisma.order.findMany({
      where: { source: OrderSource.POS, branchId: scope.branchId, cashierId: scope.cashierId },
      take: 20, orderBy: { createdAt: 'desc' }, include: posReceiptInclude,
    })]);
    return orders.map((order) => mapPosReceipt(order, settings.currency, settings.locale));
  }
}
