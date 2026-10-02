import { Money } from '../../shared/value-objects/money';

export interface ProfitabilityMetrics {
  netSales: Money;
  cogs: Money;
  grossProfit: Money;
  operatingExpenses: Money;
  operatingProfit: Money;
  cogsPercent: number;
  grossMarginPercent: number;
  operatingMarginPercent: number;
}

export class ProfitabilityCalculatorService {
  /**
   * Calculates comprehensive profitability metrics for a branch or business period.
   * Pure domain calculation with zero framework dependencies.
   */
  public static calculate(params: {
    netSales: Money;
    cogs: Money;
    operatingExpenses: Money;
  }): ProfitabilityMetrics {
    const { netSales, cogs, operatingExpenses } = params;

    const grossProfit = netSales.subtract(cogs);
    const operatingProfit = grossProfit.subtract(operatingExpenses);

    const netSalesAmount = netSales.amount;

    const cogsPercent = netSalesAmount > 0
      ? Math.round((cogs.amount / netSalesAmount) * 10000) / 100
      : 0;

    const grossMarginPercent = netSalesAmount > 0
      ? Math.round((grossProfit.amount / netSalesAmount) * 10000) / 100
      : 0;

    const operatingMarginPercent = netSalesAmount > 0
      ? Math.round((operatingProfit.amount / netSalesAmount) * 10000) / 100
      : 0;

    return {
      netSales,
      cogs,
      grossProfit,
      operatingExpenses,
      operatingProfit,
      cogsPercent,
      grossMarginPercent,
      operatingMarginPercent,
    };
  }
}
