import { prisma } from '../../../../infrastructure/db/prisma';
import { ListStaffUseCase } from '../../../../application/staff/use-cases/list-staff.use-case';
import { ListBranchesUseCase } from '../../../../application/branches/use-cases/list-branches.use-case';
import { StaffClient } from './staff-client';
import { assertPagePermission } from '../../../../infrastructure/auth/page-guard';
import { PermissionCode } from '../../../../domain/staff/enums/permission.enum';

export default async function StaffPage() {
  const session = await assertPagePermission(PermissionCode.MANAGE_STAFF);

  const listStaffUseCase = new ListStaffUseCase();
  const listBranchesUseCase = new ListBranchesUseCase();

  const [staff, roles, branches, permissions] = await Promise.all([
    listStaffUseCase.execute(),
    prisma.role.findMany({
      orderBy: { name: 'asc' },
      include: {
        permissions: {
          include: {
            permission: {
              select: { id: true, code: true, name: true, description: true, category: true },
            },
          },
        },
      },
    }),
    listBranchesUseCase.execute(true),
    prisma.permission.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      select: { id: true, code: true, name: true, description: true, category: true },
    }),
  ]);

  return (
    <StaffClient
      initialStaff={staff}
      roles={roles}
      branches={branches}
      permissions={permissions}
      currentUserId={session.userId}
    />
  );
}
