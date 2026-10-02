import { describe, it, expect } from 'vitest';
import { LogMasker } from '../../src/infrastructure/logging/log-masker';

describe('LogMasker PII Protection', () => {
  it('masks international phone numbers', () => {
    const masked = LogMasker.maskPhone('+966501234567');
    expect(masked.startsWith('+966')).toBe(true);
    expect(masked.endsWith('567')).toBe(true);
    expect(masked).toContain('****');
    expect(masked).not.toBe('+966501234567');
  });

  it('masks local phone numbers', () => {
    const masked = LogMasker.maskPhone('01012345678');
    expect(masked.startsWith('010')).toBe(true);
    expect(masked.endsWith('678')).toBe(true);
    expect(masked).toContain('****');
  });

  it('masks delivery addresses', () => {
    const masked = LogMasker.maskAddress('14 Al-Tahrir Street, Floor 3, Apt 12, Riyadh');
    expect(masked).toContain('[MASKED ADDRESS]');
    expect(masked).not.toContain('Apt 12');
  });

  it('masks email addresses', () => {
    const masked = LogMasker.maskEmail('restaurant.owner@MASA.com');
    expect(masked).toContain('@MASA.com');
    expect(masked).toContain('***');
    expect(masked).not.toBe('restaurant.owner@MASA.com');
  });

  it('deeply traverses objects and masks all sensitive keys', () => {
    const payload = {
      orderId: 'ORD-101',
      customer: {
        name: 'Ahmed',
        phone: '+966501234567',
        address: 'King Fahd Road, Building 4, Riyadh',
        email: 'ahmed@example.com',
      },
      payment: {
        method: 'CARD',
        cardNumber: '4111222233334444',
        cvv: '123',
        token: 'tok_live_987654321',
      },
    };

    const masked = LogMasker.maskObject(payload);

    expect(masked.orderId).toBe('ORD-101');
    expect(masked.customer.phone).toContain('****');
    expect(masked.customer.address).toContain('[MASKED ADDRESS]');
    expect(masked.customer.email).toContain('***');
    expect(masked.payment.cardNumber).toBe('[REDACTED]');
    expect(masked.payment.cvv).toBe('[REDACTED]');
    expect(masked.payment.token).toBe('[REDACTED]');
  });
});
