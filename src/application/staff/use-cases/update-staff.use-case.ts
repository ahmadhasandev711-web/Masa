import { prisma } from '../../../infrastructure/db/prisma';
import { NotFoundError } from '../../../domain/shared/errors/domain-error';
import { UpdateStaffDto, updateStaffSchema } from '../dto/staff.dto';

export class UpdateStaffUseCase {
  public async execute(dto: UpdateStaffDto) {
    const validated = updateStaffSchema.parse(dto);

    const user = await prisma.user.findUnique({
      where: { id: validated.userId },
      include: { userBranches: true },
    });

    if (!user) {
      throw new NotFoundError('User', validated.userId);
    }

    // Role verification
    const role = await prisma.role.findUnique({
      where: { id: validated.roleId },
    });
    if (!role) {
      throw new NotFoundError('Role', validated.roleId);
    }

    // Atomic transaction: update user info & sync assigned branches
    return await prisma.$transaction(async (tx) => {
      // 1. Delete removed branch assignments
      await tx.userBranch.deleteMany({
        where: {
          userId: user.id,
          branchId: { notIn: validated.branchIds },
        },
      });

      // 2. Upsert existing/new branch assignments
      for (let i = 0; i < validated.branchIds.length; i++) {
        const bId = validated.branchIds[i];
        await tx.userBranch.upsert({
          where: {
            userId_branchId: {
              userId: user.id,
              branchId: bId,
            },
          },
          update: { isDefault: i === 0 },
          create: {
            userId: user.id,
            branchId: bId,
            isDefault: i === 0,
          },
        });
      }

      // 3. Update user profile
      return await tx.user.update({
        where: { id: user.id },
        data: {
          fullName: validated.fullName,
          phone: validated.phone,
          roleId: validated.roleId,
        },
        include: {
          role: { select: { id: true, name: true, description: true } },
          userBranches: {
            select: {
              isDefault: true,
              branch: { select: { id: true, code: true, nameAr: true } },
            },
          },
        },
      });
    });
  }
}
