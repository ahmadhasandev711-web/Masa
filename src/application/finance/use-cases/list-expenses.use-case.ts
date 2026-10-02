import { FinanceRepository, ExpenseListItem } from '../../../domain/finance/contracts/finance.repository';
import { ExpenseSource } from '../../../domain/finance/enums';

export class ListExpensesUseCase {
  constructor(private readonly financeRepo: FinanceRepository) {}

  public async execute(params: {
    branchId: string;
    categoryId?: string;
    source?: ExpenseSource;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
  }): Promise<ExpenseListItem[]> {
    return this.financeRepo.listExpenses(params);
  }
}
