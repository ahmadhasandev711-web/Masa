import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { prisma } from '../../src/infrastructure/db/prisma';
import { CreateStaffUseCase } from '../../src/application/staff/use-cases/create-staff.use-case';
import { UpdateStaffUseCase } from '../../src/application/staff/use-cases/update-staff.use-case';
import { ResetStaffPasswordUseCase } from '../../src/application/staff/use-cases/reset-staff-password.use-case';
import { ToggleStaffStatusUseCase } from '../../src/application/staff/use-cases/toggle-staff-status.use-case';
import { PasswordService } from '../../src/infrastructure/auth/password.service';
import { ValidationError } from '../../src/domain/shared/errors/domain-error';

describe('Staff Management Use Cases', () => {
  const createStaff = new CreateStaffUseCase();
  const updateStaff = new UpdateStaffUseCase();
  const resetPassword = new ResetStaffPasswordUseCase();
  const toggleStatus = new ToggleStaffStatusUseCase();

  let testRoleId: string;
  let anotherRoleId: string;
  let testBranchId: string;
  let testUserId: string;

  const testUsername = `staff_${Date.now().toString().slice(-4)}`;

  beforeAll(async () => {
    const roles = await prisma.role.findMany({ take: 2 });
    testRoleId = roles[0].id;
    anotherRoleId = roles[1]?.id ?? roles[0].id;

    const branch = await prisma.branch.findFirstOrThrow({ where: { isActive: true } });
    testBranchId = branch.id;

    const created = await createStaff.execute({
      username: testUsername,
      fullName: 'موظف تجريبي',
      phone: '01055554444',
      password: 'password123',
      roleId: testRoleId,
      branchIds: [testBranchId],
    });
    testUserId = created.id;
  });

  afterAll(async () => {
    if (testUserId) {
      await prisma.userBranch.deleteMany({ where: { userId: testUserId } });
      await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
    }
  });

  it('updates staff profile, role, and branch assignments', async () => {
    const updated = await updateStaff.execute({
      userId: testUserId,
      fullName: 'موظف تجريبي محدث',
      phone: '01077778888',
      roleId: anotherRoleId,
      branchIds: [testBranchId],
    });

    expect(updated.fullName).toBe('موظف تجريبي محدث');
    expect(updated.phone).toBe('01077778888');
    expect(updated.roleId).toBe(anotherRoleId);
    expect(updated.userBranches.length).toBe(1);
    expect(updated.userBranches[0].branch.id).toBe(testBranchId);
  });

  it('resets staff password and verifies hash with PasswordService', async () => {
    await resetPassword.execute({
      userId: testUserId,
      newPassword: 'newSecretPassword99',
    });

    const user = await prisma.user.findUniqueOrThrow({ where: { id: testUserId } });
    const isOldValid = await PasswordService.compare('password123', user.passwordHash);
    const isNewValid = await PasswordService.compare('newSecretPassword99', user.passwordHash);

    expect(isOldValid).toBe(false);
    expect(isNewValid).toBe(true);
  });

  it('toggles staff active status', async () => {
    // Deactivate
    const deactivated = await toggleStatus.execute(testUserId, false, 'different-admin-id');
    expect(deactivated.isActive).toBe(false);

    // Reactivate
    const reactivated = await toggleStatus.execute(testUserId, true, 'different-admin-id');
    expect(reactivated.isActive).toBe(true);
  });

  it('prevents user from deactivating their own account', async () => {
    await expect(
      toggleStatus.execute(testUserId, false, testUserId)
    ).rejects.toThrow(ValidationError);
  });
});
