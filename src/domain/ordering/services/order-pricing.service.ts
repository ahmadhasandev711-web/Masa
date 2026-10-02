import { Money } from '../../shared/value-objects/money';
import { ValidationError } from '../../shared/errors/domain-error';

export interface PricingItemInput {
  unitPrice: Money;
  quantity: number;
  modifierDeltas?: Money[];
}

export interface PricingCalculationResult {
  subtotal: Money;
  deliveryFee: Money;
  tax: Money;
  discount: Money;
  total: Money;
}

/**
 * Deterministic Server-Side Order Pricing Service (GR-3.2, GR-1.1, GR-8.2).
 * Guarantees arithmetic accuracy using integer minor units (Money VO).
 */
export class OrderPricingService {
  public static calculate(
    items: PricingItemInput[],
    deliveryFee: Money,
    taxRatePercent: number = 0,
    discount?: Money
  ): PricingCalculationResult {
    if (!items || items.length === 0) {
      throw new ValidationError('لا يمكن حساب تسعير طلب فارغ بدون أصناف');
    }

    const currency = deliveryFee.currency;
    let subtotal = Money.zero(currency);

    for (const item of items) {
      if (item.quantity <= 0) {
        throw new ValidationError('كمية الصنف يجب أن تكون 1 على الأقل');
      }

      // Base unit price
      let itemUnitPrice = item.unitPrice;
      item.unitPrice.assertSameCurrency(deliveryFee);

      // Add modifier deltas
      if (item.modifierDeltas && item.modifierDeltas.length > 0) {
        for (const delta of item.modifierDeltas) {
          delta.assertSameCurrency(deliveryFee);
          itemUnitPrice = itemUnitPrice.add(delta);
        }
      }

      // Multiply by quantity
      const itemTotal = itemUnitPrice.multiply(item.quantity);
      subtotal = subtotal.add(itemTotal);
    }

    // Calculate Tax
    const tax = subtotal.percentage(String(taxRatePercent));

    // Apply Discount
    const appliedDiscount = discount ? discount : Money.zero(currency);
    appliedDiscount.assertSameCurrency(deliveryFee);

    // Total = subtotal + deliveryFee + tax - discount
    let total = subtotal.add(deliveryFee).add(tax);
    if (appliedDiscount.amount > 0) {
      if (appliedDiscount.amount >= total.amount) {
        total = Money.zero(currency);
      } else {
        total = total.subtract(appliedDiscount);
      }
    }

    return {
      subtotal,
      deliveryFee,
      tax,
      discount: appliedDiscount,
      total,
    };
  }
}
