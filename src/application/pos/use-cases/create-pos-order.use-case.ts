import { PosRepository, PosScope } from '../../../domain/pos/contracts/pos.repository';
import { ForbiddenError } from '../../../domain/shared/errors/domain-error';
import { PosSaleService } from '../../../domain/pos/services/pos-sale.service';
import { CreatePosOrderDto, createPosOrderSchema } from '../dto/pos.dto';

export class CreatePosOrderUseCase {
  constructor(private readonly repository: PosRepository) {}
  public async execute(input: CreatePosOrderDto, scope: PosScope) {
    const request = createPosOrderSchema.parse(input);
    if (request.branchId !== scope.branchId) throw new ForbiddenError();
    return this.repository.transaction(async (transaction) => {
      const replay = await transaction.findReplay(request.idempotencyKey);
      if (replay) { PosSaleService.assertReplay(replay, request, scope); return replay; }
      if (request.discountMinor > 0 && !scope.canDiscount) throw new ForbiddenError('لا تملك صلاحية تطبيق خصم');
      await transaction.lockShift(request.cashShiftId, scope);
      const concurrentReplay = await transaction.findReplay(request.idempotencyKey);
      if (concurrentReplay) { PosSaleService.assertReplay(concurrentReplay, request, scope); return concurrentReplay; }
      const settings = await transaction.getSettings();
      const products = await transaction.getProducts(scope.branchId, request.items.map((item) => item.productId));
      const lines = request.items.map((item) => PosSaleService.resolveLine(item, products, settings.currency));
      const totals = PosSaleService.price(lines, settings, request.discountMinor);
      PosSaleService.assertPayments(request, totals, settings.currency);
      return transaction.saveSale(request, scope, settings, totals, lines);
    });
  }
}
