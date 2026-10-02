import { FinanceRepository, CashShiftDetail } from '../../../domain/finance/contracts/finance.repository';
import { BlindCloseCashShiftDto, BlindCloseCashShiftSchema } from '../dto/finance.dto';

export class BlindCloseCashShiftUseCase {
  constructor(private readonly financeRepo: FinanceRepository) {}

  public async execute(dto: BlindCloseCashShiftDto, cashierId: string): Promise<CashShiftDetail> {
    const validated = BlindCloseCashShiftSchema.parse(dto);

    return this.financeRepo.blindCloseShift({
      shiftId: validated.shiftId,
      branchId: validated.branchId,
      cashierId,
      countedCashMinor: validated.countedCashMinor,
      varianceReason: validated.varianceReason,
    });
  }
}
