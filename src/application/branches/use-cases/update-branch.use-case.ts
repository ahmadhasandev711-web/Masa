import { prisma } from '../../../infrastructure/db/prisma';
import { NotFoundError, ConflictError } from '../../../domain/shared/errors/domain-error';
import { UpdateBranchDto, updateBranchSchema } from '../dto/branch.dto';

export class UpdateBranchUseCase {
  public async execute(branchId: string, dto: UpdateBranchDto) {
    const validated = updateBranchSchema.parse(dto);

    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
    });

    if (!branch) {
      throw new NotFoundError('Branch', branchId);
    }

    if (validated.code && validated.code !== branch.code) {
      const existingCode = await prisma.branch.findUnique({
        where: { code: validated.code },
      });
      if (existingCode) {
        throw new ConflictError(`Branch with code '${validated.code}' already exists`);
      }
    }

    return await prisma.branch.update({
      where: { id: branchId },
      data: validated,
    });
  }
}
