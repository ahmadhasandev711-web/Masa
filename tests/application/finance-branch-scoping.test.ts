import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../src/infrastructure/db/prisma';
import { BranchContextService, UserSessionContext } from '../../src/infrastructure/auth/branch-context.service';
import { ForbiddenError } from '../../src/domain/shared/errors/domain-error';
import { PrismaFinanceRepository } from '../../src/infrastructure/finance/prisma-finance.repository';
import { CashMovementType } from '../../src/domain/finance/enums';

describe('Finance Branch Scoping & Isolation (GR-8.3 & GR-1.4)', () => {
  let branchAId: string;
  let branchBId: string;
  let inactiveBranchId: string;
  let testUserId: string;
  let shiftAId: string;

  beforeAll(async () => {
    // 1. Create Branch A
    const bA = await prisma.branch.create({
      data: {
        code: 'BR-FIN-A-' + Date.now().toString().slice(-4),
        nameAr: 'فرع مالي أ',
        nameEn: 'Finance Branch A',
        phone: '01011111111',
        address: 'فرع أ',
        isActive: true,
      },
    });
    branchAId = bA.id;

    // 2. Create Branch B
    const bB = await prisma.branch.create({
      data: {
        code: 'BR-FIN-B-' + Date.now().toString().slice(-4),
        nameAr: 'فرع مالي ب',
        nameEn: 'Finance Branch B',
        phone: '01022222222',
        address: 'فرع ب',
        isActive: true,
      },
    });
    branchBId = bB.id;

    // 3. Create Inactive Branch
    const bInact = await prisma.branch.create({
      data: {
        code: 'BR-FIN-OFF-' + Date.now().toString().slice(-4),
        nameAr: 'فرع مالي مغلق',
        nameEn: 'Finance Branch Closed',
        phone: '01033333333',
        address: 'مغلق',
        isActive: false,
      },
    });
    inactiveBranchId = bInact.id;

    // 4. Create a test staff user
    const role = await prisma.role.findFirst({ where: { name: 'CASHIER' } })
      ?? await prisma.role.findFirst();

    const user = await prisma.user.create({
      data: {
        username: 'fin_test_user_' + Date.now(),
        fullName: 'كاشير فحص المالية',
        phone: '01044444444',
        passwordHash: 'dummy',
        isActive: true,
        roleId: role!.id,
      },
    });
    testUserId = user.id;

    // 5. Create a shift in Branch A
    const shiftA = await prisma.cashShift.create({
      data: {
        branchId: branchAId,
        cashierId: testUserId,
        openingCashMinor: 50000,
        currency: 'EGP',
        status: 'OPEN',
      },
    });
    shiftAId = shiftA.id;
  });

  afterAll(async () => {
    // Cleanup in reverse dependency order
    await prisma.cashShiftMovement.deleteMany({ where: { cashShiftId: shiftAId } });
    await prisma.expense.deleteMany({ where: { branchId: { in: [branchAId, branchBId, inactiveBranchId] } } });
    await prisma.cashShift.deleteMany({ where: { id: shiftAId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
    await prisma.branch.deleteMany({ where: { id: { in: [branchAId, branchBId, inactiveBranchId] } } });
  });

  it('allows staff to access their assigned branch', async () => {
    const sessionBranchA: UserSessionContext = {
      userId: testUserId,
      role: 'BRANCH_MANAGER',
      permissions: ['MANAGE_FINANCE'],
      assignedBranchIds: [branchAId],
      isSuperAdmin: false,
    };

    await expect(
      BranchContextService.assertBranchAccess(sessionBranchA, branchAId)
    ).resolves.not.toThrow();
  });

  it('rejects staff attempting to access an unassigned branch (ForbiddenError)', async () => {
    const sessionBranchA: UserSessionContext = {
      userId: testUserId,
      role: 'BRANCH_MANAGER',
      permissions: ['MANAGE_FINANCE'],
      assignedBranchIds: [branchAId], // Assigned only to Branch A
      isSuperAdmin: false,
    };

    await expect(
      BranchContextService.assertBranchAccess(sessionBranchA, branchBId)
    ).rejects.toThrow(ForbiddenError);
  });

  it('allows Super Admin to access any active branch', async () => {
    const superAdminSession: UserSessionContext = {
      userId: 'super-admin-id',
      role: 'SUPER_ADMIN',
      permissions: ['MANAGE_FINANCE'],
      assignedBranchIds: [],
      isSuperAdmin: true,
    };

    await expect(
      BranchContextService.assertBranchAccess(superAdminSession, branchBId)
    ).resolves.not.toThrow();
  });

  it('rejects access to inactive branch even if assigned (NotFoundError)', async () => {
    const sessionInactive: UserSessionContext = {
      userId: testUserId,
      role: 'BRANCH_MANAGER',
      permissions: ['MANAGE_FINANCE'],
      assignedBranchIds: [inactiveBranchId],
      isSuperAdmin: false,
    };

    await expect(
      BranchContextService.assertBranchAccess(sessionInactive, inactiveBranchId)
    ).rejects.toThrow(ForbiddenError);
  });

  it('rejects recording cash movements across branch boundaries in PrismaFinanceRepository', async () => {
    const repo = new PrismaFinanceRepository();

    // Trying to record movement for shiftA (in Branch A) while passing Branch B id
    await expect(
      repo.recordMovement({
        shiftId: shiftAId,
        branchId: branchBId, // Incorrect branch!
        type: CashMovementType.CASH_IN,
        amountMinor: 10000,
        reason: 'محاولة اختراق نطاق الفرع',
        performedById: testUserId,
      })
    ).rejects.toThrow();
  });
});
