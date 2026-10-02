import { describe, it, expect } from 'vitest';
import { Money } from '../../src/domain/shared/value-objects/money';
import { ProfitabilityCalculatorService } from '../../src/domain/finance/services/profitability-calculator.service';

describe('ProfitabilityCalculatorService', () => {
  const currency = 'EGP';

  it('calculates gross profit, operating profit, and margins with exact precision', () => {
    // Net sales: 10,000.00 EGP (1000000 minor)
    const netSales = Money.fromMinor(1000000, currency);
    // COGS: 3,500.00 EGP (350000 minor) (35%)
    const cogs = Money.fromMinor(350000, currency);
    // Operating expenses: 1,500.00 EGP (150000 minor) (15%)
    const operatingExpenses = Money.fromMinor(150000, currency);

    const metrics = ProfitabilityCalculatorService.calculate({
      netSales,
      cogs,
      operatingExpenses,
    });

    // Gross profit = 1,000,000 - 350,000 = 650,000 minor (6,500.00 EGP)
    expect(metrics.grossProfit.amount).toBe(650000);

    // Operating profit = 650,000 - 150,000 = 500,000 minor (5,000.00 EGP)
    expect(metrics.operatingProfit.amount).toBe(500000);

    // Percentages
    expect(metrics.cogsPercent).toBe(35.0);
    expect(metrics.grossMarginPercent).toBe(65.0);
    expect(metrics.operatingMarginPercent).toBe(50.0);
  });

  it('gracefully handles zero net sales without division by zero or NaN', () => {
    const netSales = Money.fromMinor(0, currency);
    const cogs = Money.fromMinor(0, currency);
    const operatingExpenses = Money.fromMinor(25000, currency); // 250 EGP expenses incurred

    const metrics = ProfitabilityCalculatorService.calculate({
      netSales,
      cogs,
      operatingExpenses,
    });

    expect(metrics.grossProfit.amount).toBe(0);
    expect(metrics.operatingProfit.amount).toBe(-25000);
    expect(metrics.cogsPercent).toBe(0);
    expect(metrics.grossMarginPercent).toBe(0);
    expect(metrics.operatingMarginPercent).toBe(0);
  });
});
