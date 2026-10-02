import { describe, it, expect } from 'vitest';
import { OrderStateMachineService } from '../../src/domain/ordering/services/order-state-machine.service';
import { OrderStatus } from '../../src/domain/ordering/enums';
import { ValidationError } from '../../src/domain/shared/errors/domain-error';

describe('OrderStateMachineService (Domain)', () => {
  it('allows valid normal forward progression through the lifecycle', () => {
    // PENDING -> CONFIRMED
    expect(
      OrderStateMachineService.canTransition({
        currentStatus: OrderStatus.PENDING,
        nextStatus: OrderStatus.CONFIRMED,
      }).allowed
    ).toBe(true);

    // CONFIRMED -> PREPARING (with branch)
    expect(
      OrderStateMachineService.canTransition({
        currentStatus: OrderStatus.CONFIRMED,
        nextStatus: OrderStatus.PREPARING,
        branchId: 'branch-123',
      }).allowed
    ).toBe(true);

    // PREPARING -> READY_FOR_PICKUP
    expect(
      OrderStateMachineService.canTransition({
        currentStatus: OrderStatus.PREPARING,
        nextStatus: OrderStatus.READY_FOR_PICKUP,
      }).allowed
    ).toBe(true);

    // READY_FOR_PICKUP -> OUT_FOR_DELIVERY
    expect(
      OrderStateMachineService.canTransition({
        currentStatus: OrderStatus.READY_FOR_PICKUP,
        nextStatus: OrderStatus.OUT_FOR_DELIVERY,
      }).allowed
    ).toBe(true);

    // OUT_FOR_DELIVERY -> DELIVERED
    expect(
      OrderStateMachineService.canTransition({
        currentStatus: OrderStatus.OUT_FOR_DELIVERY,
        nextStatus: OrderStatus.DELIVERED,
      }).allowed
    ).toBe(true);
  });

  it('rejects transitioning to PREPARING if branchId is missing', () => {
    const result = OrderStateMachineService.canTransition({
      currentStatus: OrderStatus.CONFIRMED,
      nextStatus: OrderStatus.PREPARING,
      branchId: null,
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('فرع');

    expect(() =>
      OrderStateMachineService.assertCanTransition({
        currentStatus: OrderStatus.CONFIRMED,
        nextStatus: OrderStatus.PREPARING,
        branchId: undefined,
      })
    ).toThrow(ValidationError);
  });

  it('requires cancelReason when moving to CANCELLED or REJECTED', () => {
    // Missing reason
    const withoutReason = OrderStateMachineService.canTransition({
      currentStatus: OrderStatus.PENDING,
      nextStatus: OrderStatus.CANCELLED,
      cancelReason: '',
    });
    expect(withoutReason.allowed).toBe(false);
    expect(withoutReason.reason).toContain('سبب الإلغاء');

    // With valid reason
    const withReason = OrderStateMachineService.canTransition({
      currentStatus: OrderStatus.PENDING,
      nextStatus: OrderStatus.CANCELLED,
      cancelReason: 'العميل طلب إلغاء الطلب لتغيير العنوان',
    });
    expect(withReason.allowed).toBe(true);

    // Rejection with reason
    const rejectedWithReason = OrderStateMachineService.canTransition({
      currentStatus: OrderStatus.PENDING,
      nextStatus: OrderStatus.REJECTED,
      cancelReason: 'المنطقة خارج نطاق التوصيل',
    });
    expect(rejectedWithReason.allowed).toBe(true);
  });

  it('blocks transitions from terminal states', () => {
    const terminalStatuses = [OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.REJECTED];

    for (const status of terminalStatuses) {
      expect(OrderStateMachineService.isTerminalStatus(status)).toBe(true);
      expect(OrderStateMachineService.getAllowedTransitions(status)).toHaveLength(0);

      const attempt = OrderStateMachineService.canTransition({
        currentStatus: status,
        nextStatus: OrderStatus.CONFIRMED,
      });
      expect(attempt.allowed).toBe(false);
      expect(attempt.reason).toContain('نهائية');

      expect(() =>
        OrderStateMachineService.assertCanTransition({
          currentStatus: status,
          nextStatus: OrderStatus.PENDING,
        })
      ).toThrow(ValidationError);
    }
  });

  it('prevents illegal status jumps (e.g. PENDING directly to DELIVERED)', () => {
    const jumpAttempt = OrderStateMachineService.canTransition({
      currentStatus: OrderStatus.PENDING,
      nextStatus: OrderStatus.DELIVERED,
    });
    expect(jumpAttempt.allowed).toBe(false);

    const backwardsAttempt = OrderStateMachineService.canTransition({
      currentStatus: OrderStatus.READY_FOR_PICKUP,
      nextStatus: OrderStatus.CONFIRMED,
    });
    expect(backwardsAttempt.allowed).toBe(false);
  });
});
