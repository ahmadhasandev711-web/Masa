import { Money } from '../../shared/value-objects/money';
import { ValidationError } from '../../shared/errors/domain-error';

/**
 * SplitBillService (GR-1.1 & GR-8.2)
 * Pure domain service managing bill splitting without floating-point inaccuracies or lost pennies.
 */
export class SplitBillService {
  /**
   * Splits a total Money value equally into N parts.
   * Any remainder minor units are distributed to the first parts so the sum is exact.
   *
   * @param total The total Money object to split
   * @param splitCount Number of people (must be >= 1)
   * @returns Array of Money objects whose sum strictly equals total
   */
  public static splitEqually(total: Money, splitCount: number): Money[] {
    if (!Number.isInteger(splitCount) || splitCount <= 0) {
      throw new ValidationError('عدد الأشخاص للتقسيم يجب أن يكون عدداً صحيحاً أكبر من الصفر');
    }

    if (splitCount === 1) {
      return [total];
    }

    const totalMinor = total.amount;
    const baseMinor = Math.floor(totalMinor / splitCount);
    const remainder = totalMinor % splitCount;

    const result: Money[] = [];

    for (let i = 0; i < splitCount; i++) {
      // First 'remainder' parts receive +1 minor unit to absorb the remainder cleanly
      const amountForPart = i < remainder ? baseMinor + 1 : baseMinor;
      result.push(Money.fromMinor(amountForPart, total.currency));
    }

    // Safety verification: strict integer equality check
    const verifiedSum = result.reduce((sum, part) => sum + part.amount, 0);
    if (verifiedSum !== totalMinor) {
      throw new ValidationError('فشل حسابي في توزيع كسور الفاتورة بدقة');
    }

    return result;
  }

  /**
   * Validates whether a list of custom payment splits strictly covers the total amount.
   */
  public static validateCustomSplits(total: Money, splits: Money[]): boolean {
    if (!splits || splits.length === 0) return false;
    const sum = splits.reduce((acc, part) => acc + part.amount, 0);
    return sum === total.amount;
  }

  /**
   * Calculates the exact remaining unpaid balance on a bill.
   */
  public static calculateRemaining(total: Money, paidSplits: Money[]): Money {
    const totalPaidMinor = paidSplits.reduce((acc, part) => acc + part.amount, 0);
    const remainingMinor = Math.max(0, total.amount - totalPaidMinor);
    return Money.fromMinor(remainingMinor, total.currency);
  }
}
