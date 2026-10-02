import { describe, it, expect, vi } from 'vitest';
import { OrderNumberService } from '../../src/domain/ordering/services/order-number.service';

type TxParam = Parameters<typeof OrderNumberService.getNextOrderNumber>[0];

describe('OrderNumberService', () => {
  it('generates 1001 when no previous orders exist', async () => {
    const mockTx = {
      $queryRawUnsafe: vi.fn().mockResolvedValue([{ next_num: 1001 }]),
      order: {
        count: vi.fn().mockResolvedValue(0),
      },
    };

    const orderNumber = await OrderNumberService.getNextOrderNumber(mockTx as unknown as TxParam);
    expect(orderNumber).toBe('1001');
    expect(mockTx.$queryRawUnsafe).toHaveBeenCalled();
  });

  it('increments sequential order numbers', async () => {
    const mockTx = {
      $queryRawUnsafe: vi.fn().mockResolvedValue([{ next_num: 1042 }]),
      order: {
        count: vi.fn().mockResolvedValue(41),
      },
    };

    const orderNumber = await OrderNumberService.getNextOrderNumber(mockTx as unknown as TxParam);
    expect(orderNumber).toBe('1042');
  });

  it('falls back safely to count if queryRawUnsafe encounters an error', async () => {
    const mockTx = {
      $queryRawUnsafe: vi.fn().mockRejectedValue(new Error('Syntax error or locked')),
      order: {
        count: vi.fn().mockResolvedValue(5),
      },
    };

    const orderNumber = await OrderNumberService.getNextOrderNumber(mockTx as unknown as TxParam);
    expect(orderNumber).toBe('1006');
    expect(mockTx.order.count).toHaveBeenCalled();
  });

  it('falls back to 1001 if both query and count fail', async () => {
    const mockTx = {
      $queryRawUnsafe: vi.fn().mockRejectedValue(new Error('Database lock')),
      order: {
        count: vi.fn().mockRejectedValue(new Error('Table lock')),
      },
    };

    const orderNumber = await OrderNumberService.getNextOrderNumber(mockTx as unknown as TxParam);
    expect(orderNumber).toBe('1001');
  });
});
