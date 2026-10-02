import { describe, it, expect, afterAll } from 'vitest';
import { CreateBranchUseCase } from '../../src/application/branches/use-cases/create-branch.use-case';
import { ListBranchesUseCase } from '../../src/application/branches/use-cases/list-branches.use-case';
import { ToggleBranchStatusUseCase } from '../../src/application/branches/use-cases/toggle-branch-status.use-case';
import { UpdateBranchUseCase } from '../../src/application/branches/use-cases/update-branch.use-case';
import { ConflictError } from '../../src/domain/shared/errors/domain-error';
import { prisma } from '../../src/infrastructure/db/prisma';

describe('Branch Use Cases', () => {
  const createUseCase = new CreateBranchUseCase();
  const listUseCase = new ListBranchesUseCase();
  const toggleUseCase = new ToggleBranchStatusUseCase();
  const updateUseCase = new UpdateBranchUseCase();

  const testBranchCode = `TEST-${Date.now().toString().slice(-4)}`;

  afterAll(async () => {
    const testBranches = await prisma.branch.findMany({
      where: { code: { startsWith: 'TEST-' } },
      select: { id: true },
    });
    const ids = testBranches.map((b) => b.id);
    if (ids.length > 0) {
      await prisma.userBranch.deleteMany({ where: { branchId: { in: ids } } });
      await prisma.branchProductAvailability.deleteMany({ where: { branchId: { in: ids } } });
      await prisma.diningTable.deleteMany({ where: { branchId: { in: ids } } });
      await prisma.branchInventory.deleteMany({ where: { branchId: { in: ids } } });
      await prisma.branch.deleteMany({ where: { id: { in: ids } } }).catch(() => {});
    }
  });

  it('creates a new branch successfully', async () => {
    const created = await createUseCase.execute({
      code: testBranchCode,
      nameAr: 'فرع الاختبار',
      nameEn: 'Test Branch',
      phone: '01011112222',
      address: 'شارع التجربة',
    });

    expect(created.id).toBeDefined();
    expect(created.code).toBe(testBranchCode);
    expect(created.isActive).toBe(true);
  });

  it('throws ConflictError when attempting to create duplicate branch code', async () => {
    await expect(
      createUseCase.execute({
        code: testBranchCode,
        nameAr: 'فرع مكرر',
        nameEn: 'Duplicate Branch',
        phone: '01011112222',
        address: 'شارع التجربة',
      })
    ).rejects.toThrow(ConflictError);
  });

  it('lists existing branches from database', async () => {
    const branches = await listUseCase.execute();
    expect(branches.length).toBeGreaterThanOrEqual(1);
    expect(branches.some((b) => b.code === testBranchCode)).toBe(true);
  });

  it('toggles branch active status', async () => {
    const branch = await prisma.branch.findUniqueOrThrow({
      where: { code: testBranchCode },
    });

    const deactivated = await toggleUseCase.execute(branch.id, false);
    expect(deactivated.isActive).toBe(false);

    const reactivated = await toggleUseCase.execute(branch.id, true);
    expect(reactivated.isActive).toBe(true);
  });

  it('updates branch information successfully', async () => {
    const branch = await prisma.branch.findUniqueOrThrow({
      where: { code: testBranchCode },
    });

    const updated = await updateUseCase.execute(branch.id, {
      nameAr: 'فرع الاختبار المحدث',
      nameEn: 'Updated Test Branch',
      phone: '01099998888',
      address: 'شارع التحديث الجديد',
    });

    expect(updated.nameAr).toBe('فرع الاختبار المحدث');
    expect(updated.nameEn).toBe('Updated Test Branch');
    expect(updated.phone).toBe('01099998888');
    expect(updated.address).toBe('شارع التحديث الجديد');
  });
});
