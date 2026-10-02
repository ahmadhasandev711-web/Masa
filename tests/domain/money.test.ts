import { describe, it, expect } from 'vitest';
import { Money } from '../../src/domain/shared/value-objects/money';
import { ValidationError } from '../../src/domain/shared/errors/domain-error';

describe('Money Value Object', () => {
  it('creates Money from minor units with explicit currency', () => {
    const money = Money.fromMinor(1500, 'EGP');
    expect(money.amount).toBe(1500);
    expect(money.currency).toBe('EGP');
    expect(money.toMajor()).toBe(15);
  });

  it('creates Money from major units with explicit currency', () => {
    const money = Money.fromMajor(25.5, 'EGP');
    expect(money.amount).toBe(2550);
    expect(money.toMajor()).toBe(25.5);
  });

  it('rejects floating point numbers in minor units', () => {
    expect(() => Money.fromMinor(12.34 as unknown as number, 'EGP')).toThrow(ValidationError);
  });

  it('rejects invalid or missing currency codes', () => {
    expect(() => Money.fromMinor(1000, '')).toThrow(ValidationError);
    expect(() => Money.fromMinor(1000, 'EG')).toThrow(ValidationError);
    expect(() => Money.fromMinor(1000, 'EGPP')).toThrow(ValidationError);
    expect(() => Money.fromMinor(1000, '123')).toThrow(ValidationError);
  });

  it('performs exact addition between matching currencies', () => {
    const m1 = Money.fromMinor(1050, 'EGP');
    const m2 = Money.fromMinor(2025, 'EGP');
    const sum = m1.add(m2);

    expect(sum.amount).toBe(3075);
    expect(sum.currency).toBe('EGP');
  });

  it('performs exact subtraction', () => {
    const m1 = Money.fromMinor(5000, 'EGP');
    const m2 = Money.fromMinor(1250, 'EGP');
    const diff = m1.subtract(m2);

    expect(diff.amount).toBe(3750);
    expect(diff.currency).toBe('EGP');
  });

  it('performs multiplication with integer rounding', () => {
    const price = Money.fromMinor(1000, 'EGP'); // 10.00 EGP
    const result = price.multiply(1.14); // 14% VAT -> 11.40 EGP -> 1140 minor units

    expect(result.amount).toBe(1140);
    expect(result.toMajor()).toBe(11.4);
  });

  it('prevents operations across different currencies', () => {
    const egp = Money.fromMinor(1000, 'EGP');
    const sar = Money.fromMinor(1000, 'SAR');

    expect(() => egp.add(sar)).toThrow(ValidationError);
    expect(() => egp.subtract(sar)).toThrow(ValidationError);
    expect(() => egp.isGreaterThan(sar)).toThrow(ValidationError);
  });

  it('allocates amounts proportionally without losing remainder cents (Hare-Niemeyer method)', () => {
    // 10.00 EGP (1000 minor units) split into 3 equal shares (1:1:1)
    const money = Money.fromMinor(1000, 'EGP');
    const shares = money.allocate([1, 1, 1]);

    expect(shares).toHaveLength(3);
    const totalAllocated = shares.reduce((acc, cur) => acc + cur.amount, 0);
    expect(totalAllocated).toBe(1000);
    expect(shares.map((s) => s.amount)).toEqual([334, 333, 333]);
  });

  it('correctly compares money amounts', () => {
    const small = Money.fromMinor(500, 'EGP');
    const large = Money.fromMinor(1000, 'EGP');
    const equal = Money.fromMinor(500, 'EGP');

    expect(large.isGreaterThan(small)).toBe(true);
    expect(small.isLessThan(large)).toBe(true);
    expect(small.equals(equal)).toBe(true);
    expect(small.equals(large)).toBe(false);
  });

  it('formats money for display with explicit locale', () => {
    const money = Money.fromMinor(1250, 'EGP');
    const formatted = money.format('en-US');
    expect(formatted).toContain('12.50');
  });

  it('rejects formatting without explicit locale', () => {
    const money = Money.fromMinor(1250, 'EGP');
    expect(() => money.format('')).toThrow(ValidationError);
  });
});
