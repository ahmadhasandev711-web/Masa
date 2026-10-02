import { FinanceRepository, CashShiftListItem } from '../../../domain/finance/contracts/finance.repository';
import { CashShiftStatus } from '../../../domain/finance/enums';

export class ListCashShiftsUseCase {
  constructor(private readonly financeRepo: FinanceRepository) {}

  public async execute(params: {
    branchId: string;
    status?: CashShiftStatus;
    cashierId?: string;
    limit?: number;
  }): Promise<CashShiftListItem[]> {
    return this.financeRepo.listShifts(params);
  }
}
