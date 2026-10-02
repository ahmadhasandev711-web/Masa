import { prisma } from '../../../infrastructure/db/prisma';
import { ConflictError } from '../../../domain/shared/errors/domain-error';
import { CreateBranchDto, createBranchSchema } from '../dto/branch.dto';
import { Branch } from '../../../domain/branches/entities/branch.entity';

export class CreateBranchUseCase {
  public async execute(input: CreateBranchDto) {
    const validated = createBranchSchema.parse(input);

    const existing = await prisma.branch.findUnique({
      where: { code: validated.code },
    });

    if (existing) {
      throw new ConflictError(`Branch with code '${validated.code}' already exists`);
    }

    const domainBranch = Branch.create(validated);

    return await prisma.branch.create({
      data: {
        id: domainBranch.id,
        code: domainBranch.code,
        nameAr: domainBranch.nameAr,
        nameEn: domainBranch.nameEn,
        phone: domainBranch.phone,
        address: domainBranch.address,
        isActive: domainBranch.isActive,
      },
    });
  }
}
