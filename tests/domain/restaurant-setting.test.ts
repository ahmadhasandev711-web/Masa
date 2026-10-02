import { describe, it, expect } from 'vitest';
import { RestaurantSetting } from '../../src/domain/settings/entities/restaurant-setting.entity';
import { Money } from '../../src/domain/shared/value-objects/money';
import { ValidationError } from '../../src/domain/shared/errors/domain-error';

describe('RestaurantSetting Domain Entity', () => {
  it('creates valid restaurant settings with dynamic currency and money fee', () => {
    const setting = RestaurantSetting.create({
      nameAr: 'مطعم السعادة',
      nameEn: 'Happiness Restaurant',
      currency: 'EGP',
      currencySymbol: 'ج.م',
      locale: 'ar-EG',
      taxRatePercent: 14.0,
      deliveryFee: Money.fromMinor(2000, 'EGP'),
      phone: '0100000000',
      address: 'القاهرة',
    });

    expect(setting.id).toBeDefined();
    expect(setting.currency).toBe('EGP');
    expect(setting.taxRatePercent).toBe(14.0);
    expect(setting.deliveryFee.amount).toBe(2000);
  });

  it('rejects tax rate exceeding 100 percent', () => {
    expect(() =>
      RestaurantSetting.create({
        nameAr: 'مطعم',
        nameEn: 'Restaurant',
        currency: 'EGP',
        currencySymbol: 'ج.م',
        locale: 'ar-EG',
        taxRatePercent: 150.0,
        deliveryFee: Money.fromMinor(1000, 'EGP'),
      })
    ).toThrow(ValidationError);
  });

  it('rejects mismatched delivery fee currency', () => {
    expect(() =>
      RestaurantSetting.create({
        nameAr: 'مطعم',
        nameEn: 'Restaurant',
        currency: 'EGP',
        currencySymbol: 'ج.م',
        locale: 'ar-EG',
        taxRatePercent: 14.0,
        deliveryFee: Money.fromMinor(1000, 'SAR'), // Mismatched currency
      })
    ).toThrow(ValidationError);
  });

  it('updates currency dynamically without hardcoding', () => {
    const setting = RestaurantSetting.create({
      nameAr: 'مطعم الرياض',
      nameEn: 'Riyadh Restaurant',
      currency: 'EGP',
      currencySymbol: 'ج.م',
      locale: 'ar-EG',
      taxRatePercent: 14.0,
      deliveryFee: Money.fromMinor(1500, 'EGP'),
    });

    const updated = setting.updateCurrency('SAR', 'ر.س');
    expect(updated.currency).toBe('SAR');
    expect(updated.currencySymbol).toBe('ر.س');
    expect(updated.deliveryFee.currency).toBe('SAR');
  });
});
