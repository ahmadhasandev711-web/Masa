import { ValidationError } from '../../shared/errors/domain-error';

/**
 * PhoneNumber Value Object.
 * Enforces E.164 standardization, handles Arabic-Indic numeral conversion,
 * and normalizes local prefixes (e.g. Egypt 01x -> +201x).
 */
export class PhoneNumber {
  private readonly normalized: string;

  private constructor(value: string) {
    this.normalized = value;
  }

  public static fromString(rawPhone: string, defaultCountryPrefix = '20'): PhoneNumber {
    if (!rawPhone || typeof rawPhone !== 'string') {
      throw new ValidationError('رقم الهاتف مطلوب');
    }

    const cleaned = PhoneNumber.normalizeRawString(rawPhone);
    const e164 = PhoneNumber.toE164(cleaned, defaultCountryPrefix);

    if (!PhoneNumber.isValidE164(e164)) {
      throw new ValidationError(`صيغة رقم الهاتف غير صالحة: ${rawPhone}`);
    }

    return new PhoneNumber(e164);
  }

  private static normalizeRawString(input: string): string {
    // 1. Convert Arabic-Indic digits to ASCII
    const arabicIndicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    let result = input.trim();
    for (let i = 0; i < 10; i++) {
      result = result.replaceAll(arabicIndicDigits[i], i.toString());
    }

    // 2. Remove all spaces, dashes, parentheses, dots
    result = result.replace(/[\s\-\(\)\.]/g, '');

    return result;
  }

  private static toE164(cleaned: string, defaultCountryPrefix: string): string {
    // If starts with 00, replace with +
    if (cleaned.startsWith('00')) {
      return `+${cleaned.slice(2)}`;
    }

    // If starts with +, it already has international indicator
    if (cleaned.startsWith('+')) {
      return cleaned;
    }

    // Egyptian mobile standard handling (010, 011, 012, 015 - 11 digits)
    if (defaultCountryPrefix === '20') {
      if (/^01[0125]\d{8}$/.test(cleaned)) {
        return `+20${cleaned.slice(1)}`;
      }
      if (/^201[0125]\d{8}$/.test(cleaned)) {
        return `+${cleaned}`;
      }
    }

    // Fallback: if starts with 0, replace 0 with default country prefix
    if (cleaned.startsWith('0')) {
      return `+${defaultCountryPrefix}${cleaned.slice(1)}`;
    }

    // Otherwise prefix with +
    return `+${cleaned}`;
  }

  private static isValidE164(value: string): boolean {
    // E.164: + followed by 8 to 15 digits
    return /^\+[1-9]\d{7,14}$/.test(value);
  }

  public get value(): string {
    return this.normalized;
  }

  /**
   * Formats phone into local/national presentation for displays.
   * e.g. +201012345678 -> 010 1234 5678
   */
  public formatNational(): string {
    if (this.normalized.startsWith('+20') && this.normalized.length === 13) {
      const local = `0${this.normalized.slice(3)}`;
      return `${local.slice(0, 3)} ${local.slice(3, 7)} ${local.slice(7)}`;
    }
    return this.normalized;
  }

  /**
   * Formats phone into international presentation.
   * e.g. +201012345678 -> +20 10 1234 5678
   */
  public formatInternational(): string {
    if (this.normalized.startsWith('+20') && this.normalized.length === 13) {
      return `+20 ${this.normalized.slice(3, 5)} ${this.normalized.slice(5, 9)} ${this.normalized.slice(9)}`;
    }
    return this.normalized;
  }

  public equals(other: PhoneNumber): boolean {
    return this.normalized === other.normalized;
  }

  public toString(): string {
    return this.normalized;
  }
}
