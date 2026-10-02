import { Money } from '../../shared/value-objects/money';
import { ValidationError } from '../../shared/errors/domain-error';
import { PosPayment } from '../contracts/pos.repository';
import { PosPaymentMode } from '../enums';
import { PaymentMethod } from '../../ordering/enums';

interface Settlement { payments: PosPayment[]; change: Money }
export interface PosSettlementStrategy { calculate(total: Money, cash: Money): Settlement }

class CardSettlementStrategy implements PosSettlementStrategy {
  public calculate(total: Money): Settlement {
    return { payments: [{ method: PaymentMethod.CARD, amountMinor: total.amount }], change: Money.zero(total.currency) };
  }
}
class CashSettlementStrategy implements PosSettlementStrategy {
  public calculate(total: Money, cash: Money): Settlement {
    if (cash.amount < total.amount) throw new ValidationError('المبلغ المستلم أقل من إجمالي الفاتورة');
    return { payments: [{ method: PaymentMethod.CASH, amountMinor: total.amount }], change: cash.subtract(total) };
  }
}
class MixedSettlementStrategy implements PosSettlementStrategy {
  public calculate(total: Money, cash: Money): Settlement {
    if (cash.amount <= 0 || cash.amount >= total.amount) throw new ValidationError('الجزء النقدي يجب أن يكون أكبر من صفر وأقل من الإجمالي');
    return { payments: [{ method: PaymentMethod.CASH, amountMinor: cash.amount },
      { method: PaymentMethod.CARD, amountMinor: total.subtract(cash).amount }], change: Money.zero(total.currency) };
  }
}
export class PosSettlementService {
  private static readonly strategies = new Map<PosPaymentMode, PosSettlementStrategy>([
    [PosPaymentMode.CASH, new CashSettlementStrategy()],
    [PosPaymentMode.CARD, new CardSettlementStrategy()],
    [PosPaymentMode.MIXED, new MixedSettlementStrategy()],
  ]);
  public static register(mode: PosPaymentMode, strategy: PosSettlementStrategy): void {
    this.strategies.set(mode, strategy);
  }
  public static payments(mode: PosPaymentMode, total: Money, cash: Money): Settlement {
    total.assertSameCurrency(cash);
    const strategy = this.strategies.get(mode);
    if (!strategy) throw new ValidationError('طريقة الدفع غير مدعومة');
    return strategy.calculate(total, cash);
  }
}
