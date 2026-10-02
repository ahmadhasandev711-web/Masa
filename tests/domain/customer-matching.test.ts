import { describe, it, expect } from 'vitest';
import { CustomerMatchingService } from '../../src/domain/customers/services/customer-matching.service';
import { CustomerAddress } from '../../src/domain/customers/entities/customer-address.entity';

describe('CustomerMatchingService', () => {
  it('detects identical incoming address with whitespace or case tolerance', () => {
    const existing = [
      CustomerAddress.create({
        customerId: 'c-1',
        title: 'المنزل',
        city: 'Cairo',
        area: 'المعادي',
        street: 'شارع 9',
        building: '15',
        floor: '2',
        apartment: '4',
      }),
    ];

    const match = CustomerMatchingService.matchExistingAddress(existing, {
      area: '  المعادي  ',
      street: 'شارع 9',
      building: '15',
      floor: '2',
      apartment: '4',
    });

    expect(match).not.toBeNull();
    expect(match?.id).toBe(existing[0].id);
  });

  it('returns null when an address is different', () => {
    const existing = [
      CustomerAddress.create({
        customerId: 'c-1',
        title: 'المنزل',
        city: 'Cairo',
        area: 'المعادي',
        street: 'شارع 9',
        building: '15',
        floor: '2',
        apartment: '4',
      }),
    ];

    const match = CustomerMatchingService.matchExistingAddress(existing, {
      area: 'مدينة نصر',
      street: 'شارع عباس العقاد',
    });

    expect(match).toBeNull();
  });

  it('correctly determines whether customer name should be enriched', () => {
    // Single word existing vs full incoming name -> should enrich
    expect(CustomerMatchingService.shouldEnrichName('أحمد', 'أحمد كمال عبد الله')).toBe(true);

    // Same name -> should not enrich
    expect(CustomerMatchingService.shouldEnrichName('أحمد كمال', 'أحمد كمال')).toBe(false);

    // Empty or identical words -> should not enrich
    expect(CustomerMatchingService.shouldEnrichName('أحمد كمال', 'أحمد')).toBe(false);
  });
});
