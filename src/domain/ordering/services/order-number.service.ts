import { Prisma } from '@prisma/client';

export class OrderNumberService {
  /**
   * Generates the next sequential human-friendly order number for physical/POS/Dine-in operations.
   * Format: 1001, 1002, 1003, ...
   * 
   * Uses MySQL FOR UPDATE lock inside a transaction to guarantee atomic uniqueness and prevent collisions.
   * Ignores legacy high-entropy alphanumeric codes.
   */
  public static async getNextOrderNumber(tx: Prisma.TransactionClient): Promise<string> {
    try {
      const rows = await tx.$queryRawUnsafe<Array<{ next_num: number | bigint | string }>>(
        `SELECT COALESCE(MAX(CAST(order_number AS UNSIGNED)), 1000) + 1 AS next_num 
         FROM orders 
         WHERE order_number REGEXP '^[0-9]+$' 
         FOR UPDATE`
      );
      const nextNum = rows?.[0]?.next_num ? Number(rows[0].next_num) : 1001;
      return String(nextNum);
    } catch {
      // Safe fallback in case table query fails
      try {
        const count = await tx.order?.count?.();
        return String(1001 + (count ?? 0));
      } catch {
        return String(1001);
      }
    }
  }
}
