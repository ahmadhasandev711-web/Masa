import { prisma } from '../src/infrastructure/db/prisma';
import { PermissionCode, SYSTEM_PERMISSIONS } from '../src/domain/staff/enums/permission.enum';
import { SystemRole } from '../src/domain/staff/enums/role.enum';

async function syncPosPermission() {
  const definition = SYSTEM_PERMISSIONS.find((permission) => permission.code === PermissionCode.APPLY_POS_DISCOUNT)!;
  const permission = await prisma.permission.upsert({ where: { code: definition.code }, update: definition, create: definition });
  const roles = await prisma.role.findMany({ where: { name: { in: [SystemRole.SUPER_ADMIN, SystemRole.BRANCH_MANAGER] } }, select: { id: true } });
  for (const role of roles) await prisma.rolePermission.upsert({
    where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
    create: { roleId: role.id, permissionId: permission.id }, update: {},
  });
  console.log('POS discount permission synchronized for existing administrator and branch-manager roles.');
}
syncPosPermission().finally(() => prisma.$disconnect());
