import { prisma } from '../../../infrastructure/db/prisma';
import { TableStatus } from '../../../domain/tables/enums';

export interface TableActiveOrderItem {
  id: string;
  productNameAr: string;
  sizeNameAr: string | null;
  unitPriceMinor: number;
  quantity: number;
  totalPriceMinor: number;
  modifiers: Array<{ modifierId: string; nameAr: string; priceDeltaMinor: number }>;
}

export interface TableItemView {
  id: string;
  tableNumber: string;
  capacity: number;
  status: TableStatus;
  shape: string;
  sectionId: string | null;
  sectionNameAr?: string | null;
  sectionNameEn?: string | null;
  activeOrderId: string | null;
  activeOrder?: {
    id: string;
    orderNumber: string;
    guestCount: number | null;
    itemsCount: number;
    subtotalMinor: number;
    taxMinor: number;
    totalMinor: number;
    openedAt: Date;
    minutesSeated: number;
    billPrintedAt: Date | null;
    items?: TableActiveOrderItem[];
  } | null;
}

export class ListTablesUseCase {
  public async execute(branchId: string): Promise<{
    sections: Array<{ id: string; nameAr: string; nameEn: string; sortOrder: number }>;
    tables: TableItemView[];
  }> {
    const [sections, rawTables] = await Promise.all([
      prisma.tableSection.findMany({
        where: { branchId, isActive: true },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.diningTable.findMany({
        where: { branchId, isActive: true },
        include: {
          section: true,
        },
        orderBy: [{ sortOrder: 'asc' }, { tableNumber: 'asc' }],
      }),
    ]);

    // Fetch active open orders for occupied or bill_printed tables
    const activeOrderIds = rawTables
      .map((t) => t.activeOrderId)
      .filter((id): id is string => Boolean(id));

    const activeOrders = activeOrderIds.length > 0
      ? await prisma.order.findMany({
          where: { id: { in: activeOrderIds }, isTabOpen: true },
          include: { items: { include: { modifiers: true } } },
        })
      : [];

    const orderMap = new Map(activeOrders.map((o) => [o.id, o]));
    const now = Date.now();

    const tables: TableItemView[] = rawTables.map((table) => {
      const order = table.activeOrderId ? orderMap.get(table.activeOrderId) : null;

      let activeOrderView = null;
      if (order) {
        const openedAtMs = order.createdAt.getTime();
        const minutesSeated = Math.max(0, Math.floor((now - openedAtMs) / 60000));

        activeOrderView = {
          id: order.id,
          orderNumber: order.orderNumber,
          guestCount: order.guestCount,
          itemsCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
          subtotalMinor: order.subtotalMinor,
          taxMinor: order.taxMinor,
          totalMinor: order.totalMinor,
          openedAt: order.createdAt,
          minutesSeated,
          billPrintedAt: order.billPrintedAt,
          items: order.items.map((item) => ({
            id: item.id,
            productNameAr: item.productNameAr,
            sizeNameAr: item.sizeNameAr,
            unitPriceMinor: item.unitPriceMinor,
            quantity: item.quantity,
            totalPriceMinor: item.totalPriceMinor,
            modifiers: item.modifiers.map((m) => ({
              modifierId: m.modifierId,
              nameAr: m.nameAr,
              priceDeltaMinor: m.priceDeltaMinor,
            })),
          })),
        };
      }

      return {
        id: table.id,
        tableNumber: table.tableNumber,
        capacity: table.capacity,
        status: table.status as TableStatus,
        shape: table.shape,
        sectionId: table.sectionId,
        sectionNameAr: table.section?.nameAr ?? null,
        sectionNameEn: table.section?.nameEn ?? null,
        activeOrderId: table.activeOrderId,
        activeOrder: activeOrderView,
      };
    });

    return {
      sections: sections.map((s) => ({
        id: s.id,
        nameAr: s.nameAr,
        nameEn: s.nameEn,
        sortOrder: s.sortOrder,
      })),
      tables,
    };
  }
}
