import { prisma } from '../../../infrastructure/db/prisma';
import { NotFoundError, ValidationError } from '../../../domain/shared/errors/domain-error';
import { TableStatus } from '../../../domain/tables/enums';
import { TransferTableDto, transferTableSchema } from '../dto/table.dto';

export class TransferTableUseCase {
  public async execute(input: TransferTableDto) {
    const validated = transferTableSchema.parse(input);

    if (validated.fromTableId === validated.toTableId) {
      throw new ValidationError('لا يمكن نقل الطلب إلى نفس الطاولة الحالية');
    }

    const [fromTable, toTable] = await Promise.all([
      prisma.diningTable.findUnique({ where: { id: validated.fromTableId } }),
      prisma.diningTable.findUnique({ where: { id: validated.toTableId } }),
    ]);

    if (!fromTable || !fromTable.isActive) {
      throw new NotFoundError('طاولة المصدر', validated.fromTableId);
    }

    if (!toTable || !toTable.isActive) {
      throw new NotFoundError('طاولة الوجهة', validated.toTableId);
    }

    if (fromTable.branchId !== toTable.branchId) {
      throw new ValidationError('لا يمكن نقل الطاولات عبر فروع مختلفة');
    }

    if (!fromTable.activeOrderId) {
      throw new ValidationError(`الطاولة ${fromTable.tableNumber} لا تحتوي على أي طلب مفتوح لنقله`);
    }

    if (toTable.status !== TableStatus.AVAILABLE) {
      throw new ValidationError(`الطاولة المستهدفة ${toTable.tableNumber} مشغولة بالفعل أو غير متاحة`);
    }

    // Atomic Transfer Transaction
    return prisma.$transaction(async (tx) => {
      // 1. Update Order's table pointer
      const updatedOrder = await tx.order.update({
        where: { id: fromTable.activeOrderId! },
        data: {
          tableId: toTable.id,
          tableName: toTable.tableNumber,
        },
      });

      // 2. Free source table
      const freedFromTable = await tx.diningTable.update({
        where: { id: fromTable.id },
        data: {
          status: TableStatus.AVAILABLE,
          activeOrderId: null,
        },
      });

      // 3. Occupy destination table with previous status atomically (OCCUPIED or BILL_PRINTED)
      const updateToResult = await tx.diningTable.updateMany({
        where: { id: toTable.id, status: TableStatus.AVAILABLE },
        data: {
          status: fromTable.status,
          activeOrderId: updatedOrder.id,
        },
      });

      if (updateToResult.count === 0) {
        throw new ValidationError(`الطاولة المستهدفة ${toTable.tableNumber} تم شغلها من محطة أخرى`);
      }

      const occupiedToTable = await tx.diningTable.findUniqueOrThrow({
        where: { id: toTable.id },
      });

      return {
        order: {
          ...updatedOrder,
          taxRatePercent: Number(updatedOrder.taxRatePercent),
        },
        fromTable: freedFromTable,
        toTable: occupiedToTable,
      };
    });
  }
}
