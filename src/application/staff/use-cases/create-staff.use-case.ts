import { prisma } from '../../../infrastructure/db/prisma';
import { ConflictError, NotFoundError } from '../../../domain/shared/errors/domain-error';
import { PasswordService } from '../../../infrastructure/auth/password.service';
import { CreateStaffDto, createStaffSchema } from '../dto/staff.dto';
import { User } from '../../../domain/staff/entities/user.entity';

export class CreateStaffUseCase {
  public async execute(input: CreateStaffDto) {
    const validated = createStaffSchema.parse(input);

    const existing = await prisma.user.findUnique({
      where: { username: validated.username },
    });

    if (existing) {
      throw new ConflictError(`User with username '${validated.username}' already exists`);
    }

    const role = await prisma.role.findUnique({
      where: { id: validated.roleId },
    });

    if (!role) {
      throw new NotFoundError('Role', validated.roleId);
    }

    const passwordHash = await PasswordService.hash(validated.password);

    const domainUser = User.create({
      username: validated.username,
      fullName: validated.fullName,
      phone: validated.phone,
      passwordHash,
      roleId: validated.roleId,
      assignedBranchIds: validated.branchIds,
    });

    return await prisma.user.create({
      data: {
        id: domainUser.id,
        username: domainUser.username,
        fullName: domainUser.fullName,
        phone: domainUser.phone,
        passwordHash: domainUser.passwordHash,
        roleId: domainUser.roleId,
        isActive: domainUser.isActive,
        userBranches: {
          create: domainUser.assignedBranchIds.map((branchId, index) => ({
            branchId,
            isDefault: index === 0,
          })),
        },
      },
      include: {
        role: true,
        userBranches: {
          include: { branch: true },
        },
      },
    });
  }
}
