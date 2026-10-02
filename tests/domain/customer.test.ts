import { describe, it, expect } from 'vitest';
import { Customer } from '../../src/domain/customers/entities/customer.entity';
import { PhoneNumber } from '../../src/domain/customers/value-objects/phone-number';
import { Money } from '../../src/domain/shared/value-objects/money';
import { ValidationError } from '../../src/domain/shared/errors/domain-error';

describe('Customer Domain Entity', () => {
  const phone = PhoneNumber.fromString('01012345678');

  it('creates a valid customer with initial zero stats', () => {
    const customer = Customer.create({
      fullName: 'محمود حسن',
      phone,
      email: 'mahmoud@example.com',
      notes: 'عميل مميز',
    });

    expect(customer.id).toBeDefined();
    expect(customer.fullName).toBe('محمود حسن');
    expect(customer.phone.value).toBe('+201012345678');
    expect(customer.totalOrders).toBe(0);
    expect(customer.totalSpent.amount).toBe(0);
    expect(customer.isActive).toBe(true);
  });

  it('throws ValidationError when full name is empty or less than 2 characters', () => {
    expect(() =>
      Customer.create({
        fullName: 'أ',
        phone,
      })
    ).toThrow(ValidationError);
  });

  it('records an order and updates totalOrders and totalSpent safely via Money', () => {
    const customer = Customer.create({
      fullName: 'سارة إبراهيم',
      phone,
    });

    const orderAmount = Money.fromMinor(15000, 'EGP'); // 150.00 EGP
    const orderDate = new Date('2026-09-28T12:00:00Z');

    const updated = customer.recordOrder(orderAmount, orderDate);

    expect(updated.totalOrders).toBe(1);
    expect(updated.totalSpent.amount).toBe(15000);
    expect(updated.lastOrderAt).toEqual(orderDate);

    // Record second order
    const updated2 = updated.recordOrder(Money.fromMinor(5000, 'EGP'));
    expect(updated2.totalOrders).toBe(2);
    expect(updated2.totalSpent.amount).toBe(20000);
  });

  it('activates and deactivates correctly', () => {
    const customer = Customer.create({
      fullName: 'خالد عمر',
      phone,
    });

    const deactivated = customer.deactivate();
    expect(deactivated.isActive).toBe(false);

    const activated = deactivated.activate();
    expect(activated.isActive).toBe(true);
  });
});
