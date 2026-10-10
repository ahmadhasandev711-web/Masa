import { prisma } from '../../../infrastructure/db/prisma';
import { NotFoundError, ValidationError } from '../../../domain/shared/errors/domain-error';
import { TableStatus } from '../../../domain/tables/enums';
import { PrintTableBillDto, printTableBillSchema } from '../dto/table.dto';

export class PrintTableBillUseCase {
  public async execute(input: PrintTableBillDto) {
    const validated = printTableBillSchema.parse(input);

    const table = await prisma.diningTable.findUnique({
      where: { id: validated.tableId },
      include: { branch: true },
    });

    if (!table || !table.isActive) {
      throw new NotFoundError('الطاولة', validated.tableId);
    }

    if (!table.activeOrderId) {
      throw new ValidationError(`الطاولة ${table.tableNumber} لا تحتوي على أي طلب مفتوح لطباعة حسابه`);
    }

    const order = await prisma.order.findUnique({
      where: { id: table.activeOrderId },
      include: {
        items: { include: { modifiers: true } },
        cashier: { select: { fullName: true } },
      },
    });

    if (!order || !order.isTabOpen) {
      throw new ValidationError('الطلب غير متاح أو تم إغلاقه مسبقاً');
    }

    const now = new Date();

    // Update table and order state
    await prisma.$transaction([
      prisma.diningTable.update({
        where: { id: table.id },
        data: { status: TableStatus.BILL_PRINTED },
      }),
      prisma.order.update({
        where: { id: order.id },
        data: { billPrintedAt: now },
      }),
    ]);

    const setting = await prisma.restaurantSetting.findFirst();

    return {
      billHeader: {
        restaurantNameAr: setting?.nameAr ?? 'المطعم',
        restaurantNameEn: setting?.nameEn ?? 'Restaurant',
        branchNameAr: table.branch.nameAr,
        branchNameEn: table.branch.nameEn,
        tableNumber: table.tableNumber,
        guestCount: order.guestCount ?? 1,
        orderNumber: order.orderNumber,
        cashierName: order.cashier?.fullName ?? 'الكاشير',
        printedAt: now,
        currencySymbol: setting?.currencySymbol ?? 'ج.م',
      },
      items: order.items.map((item) => ({
        id: item.id,
        nameAr: item.productNameAr,
        nameEn: item.productNameEn,
        sizeNameAr: item.sizeNameAr,
        quantity: item.quantity,
        unitPriceMinor: item.unitPriceMinor,
        totalPriceMinor: item.totalPriceMinor,
        modifiers: item.modifiers.map((m) => ({
          nameAr: m.nameAr,
          priceDeltaMinor: m.priceDeltaMinor,
        })),
      })),
      pricing: {
        subtotalMinor: order.subtotalMinor,
        taxRatePercent: Number(order.taxRatePercent),
        taxMinor: order.taxMinor,
        totalMinor: order.totalMinor,
      },
    };
  }
}
