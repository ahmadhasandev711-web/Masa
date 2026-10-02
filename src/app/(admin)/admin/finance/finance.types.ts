import {
  CashShiftListItem,
  CashShiftDetail,
  ExpenseListItem,
  ExpenseCategoryItem,
  ProfitAndLossReport,
} from '../../../../domain/finance/contracts/finance.repository';

export interface FinancePageData {
  branchId: string;
  allowedBranches: { id: string; nameAr: string }[];
  currency: string;
  currencySymbol: string;
  shifts: CashShiftListItem[];
  expenses: ExpenseListItem[];
  categories: ExpenseCategoryItem[];
  report: ProfitAndLossReport;
  activeShift: CashShiftDetail | null;
}
