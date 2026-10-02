import { describe, it, expect } from 'vitest';
import { Money } from '../../src/domain/shared/value-objects/money';
import { CashShiftCalculatorService } from '../../src/domain/finance/services/cash-shift-calculator.service';
import { ValidationError } from '../../src/domain/shared/errors/domain-error';

describe('CashShiftCalculatorService', () => {
  const currency = 'EGP';

  it('calculates the exact expected cash in register drawer (GR-1.1)', () => {
    // Opening: 500.00 EGP (50000 minor)
    const openingCash = Money.fromMinor(50000, currency);
    // Sales: 1250.50 EGP (125050 minor)
    const cashSales = Money.fromMinor(125050, currency);
    // Cash In (extra change added): 200.00 EGP (20000 minor)
    const cashInTotal = Money.fromMinor(20000, currency);
    // Cash Drop (transferred to safe): 500.00 EGP (50000 minor)
    const cashDropTotal = Money.fromMinor(50000, currency);
    // Register Expense (cleaning supplies paid from drawer): 80.00 EGP (8000 minor)
    const registerExpensesTotal = Money.fromMinor(8000, currency);

    // Expected = 50000 + 125050 + 20000 - 50000 - 8000 = 137050 minor (1370.50 EGP)
    const expected = CashShiftCalculatorService.calculateExpectedCash({
      openingCash,
      cashSales,
      cashInTotal,
      cashDropTotal,
      registerExpensesTotal,
    });

    expect(expected.amount).toBe(137050);
    expect(expected.currency).toBe('EGP');
  });

  it('accurately detects BALANCED shift when counted cash matches expected cash', () => {
    const expected = Money.fromMinor(100000, currency);
    const counted = Money.fromMinor(100000, currency);

    const analysis = CashShiftCalculatorService.analyzeVariance(counted, expected);

    expect(analysis.variance.amount).toBe(0);
    expect(analysis.varianceStatus).toBe('BALANCED');
  });

  it('accurately detects SHORTAGE (عجز) when counted cash is less than expected', () => {
    const expected = Money.fromMinor(100000, currency); // 1000 EGP
    const counted = Money.fromMinor(95000, currency);   // 950 EGP (50 EGP shortage)

    const analysis = CashShiftCalculatorService.analyzeVariance(counted, expected);

    expect(analysis.variance.amount).toBe(-5000);
    expect(analysis.varianceStatus).toBe('SHORTAGE');
  });

  it('accurately detects OVERAGE (زيادة) when counted cash is more than expected', () => {
    const expected = Money.fromMinor(100000, currency); // 1000 EGP
    const counted = Money.fromMinor(102500, currency);  // 1025 EGP (25 EGP surplus)

    const analysis = CashShiftCalculatorService.analyzeVariance(counted, expected);

    expect(analysis.variance.amount).toBe(2500);
    expect(analysis.varianceStatus).toBe('OVERAGE');
  });

  it('validates cash movements rejecting non-integer, zero, or negative amounts', () => {
    expect(() => CashShiftCalculatorService.validateMovement(0, 'تغذية فكة')).toThrow(ValidationError);
    expect(() => CashShiftCalculatorService.validateMovement(-1000, 'سحب نقد')).toThrow(ValidationError);
    expect(() => CashShiftCalculatorService.validateMovement(100.5, 'كسور')).toThrow(ValidationError);
  });

  it('validates cash movements rejecting empty or too short reasons', () => {
    expect(() => CashShiftCalculatorService.validateMovement(5000, '')).toThrow(ValidationError);
    expect(() => CashShiftCalculatorService.validateMovement(5000, '  ')).toThrow(ValidationError);
    expect(() => CashShiftCalculatorService.validateMovement(5000, 'ab')).toThrow(ValidationError);
    expect(() => CashShiftCalculatorService.validateMovement(5000, 'تغذية الدرج بالفكة')).not.toThrow();
  });
});
