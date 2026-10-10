import { prisma } from '../../../infrastructure/db/prisma';
import { ListCustomersQueryDto, listCustomersQuerySchema } from '../dto/customer.dto';

export class ListCustomersUseCase {
  public async execute(query: Partial<ListCustomersQueryDto> = {}) {
    const validated = listCustomersQuerySchema.parse(query);
    const skip = (validated.page - 1) * validated.limit;

    const where: Record<string, unknown> = {
      deletedAt: null,
    };

    if (validated.term && validated.term.trim().length > 0) {
      const term = validated.term.trim();
      where.OR = [
        { fullName: { contains: term } },
        { phone: { contains: term } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        skip,
        take: validated.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          addresses: {
            take: 1,
            where: { isDefault: true },
          },
          _count: {
            select: { addresses: true },
          },
        },
      }),
    ]);

    return {
      items,
      total,
      page: validated.page,
      limit: validated.limit,
      totalPages: Math.ceil(total / validated.limit),
    };
  }
}
