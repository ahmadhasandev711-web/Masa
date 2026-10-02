import { prisma } from '../../../infrastructure/db/prisma';

export interface ListEventBookingsFilter {
  branchId?: string;
  status?: string;
}

export class ListEventBookingsUseCase {
  async execute(filter?: ListEventBookingsFilter) {
    const where: Record<string, unknown> = {};
    if (filter?.branchId && filter.branchId !== 'ALL') {
      where.branchId = filter.branchId;
    }
    if (filter?.status && filter.status !== 'ALL') {
      where.status = filter.status;
    }

    const bookings = await prisma.eventBooking.findMany({
      where,
      include: {
        branch: {
          select: {
            id: true,
            code: true,
            nameAr: true,
            nameEn: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return bookings;
  }
}
