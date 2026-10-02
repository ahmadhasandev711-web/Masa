import { describe, it, expect } from 'vitest';
import { PhoneNumber } from '../../src/domain/customers/value-objects/phone-number';
import { ValidationError } from '../../src/domain/shared/errors/domain-error';

describe('PhoneNumber Value Object', () => {
  it('normalizes Egyptian local 11-digit numbers to E.164 (+20...) format', () => {
    const p1 = PhoneNumber.fromString('01012345678');
    expect(p1.value).toBe('+201012345678');

    const p2 = PhoneNumber.fromString('01198765432');
    expect(p2.value).toBe('+201198765432');

    const p3 = PhoneNumber.fromString('01234567890');
    expect(p3.value).toBe('+201234567890');

    const p4 = PhoneNumber.fromString('01555555555');
    expect(p4.value).toBe('+201555555555');
  });

  it('converts Arabic-Indic digits to ASCII standard before normalization', () => {
    const arabicNumber = '٠١٠١٢٣٤٥٦٧٨';
    const phone = PhoneNumber.fromString(arabicNumber);
    expect(phone.value).toBe('+201012345678');
  });

  it('strips dashes, spaces, and formatting characters properly', () => {
    const formatted = '  (010) 1234 - 5678  ';
    const phone = PhoneNumber.fromString(formatted);
    expect(phone.value).toBe('+201012345678');
  });

  it('handles numbers starting with 0020 and 20 correctly', () => {
    const p1 = PhoneNumber.fromString('00201012345678');
    expect(p1.value).toBe('+201012345678');

    const p2 = PhoneNumber.fromString('201012345678');
    expect(p2.value).toBe('+201012345678');
  });

  it('preserves generic international numbers starting with +', () => {
    const saudiPhone = PhoneNumber.fromString('+966501234567');
    expect(saudiPhone.value).toBe('+966501234567');
  });

  it('formats correctly into national and international presentation', () => {
    const phone = PhoneNumber.fromString('01012345678');
    expect(phone.formatNational()).toBe('010 1234 5678');
    expect(phone.formatInternational()).toBe('+20 10 1234 5678');
  });

  it('correctly compares phone numbers for equality regardless of original input format', () => {
    const p1 = PhoneNumber.fromString('01012345678');
    const p2 = PhoneNumber.fromString('+201012345678');
    const p3 = PhoneNumber.fromString('٠١٠١٢٣٤٥٦٧٨');
    expect(p1.equals(p2)).toBe(true);
    expect(p1.equals(p3)).toBe(true);
  });

  it('throws ValidationError for invalid or too-short numbers', () => {
    expect(() => PhoneNumber.fromString('123')).toThrow(ValidationError);
    expect(() => PhoneNumber.fromString('abcdefgh')).toThrow(ValidationError);
    expect(() => PhoneNumber.fromString('')).toThrow(ValidationError);
  });
});
