import { FinanceRepository, CashShiftDetail } from '../../../domain/finance/contracts/finance.repository';

export class GetCashShiftDetailsUseCase {
  constructor(private readonly financeRepo: FinanceRepository) {}

  public async execute(shiftId: string, branchId?: string): Promise<CashShiftDetail | null> {
    return this.financeRepo.getShiftDetails(shiftId, branchId);
  }
}
