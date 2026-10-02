import { FinanceRepository, ExpenseCategoryItem } from '../../../domain/finance/contracts/finance.repository';

export class ListExpenseCategoriesUseCase {
  constructor(private readonly financeRepo: FinanceRepository) {}

  public async execute(): Promise<ExpenseCategoryItem[]> {
    return this.financeRepo.listCategories();
  }
}
