import { FinanceRepository, ShiftMovementRecord } from '../../../domain/finance/contracts/finance.repository';
import { RecordCashMovementDto, RecordCashMovementSchema } from '../dto/finance.dto';
import { CashShiftCalculatorService } from '../../../domain/finance/services/cash-shift-calculator.service';

export class RecordCashMovementUseCase {
  constructor(private readonly financeRepo: FinanceRepository) {}

  public async execute(dto: RecordCashMovementDto, performedById: string): Promise<ShiftMovementRecord> {
    const validated = RecordCashMovementSchema.parse(dto);
    CashShiftCalculatorService.validateMovement(validated.amountMinor, validated.reason);

    return this.financeRepo.recordMovement({
      shiftId: validated.shiftId,
      branchId: validated.branchId,
      type: validated.type,
      amountMinor: validated.amountMinor,
      reason: validated.reason,
      performedById,
    });
  }
}
