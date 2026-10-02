import { prisma } from '../../../infrastructure/db/prisma';
import { NotFoundError, ValidationError } from '../../../domain/shared/errors/domain-error';
import {
  CreateTableSectionDto,
  createTableSectionSchema,
  UpdateTableSectionDto,
  updateTableSectionSchema,
} from '../dto/table.dto';

export class ManageSectionsUseCase {
  public async create(dto: CreateTableSectionDto) {
    const validated = createTableSectionSchema.parse(dto);

    return prisma.tableSection.create({
      data: {
        branchId: validated.branchId,
        nameAr: validated.nameAr.trim(),
        nameEn: validated.nameEn.trim(),
        sortOrder: validated.sortOrder,
      },
    });
  }

  public async update(dto: UpdateTableSectionDto) {
    const validated = updateTableSectionSchema.parse(dto);

    const existing = await prisma.tableSection.findUnique({ where: { id: validated.id } });
    if (!existing) {
      throw new NotFoundError('قسم الصالة', validated.id);
    }

    return prisma.tableSection.update({
      where: { id: validated.id },
      data: {
        nameAr: validated.nameAr?.trim(),
        nameEn: validated.nameEn?.trim(),
        sortOrder: validated.sortOrder,
        isActive: validated.isActive,
      },
    });
  }

  public async delete(id: string) {
    const existing = await prisma.tableSection.findUnique({
      where: { id },
      include: { tables: { where: { isActive: true } } },
    });

    if (!existing) {
      throw new NotFoundError('قسم الصالة', id);
    }

    if (existing.tables.length > 0) {
      throw new ValidationError('لا يمكن حذف القسم لوجود طاولات مرتبطة به. يرجى نقل أو حذف الطاولات أولاً.');
    }

    return prisma.tableSection.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
