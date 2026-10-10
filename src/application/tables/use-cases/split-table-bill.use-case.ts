import { prisma } from '../../../infrastructure/db/prisma';
import { NotFoundError } from '../../../domain/shared/errors/domain-error';
import { Money } from '../../../domain/shared/value-objects/money';
import { SplitBillService } from '../../../domain/tables/services/split-bill.service';
import { SplitBillEqualDto, splitBillEqualSchema } from '../dto/table.dto';

export interface SplitBillEqualResult {
  totalMinor: number;
  splits: Array<{
    partIndex: number;
    amountMinor: number;
  }>;
}

export class SplitTableBillUseCase {
  public async execute(dto: SplitBillEqualDto): Promise<SplitBillEqualResult> {
    const validated = splitBillEqualSchema.parse(dto);

    const order = await prisma.order.findUnique({
      where: { id: validated.orderId },
      select: {
        id: true,
        totalMinor: true,
        currency: true,
      },
    });

    if (!order) {
      throw new NotFoundError('الطلب', validated.orderId);
    }

    const total = Money.fromMinor(order.totalMinor, order.currency ?? 'EGP');
    const splits = SplitBillService.splitEqually(total, validated.splitCount);

    return {
      totalMinor: order.totalMinor,
      splits: splits.map((part, index) => ({
        partIndex: index + 1,
        amountMinor: part.amount,
      })),
    };
  }
}
