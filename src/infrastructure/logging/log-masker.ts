/**
 * LogMasker protects Personally Identifiable Information (PII) from leaking into server logs,
 * adhering to GR-4.2 data protection mandates.
 */
export class LogMasker {
  private static readonly SENSITIVE_KEYS = new Set([
    'password',
    'passwordhash',
    'token',
    'refreshtoken',
    'secret',
    'jwt',
    'authorization',
    'creditcard',
    'cardnumber',
    'cvv',
    'nationalid',
    'ssn',
  ]);

  private static readonly PHONE_KEYS = new Set([
    'phone',
    'phonenumber',
    'mobile',
    'tel',
    'customerphone',
  ]);

  private static readonly ADDRESS_KEYS = new Set([
    'address',
    'street',
    'building',
    'floor',
    'apartment',
    'addressline1',
    'addressline2',
  ]);

  /**
   * Masks a phone number preserving prefix and last 3 digits.
   * Example: "+966501234567" -> "+9665****4567" or "01012345678" -> "010****5678"
   */
  public static maskPhone(phone: string | null | undefined): string {
    if (!phone) return '';
    const clean = phone.trim();
    if (clean.length <= 6) {
      return '*'.repeat(clean.length);
    }
    const prefixLen = clean.startsWith('+') ? 5 : 3;
    const suffixLen = 3;
    const prefix = clean.slice(0, prefixLen);
    const suffix = clean.slice(-suffixLen);
    return `${prefix}${'*'.repeat(Math.max(3, clean.length - prefixLen - suffixLen))}${suffix}`;
  }

  /**
   * Masks a street or delivery address.
   * Example: "14 Al-Tahrir Street, Floor 3, Apt 12" -> "14 Al-Tahrir S... [MASKED]"
   */
  public static maskAddress(address: string | null | undefined): string {
    if (!address) return '';
    const clean = address.trim();
    if (clean.length <= 10) {
      return '*** [MASKED ADDRESS] ***';
    }
    return `${clean.slice(0, 10)}... [MASKED ADDRESS]`;
  }

  /**
   * Masks a customer name for public trackers.
   * Example: "أحمد محمود علي" -> "أحمد م." or "John Doe" -> "John D."
   */
  public static maskCustomerName(name: string | null | undefined): string {
    if (!name) return '';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0 || !parts[0]) return '';
    if (parts.length === 1) return parts[0];
    const initial = parts[1][0] ? `${parts[1][0]}.` : '';
    return `${parts[0]} ${initial}`.trim();
  }

  /**
   * Masks address details for public tracking views, keeping only the general area.
   * Example: "المعادي، شارع النصر، عمارة 4" -> "المعادي (محجوب للخصوصية)"
   */
  public static maskPublicAddress(address: string | null | undefined): string {
    if (!address) return '';
    const clean = address.trim();
    const delimiter = clean.includes('،') ? '،' : clean.includes(',') ? ',' : null;
    if (delimiter) {
      const area = clean.split(delimiter)[0].trim();
      return `${area} (محجوب للخصوصية)`;
    }
    if (clean.length <= 15) return clean;
    return `${clean.slice(0, 12)}... (محجوب للخصوصية)`;
  }

  /**
   * Masks an email address preserving initial char and domain.
   * Example: "ahmed.khalil@example.com" -> "a***l@example.com"
   */
  public static maskEmail(email: string | null | undefined): string {
    if (!email) return '';
    const parts = email.trim().split('@');
    if (parts.length !== 2) return '***@masked';
    const [local, domain] = parts;
    if (local.length <= 2) return `*@${domain}`;
    const maskedLocal = `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}`;
    return `${maskedLocal}@${domain}`;
  }

  /**
   * Deeply traverses an object or array and masks sensitive fields.
   */
  public static maskObject<T>(obj: T): T {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
      return obj.map((item) => LogMasker.maskObject(item)) as unknown as T;
    }

    const masked: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase().replace(/[^a-z]/g, '');

      if (LogMasker.SENSITIVE_KEYS.has(lowerKey)) {
        masked[key] = '[REDACTED]';
      } else if (LogMasker.PHONE_KEYS.has(lowerKey) && typeof value === 'string') {
        masked[key] = LogMasker.maskPhone(value);
      } else if (LogMasker.ADDRESS_KEYS.has(lowerKey) && typeof value === 'string') {
        masked[key] = LogMasker.maskAddress(value);
      } else if (lowerKey.includes('email') && typeof value === 'string') {
        masked[key] = LogMasker.maskEmail(value);
      } else if (typeof value === 'object' && value !== null) {
        masked[key] = LogMasker.maskObject(value);
      } else {
        masked[key] = value;
      }
    }

    return masked as T;
  }
}
