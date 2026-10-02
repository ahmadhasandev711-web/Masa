import { FinanceRepository, CashShiftDetail } from '../../../domain/finance/contracts/finance.repository';
import { AuditShiftDto, AuditShiftSchema } from '../dto/finance.dto';

export class AuditCashShiftUseCase {
  constructor(private readonly financeRepo: FinanceRepository) {}

  public async execute(dto: AuditShiftDto, approverId: string): Promise<CashShiftDetail> {
    const validated = AuditShiftSchema.parse(dto);

    return this.financeRepo.auditShift({
      shiftId: validated.shiftId,
      branchId: validated.branchId,
      approverId,
      notes: validated.notes,
    });
  }
}
