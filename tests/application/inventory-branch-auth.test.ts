import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../src/infrastructure/db/prisma';
import { BranchContextService, UserSessionContext } from '../../src/infrastructure/auth/branch-context.service';
import { ForbiddenError, NotFoundError } from '../../src/domain/shared/errors/domain-error';

describe('Inventory Branch Scoping & Authorization (GR-8.3 & GR-1.4)', () => {
  let branchAId: string;
  let branchBId: string;
  let inactiveBranchId: string;

  beforeAll(async () => {
    // Create Branch A
    const bA = await prisma.branch.create({
      data: {
        code: 'BR-AUTH-A-' + Date.now().toString().slice(-4),
        nameAr: 'فرع المعادي فحص',
        nameEn: 'Maadi Branch Test',
        phone: '01099999901',
        address: 'المعادي',
        isActive: true,
      },
    });
    branchAId = bA.id;

    // Create Branch B
    const bB = await prisma.branch.create({
      data: {
        code: 'BR-AUTH-B-' + Date.now().toString().slice(-4),
        nameAr: 'فرع مدينة نصر فحص',
        nameEn: 'Nasr City Branch Test',
        phone: '01099999902',
        address: 'مدينة نصر',
        isActive: true,
      },
    });
    branchBId = bB.id;

    // Create Inactive Branch
    const bInactive = await prisma.branch.create({
      data: {
        code: 'BR-INACT-' + Date.now().toString().slice(-4),
        nameAr: 'فرع مغلق فحص',
        nameEn: 'Inactive Branch Test',
        phone: '01099999903',
        address: 'مغلق',
        isActive: false,
      },
    });
    inactiveBranchId = bInactive.id;
  });

  afterAll(async () => {
    await prisma.branch.deleteMany({
      where: { id: { in: [branchAId, branchBId, inactiveBranchId] } },
    });
  });

  it('allows super admin global access to any active branch', async () => {
    const superAdminSession: UserSessionContext = {
      userId: 'admin-id',
      role: 'SUPER_ADMIN',
      permissions: ['MANAGE_INVENTORY'],
      assignedBranchIds: [branchAId],
      isSuperAdmin: true,
    };

    const resolvedA = await BranchContextService.assertBranchAccess(superAdminSession, branchAId);
    expect(resolvedA).toBe(branchAId);

    const resolvedB = await BranchContextService.assertBranchAccess(superAdminSession, branchBId);
    expect(resolvedB).toBe(branchBId);
  });

  it('allows staff access to their assigned branch', async () => {
    const branchStaffSession: UserSessionContext = {
      userId: 'staff-id',
      role: 'BRANCH_MANAGER',
      permissions: ['MANAGE_INVENTORY'],
      assignedBranchIds: [branchAId],
      isSuperAdmin: false,
    };

    const resolved = await BranchContextService.assertBranchAccess(branchStaffSession, branchAId);
    expect(resolved).toBe(branchAId);
  });

  it('forbids staff from accessing a branch they are NOT assigned to', async () => {
    const branchStaffSession: UserSessionContext = {
      userId: 'staff-id',
      role: 'BRANCH_MANAGER',
      permissions: ['MANAGE_INVENTORY'],
      assignedBranchIds: [branchAId],
      isSuperAdmin: false,
    };

    await expect(
      BranchContextService.assertBranchAccess(branchStaffSession, branchBId)
    ).rejects.toThrow(ForbiddenError);
  });

  it('forbids access to an inactive branch even if assigned', async () => {
    const staffSession: UserSessionContext = {
      userId: 'staff-id',
      role: 'BRANCH_MANAGER',
      permissions: ['MANAGE_INVENTORY'],
      assignedBranchIds: [inactiveBranchId],
      isSuperAdmin: false,
    };

    await expect(
      BranchContextService.assertBranchAccess(staffSession, inactiveBranchId)
    ).rejects.toThrow(ForbiddenError);
  });

  it('throws NotFoundError for non-existent branch ID', async () => {
    const superAdminSession: UserSessionContext = {
      userId: 'admin-id',
      role: 'SUPER_ADMIN',
      permissions: ['MANAGE_INVENTORY'],
      assignedBranchIds: [],
      isSuperAdmin: true,
    };

    await expect(
      BranchContextService.assertBranchAccess(superAdminSession, 'non-existent-branch-id-9999')
    ).rejects.toThrow(NotFoundError);
  });

  it('falls back to assigned branch when requested branch is not specified', async () => {
    const staffSession: UserSessionContext = {
      userId: 'staff-id',
      role: 'BRANCH_MANAGER',
      permissions: ['MANAGE_INVENTORY'],
      assignedBranchIds: [branchBId],
      isSuperAdmin: false,
    };

    const resolved = await BranchContextService.assertBranchAccess(staffSession, null);
    expect(resolved).toBe(branchBId);
  });
});
