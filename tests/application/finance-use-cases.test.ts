import { describe, it, expect, beforeEach } from 'vitest';
import {
  FinanceRepository,
  CashShiftDetail,
  ShiftMovementRecord,
  ExpenseListItem,
  ProfitAndLossReport,
  CashShiftListItem,
  ExpenseCategoryItem,
} from '../../src/domain/finance/contracts/finance.repository';
import { CashMovementType, ExpenseSource, CashShiftStatus } from '../../src/domain/finance/enums';
import { RecordCashMovementUseCase } from '../../src/application/finance/use-cases/record-cash-movement.use-case';
import { BlindCloseCashShiftUseCase } from '../../src/application/finance/use-cases/blind-close-cash-shift.use-case';
import { AuditCashShiftUseCase } from '../../src/application/finance/use-cases/audit-cash-shift.use-case';
import { CreateExpenseUseCase } from '../../src/application/finance/use-cases/create-expense.use-case';
import { GetProfitAndLossUseCase } from '../../src/application/finance/use-cases/get-profit-and-loss.use-case';

class MockFinanceRepository implements FinanceRepository {
  public recordedMovementResult: ShiftMovementRecord | null = null;
  public blindCloseResult: CashShiftDetail | null = null;
  public auditShiftResult: CashShiftDetail | null = null;
  public createExpenseResult: ExpenseListItem | null = null;
  public profitAndLossResult: ProfitAndLossReport | null = null;

  public lastRecordedMovementParams: Parameters<FinanceRepository['recordMovement']>[0] | null = null;
  public lastBlindCloseParams: Parameters<FinanceRepository['blindCloseShift']>[0] | null = null;
  public lastAuditParams: Parameters<FinanceRepository['auditShift']>[0] | null = null;
  public lastCreateExpenseParams: Parameters<FinanceRepository['createExpense']>[0] | null = null;
  public lastProfitAndLossParams: Parameters<FinanceRepository['getProfitAndLoss']>[0] | null = null;

  async listShifts(): Promise<CashShiftListItem[]> {
    return [];
  }
  async getShiftDetails(): Promise<CashShiftDetail | null> {
    return null;
  }
  async getActiveShift(): Promise<CashShiftDetail | null> {
    return null;
  }
  async recordMovement(params: Parameters<FinanceRepository['recordMovement']>[0]): Promise<ShiftMovementRecord> {
    this.lastRecordedMovementParams = params;
    return this.recordedMovementResult!;
  }
  async blindCloseShift(params: Parameters<FinanceRepository['blindCloseShift']>[0]): Promise<CashShiftDetail> {
    this.lastBlindCloseParams = params;
    return this.blindCloseResult!;
  }
  async auditShift(params: Parameters<FinanceRepository['auditShift']>[0]): Promise<CashShiftDetail> {
    this.lastAuditParams = params;
    return this.auditShiftResult!;
  }
  async listExpenses(): Promise<ExpenseListItem[]> {
    return [];
  }
  async createExpense(params: Parameters<FinanceRepository['createExpense']>[0]): Promise<ExpenseListItem> {
    this.lastCreateExpenseParams = params;
    return this.createExpenseResult!;
  }
  async listCategories(): Promise<ExpenseCategoryItem[]> {
    return [];
  }
  async getProfitAndLoss(params: Parameters<FinanceRepository['getProfitAndLoss']>[0]): Promise<ProfitAndLossReport> {
    this.lastProfitAndLossParams = params;
    return this.profitAndLossResult!;
  }
}

describe('Finance Application Use Cases (GR-7.1 & GR-3.1)', () => {
  let mockFinanceRepo: MockFinanceRepository;

  beforeEach(() => {
    mockFinanceRepo = new MockFinanceRepository();
  });

  describe('RecordCashMovementUseCase', () => {
    it('successfully records a cash-in movement when input is valid', async () => {
      const mockResult: ShiftMovementRecord = {
        id: 'mov-1',
        type: CashMovementType.CASH_IN,
        amountMinor: 20000,
        reason: 'تغذية فكة صباحية للدرج',
        performedByName: 'كاشير الفرع',
        createdAt: new Date().toISOString(),
      };
      mockFinanceRepo.recordedMovementResult = mockResult;

      const useCase = new RecordCashMovementUseCase(mockFinanceRepo);
      const res = await useCase.execute(
        {
          shiftId: 'shift-101',
          branchId: 'branch-1',
          type: CashMovementType.CASH_IN,
          amountMinor: 20000,
          reason: 'تغذية فكة صباحية للدرج',
        },
        'user-1'
      );

      expect(res.id).toBe('mov-1');
      expect(mockFinanceRepo.lastRecordedMovementParams).toEqual({
        shiftId: 'shift-101',
        branchId: 'branch-1',
        type: CashMovementType.CASH_IN,
        amountMinor: 20000,
        reason: 'تغذية فكة صباحية للدرج',
        performedById: 'user-1',
      });
    });

    it('rejects invalid or non-positive amounts with ValidationError', async () => {
      const useCase = new RecordCashMovementUseCase(mockFinanceRepo);

      await expect(
        useCase.execute(
          {
            shiftId: 'shift-101',
            branchId: 'branch-1',
            type: CashMovementType.CASH_IN,
            amountMinor: -500,
            reason: 'تغذية غير صالحة',
          },
          'user-1'
        )
      ).rejects.toThrow();
    });
  });

  describe('BlindCloseCashShiftUseCase', () => {
    it('delegates counted physical cash to repository for variance calculation', async () => {
      const mockDetail: CashShiftDetail = {
        id: 'shift-1',
        branchId: 'branch-1',
        branchNameAr: 'الفرع الرئيسي',
        cashierId: 'user-1',
        cashierName: 'كاشير 1',
        status: CashShiftStatus.CLOSED,
        currency: 'EGP',
        openingCashMinor: 50000,
        closingCashMinor: 150000,
        expectedCashMinor: 150000,
        varianceMinor: 0,
        varianceReason: null,
        openedAt: new Date().toISOString(),
        closedAt: new Date().toISOString(),
        approvedByName: null,
        approvedAt: null,
        totalOrdersCount: 15,
        totalSalesMinor: 100000,
        cashSalesMinor: 100000,
        cardSalesMinor: 0,
        cashInMinor: 0,
        cashDropMinor: 0,
        registerExpensesMinor: 0,
        movements: [],
        drawerExpenses: [],
      };
      mockFinanceRepo.blindCloseResult = mockDetail;

      const useCase = new BlindCloseCashShiftUseCase(mockFinanceRepo);
      const res = await useCase.execute(
        {
          shiftId: 'shift-1',
          branchId: 'branch-1',
          countedCashMinor: 150000,
          varianceReason: 'مطابق تماماً',
        },
        'user-1'
      );

      expect(res.status).toBe(CashShiftStatus.CLOSED);
      expect(res.varianceMinor).toBe(0);
      expect(mockFinanceRepo.lastBlindCloseParams).toEqual({
        shiftId: 'shift-1',
        branchId: 'branch-1',
        cashierId: 'user-1',
        countedCashMinor: 150000,
        varianceReason: 'مطابق تماماً',
      });
    });
  });

  describe('AuditCashShiftUseCase', () => {
    it('allows manager to audit and approve a closed shift with audit notes', async () => {
      const mockDetail: CashShiftDetail = {
        id: 'shift-1',
        branchId: 'branch-1',
        branchNameAr: 'الفرع الرئيسي',
        cashierId: 'user-1',
        cashierName: 'كاشير 1',
        status: CashShiftStatus.AUDITED,
        currency: 'EGP',
        openingCashMinor: 50000,
        closingCashMinor: 148000,
        expectedCashMinor: 150000,
        varianceMinor: -2000,
        varianceReason: 'عجز بسيط | ملاحظة المدير: تم خصمه من عهدة الكاشير',
        openedAt: new Date().toISOString(),
        closedAt: new Date().toISOString(),
        approvedByName: 'مدير الفرع',
        approvedAt: new Date().toISOString(),
        totalOrdersCount: 15,
        totalSalesMinor: 100000,
        cashSalesMinor: 100000,
        cardSalesMinor: 0,
        cashInMinor: 0,
        cashDropMinor: 0,
        registerExpensesMinor: 0,
        movements: [],
        drawerExpenses: [],
      };
      mockFinanceRepo.auditShiftResult = mockDetail;

      const useCase = new AuditCashShiftUseCase(mockFinanceRepo);
      const res = await useCase.execute(
        {
          shiftId: 'shift-1',
          branchId: 'branch-1',
          notes: 'تم خصمه من عهدة الكاشير',
        },
        'manager-1'
      );

      expect(res.status).toBe(CashShiftStatus.AUDITED);
      expect(mockFinanceRepo.lastAuditParams).toEqual({
        shiftId: 'shift-1',
        branchId: 'branch-1',
        approverId: 'manager-1',
        notes: 'تم خصمه من عهدة الكاشير',
      });
    });
  });

  describe('CreateExpenseUseCase', () => {
    it('creates an expense and links drawer source correctly', async () => {
      const mockExpense: ExpenseListItem = {
        id: 'exp-1',
        branchId: 'branch-1',
        branchNameAr: 'الفرع الرئيسي',
        categoryId: 'cat-1',
        categoryNameAr: 'نثريات وضيافة',
        categoryNameEn: 'Petty',
        amountMinor: 7500,
        currency: 'EGP',
        source: ExpenseSource.REGISTER_CASH,
        description: 'شراء قهوة وضيافة للفرع',
        receiptNumber: 'REC-001',
        spentById: 'user-1',
        spentByName: 'محمد علي',
        approvedById: null,
        approvedByName: null,
        cashShiftId: 'shift-1',
        createdAt: new Date().toISOString(),
      };
      mockFinanceRepo.createExpenseResult = mockExpense;

      const useCase = new CreateExpenseUseCase(mockFinanceRepo);
      const res = await useCase.execute(
        {
          branchId: 'branch-1',
          categoryId: 'cat-1',
          amountMinor: 7500,
          source: ExpenseSource.REGISTER_CASH,
          description: 'شراء قهوة وضيافة للفرع',
          receiptNumber: 'REC-001',
          cashShiftId: 'shift-1',
        },
        'user-1',
        'EGP'
      );

      expect(res.id).toBe('exp-1');
      expect(res.source).toBe(ExpenseSource.REGISTER_CASH);
      expect(mockFinanceRepo.lastCreateExpenseParams).toEqual({
        branchId: 'branch-1',
        categoryId: 'cat-1',
        amountMinor: 7500,
        currency: 'EGP',
        source: ExpenseSource.REGISTER_CASH,
        description: 'شراء قهوة وضيافة للفرع',
        receiptNumber: 'REC-001',
        spentById: 'user-1',
        cashShiftId: 'shift-1',
      });
    });
  });

  describe('GetProfitAndLossUseCase', () => {
    it('parses dates and forwards to repository', async () => {
      const mockReport: ProfitAndLossReport = {
        currency: 'EGP',
        currencySymbol: 'ج.م',
        fromDate: '2026-09-01',
        toDate: '2026-09-30',
        totalOrdersCount: 200,
        netSalesMinor: 5000000,
        cogsMinor: 1750000,
        operatingExpensesMinor: 450000,
        grossProfitMinor: 3250000,
        operatingProfitMinor: 2800000,
        cogsPercent: 35.0,
        grossMarginPercent: 65.0,
        operatingMarginPercent: 56.0,
        expensesByCategory: [],
        dailyBreakdown: [],
      };
      mockFinanceRepo.profitAndLossResult = mockReport;

      const useCase = new GetProfitAndLossUseCase(mockFinanceRepo);
      const res = await useCase.execute({
        branchId: 'branch-1',
        fromDate: '2026-09-01',
        toDate: '2026-09-30',
      });

      expect(res.netSalesMinor).toBe(5000000);
      expect(mockFinanceRepo.lastProfitAndLossParams).toBeDefined();
    });
  });
});
