import { prisma } from '../../../infrastructure/db/prisma';
import { UnauthorizedError } from '../../../domain/shared/errors/domain-error';
import { PasswordService } from '../../../infrastructure/auth/password.service';
import { JwtService } from '../../../infrastructure/auth/jwt.service';
import { BranchContextService } from '../../../infrastructure/auth/branch-context.service';
import { LoginDto, loginSchema } from '../dto/staff.dto';
import { SystemRole } from '../../../domain/staff/enums/role.enum';

export class AuthenticateStaffUseCase {
  public async execute(input: LoginDto) {
    const validated = loginSchema.parse(input);

    const user = await prisma.user.findUnique({
      where: { username: validated.username },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
        userBranches: {
          include: { branch: true },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('اسم المستخدم أو كلمة المرور غير صحيحة أو الحساب غير مفعل');
    }

    const isPasswordValid = await PasswordService.compare(validated.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('اسم المستخدم أو كلمة المرور غير صحيحة');
    }

    const isSuperAdmin = user.role.name === SystemRole.SUPER_ADMIN;
    const permissions = user.role.permissions.map((p) => p.permission.code);
    const assignedBranchIds = user.userBranches.map((ub) => ub.branchId);

    // Resolve active branch scope
    const activeBranchId = await BranchContextService.assertBranchAccess(
      {
        userId: user.id,
        role: user.role.name,
        permissions,
        assignedBranchIds,
        isSuperAdmin,
      },
      validated.branchId
    );

    const token = await JwtService.sign({
      userId: user.id,
      role: user.role.name,
      branchId: activeBranchId,
      permissions,
      isSuperAdmin,
    });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role.name,
        activeBranchId,
        permissions,
      },
    };
  }
}
