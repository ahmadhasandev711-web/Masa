import { TableStatus } from '../enums';
import { ValidationError } from '../../shared/errors/domain-error';

/**
 * TableStateMachine (GR-6.2)
 * Enforces valid operational transitions for dining tables.
 */
export class TableStateMachine {
  private static readonly VALID_TRANSITIONS: Record<TableStatus, TableStatus[]> = {
    [TableStatus.AVAILABLE]: [
      TableStatus.OCCUPIED,
      TableStatus.RESERVED,
    ],
    [TableStatus.RESERVED]: [
      TableStatus.OCCUPIED,
      TableStatus.AVAILABLE,
    ],
    [TableStatus.OCCUPIED]: [
      TableStatus.BILL_PRINTED,
      TableStatus.AVAILABLE, // Cancelled / voided empty tab
      TableStatus.CLEANING,
    ],
    [TableStatus.BILL_PRINTED]: [
      TableStatus.AVAILABLE,  // Fully settled and cleared
      TableStatus.OCCUPIED,   // Ordered extra rounds after bill was printed
      TableStatus.CLEANING,   // Settled, awaiting bussing/cleaning
    ],
    [TableStatus.CLEANING]: [
      TableStatus.AVAILABLE,
    ],
  };

  /**
   * Asserts whether a transition from currentStatus to nextStatus is permissible.
   */
  public static assertTransition(currentStatus: TableStatus, nextStatus: TableStatus): void {
    if (currentStatus === nextStatus) return;

    const allowed = this.VALID_TRANSITIONS[currentStatus];
    if (!allowed || !allowed.includes(nextStatus)) {
      throw new ValidationError(
        `لا يمكن تحويل حالة الطاولة من "${currentStatus}" إلى "${nextStatus}"`
      );
    }
  }

  /**
   * Checks if transition is valid without throwing.
   */
  public static canTransition(currentStatus: TableStatus, nextStatus: TableStatus): boolean {
    if (currentStatus === nextStatus) return true;
    const allowed = this.VALID_TRANSITIONS[currentStatus];
    return Boolean(allowed && allowed.includes(nextStatus));
  }
}
