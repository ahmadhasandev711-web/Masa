import { FinanceRepository, ProfitAndLossReport } from '../../../domain/finance/contracts/finance.repository';
import { ProfitAndLossFilterDto, ProfitAndLossFilterSchema } from '../dto/finance.dto';

export class GetProfitAndLossUseCase {
  constructor(private readonly financeRepo: FinanceRepository) {}

  public async execute(filter: ProfitAndLossFilterDto): Promise<ProfitAndLossReport> {
    const validated = ProfitAndLossFilterSchema.parse(filter);

    let fromDate: Date;
    let toDate: Date;

    if (validated.fromDate && validated.toDate) {
      fromDate = new Date(validated.fromDate);
      fromDate.setHours(0, 0, 0, 0);
      toDate = new Date(validated.toDate);
      toDate.setHours(23, 59, 59, 999);
    } else {
      // Default to current month
      const now = new Date();
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      toDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    return this.financeRepo.getProfitAndLoss({
      branchId: validated.branchId,
      fromDate,
      toDate,
    });
  }
}
