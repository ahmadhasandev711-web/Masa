import { ValidationError } from '../errors/domain-error';

/**
 * Value Object representing an immutable monetary amount in minor units (e.g. Halalas, Cents, Piastres).
 * Floating point arithmetic is strictly forbidden in financial calculations.
 *
 * Adheres strictly to GR-1.1, GR-8, and Zero-Hardcoding rules:
 * - Currency is mandatory and explicitly provided from domain/application context (e.g. RestaurantSettings).
 * - No implicit defaults (no hardcoded EGP, SAR, or USD).
 * - Format locale must be explicitly provided.
 */
export class Money {
  public readonly amount: number;
  public readonly currency: string;

  private constructor(amountInMinorUnits: number, currency: string) {
    if (!Number.isSafeInteger(amountInMinorUnits)) {
      throw new ValidationError(`Money amount must be an integer minor unit. Received: ${amountInMinorUnits}`);
    }
    if (!currency || typeof currency !== 'string' || !/^[A-Z]{3}$/.test(currency.trim().toUpperCase())) {
      throw new ValidationError(`Currency must be a valid 3-letter ISO code. Received: '${currency}'`);
    }

    this.amount = amountInMinorUnits;
    this.currency = currency.trim().toUpperCase();
    Object.freeze(this);
  }

  /**
   * Factory method to create Money from minor units. Currency is strictly required.
   */
  public static fromMinor(amountInMinorUnits: number, currency: string): Money {
    return new Money(amountInMinorUnits, currency);
  }

  /**
   * Factory method to create Money from major units. Currency is strictly required.
   * Safely rounds to the nearest integer minor unit.
   */
  public static fromMajor(amountInMajorUnits: number, currency: string): Money {
    if (typeof amountInMajorUnits !== 'number' || Number.isNaN(amountInMajorUnits)) {
      throw new ValidationError(`Invalid major amount: ${amountInMajorUnits}`);
    }
    const minorUnits = Math.round(amountInMajorUnits * 100);
    return new Money(minorUnits, currency);
  }

  /**
   * Returns a Money object representing zero. Currency is strictly required.
   */
  public static zero(currency: string): Money {
    return new Money(0, currency);
  }

  public static fromDecimal(value: string, currency: string): Money {
    const normalized = value.trim().replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit))).replace('٫', '.');
    if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
      throw new ValidationError('أدخل مبلغاً صحيحاً بمنزلتين عشريتين كحد أقصى');
    }
    const [whole, fraction = ''] = normalized.split('.');
    return new Money(Number(BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, '0'))), currency);
  }

  public percentage(rate: string): Money {
    const basisPoints = Money.fromDecimal(rate, this.currency).amount;
    const numerator = BigInt(this.amount) * BigInt(basisPoints);
    return new Money(Number((numerator + BigInt(5000)) / BigInt(10000)), this.currency);
  }

  /**
   * Adds another Money instance. Currencies must match.
   */
  public add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amount + other.amount, this.currency);
  }

  /**
   * Subtracts another Money instance. Currencies must match.
   */
  public subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amount - other.amount, this.currency);
  }

  /**
   * Multiplies the amount by a factor (e.g., quantity or tax rate).
   * Rounds result to nearest integer minor unit.
   */
  public multiply(factor: number): Money {
    if (typeof factor !== 'number' || Number.isNaN(factor)) {
      throw new ValidationError(`Invalid multiplication factor: ${factor}`);
    }
    const newAmount = Math.round(this.amount * factor);
    return new Money(newAmount, this.currency);
  }

  /**
   * Allocates the amount proportionally across a list of ratios without losing remainder units (Hare-Niemeyer method).
   * Useful for discounts, tax splitting, and commission apportionment.
   */
  public allocate(ratios: number[]): Money[] {
    if (!ratios.length || ratios.some((r) => r < 0)) {
      throw new ValidationError('Allocation ratios must be non-empty and non-negative numbers');
    }

    const totalRatio = ratios.reduce((sum, r) => sum + r, 0);
    if (totalRatio === 0) {
      throw new ValidationError('Total ratio cannot be zero');
    }

    let remainder = this.amount;
    const results: number[] = [];

    for (const ratio of ratios) {
      const share = Math.floor((this.amount * ratio) / totalRatio);
      results.push(share);
      remainder -= share;
    }

    // Distribute remainder 1 unit at a time to the highest fractional remainder
    const fractions = ratios.map((ratio, index) => ({
      index,
      fraction: (this.amount * ratio) / totalRatio - results[index],
    }));

    fractions.sort((a, b) => b.fraction - a.fraction);

    for (let i = 0; i < remainder; i++) {
      results[fractions[i].index]++;
    }

    return results.map((share) => new Money(share, this.currency));
  }

  public equals(other: Money): boolean {
    return this.currency === other.currency && this.amount === other.amount;
  }

  public isGreaterThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.amount > other.amount;
  }

  public isGreaterThanOrEqual(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.amount >= other.amount;
  }

  public isLessThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.amount < other.amount;
  }

  public isLessThanOrEqual(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.amount <= other.amount;
  }

  public isZero(): boolean {
    return this.amount === 0;
  }

  public isPositive(): boolean {
    return this.amount > 0;
  }

  public isNegative(): boolean {
    return this.amount < 0;
  }

  /**
   * Returns the amount in major units (e.g. 1050 -> 10.50).
   */
  public toMajor(): number {
    return this.amount / 100;
  }

  /**
   * Formats the monetary amount for human display according to the explicitly provided locale.
   */
  public format(locale: string): string {
    if (!locale || typeof locale !== 'string') {
      throw new ValidationError('Formatting requires an explicit locale');
    }
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: this.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(this.toMajor());
  }

  public toJSON(): { amount: number; currency: string; major: number } {
    return {
      amount: this.amount,
      currency: this.currency,
      major: this.toMajor(),
    };
  }

  public assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new ValidationError(
        `Cannot perform currency operations between mismatched currencies: ${this.currency} and ${other.currency}`
      );
    }
  }
}
