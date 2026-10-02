import { describe, it, expect } from 'vitest';
import { Branch } from '../../src/domain/branches/entities/branch.entity';
import { ValidationError } from '../../src/domain/shared/errors/domain-error';

describe('Branch Domain Entity', () => {
  it('creates a valid branch entity with default active state', () => {
    const branch = Branch.create({
      code: 'ALEX-01',
      nameAr: 'فرع الإسكندرية',
      nameEn: 'Alexandria Branch',
      phone: '01099887766',
      address: 'طريق الكورنيش، الإسكندرية',
    });

    expect(branch.id).toBeDefined();
    expect(branch.code).toBe('ALEX-01');
    expect(branch.nameAr).toBe('فرع الإسكندرية');
    expect(branch.isActive).toBe(true);
  });

  it('rejects short branch code', () => {
    expect(() =>
      Branch.create({
        code: 'A',
        nameAr: 'فرع',
        nameEn: 'Branch',
        phone: '0100000000',
        address: 'عنوان',
      })
    ).toThrow(ValidationError);
  });

  it('toggles active and inactive state immutably', () => {
    const branch = Branch.create({
      code: 'GIZA-01',
      nameAr: 'فرع الجيزة',
      nameEn: 'Giza Branch',
      phone: '01011223344',
      address: 'شارع الهرم',
    });

    const deactivated = branch.deactivate();
    expect(deactivated.isActive).toBe(false);
    expect(branch.isActive).toBe(true); // Original remains immutable

    const reactivated = deactivated.activate();
    expect(reactivated.isActive).toBe(true);
  });
});
