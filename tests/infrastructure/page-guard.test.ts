import { describe, it, expect, vi, beforeEach } from 'vitest';
import { assertPagePermission } from '../../src/infrastructure/auth/page-guard';
import { PermissionCode } from '../../src/domain/staff/enums/permission.enum';
import { SessionService } from '../../src/infrastructure/auth/session.service';
import { redirect } from 'next/navigation';

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock('../../src/infrastructure/auth/session.service', () => ({
  SessionService: {
    getCurrent: vi.fn(),
  },
}));

describe('assertPagePermission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects unauthenticated user to /login', async () => {
    vi.mocked(SessionService.getCurrent).mockResolvedValue(null);

    await expect(assertPagePermission(PermissionCode.MANAGE_BRANCHES)).rejects.toThrow(
      'NEXT_REDIRECT:/login'
    );
    expect(redirect).toHaveBeenCalledWith('/login');
  });

  it('redirects unauthorized user to default /admin fallback', async () => {
    vi.mocked(SessionService.getCurrent).mockResolvedValue({
      userId: 'user-1',
      role: 'CASHIER',
      permissions: [PermissionCode.POS_ACCESS],
      assignedBranchIds: ['branch-1'],
      isSuperAdmin: false,
    });

    await expect(assertPagePermission(PermissionCode.MANAGE_BRANCHES)).rejects.toThrow(
      'NEXT_REDIRECT:/admin'
    );
    expect(redirect).toHaveBeenCalledWith('/admin');
  });

  it('allows access and returns session for authorized user', async () => {
    const mockSession = {
      userId: 'user-2',
      role: 'BRANCH_MANAGER',
      permissions: [PermissionCode.MANAGE_BRANCHES],
      assignedBranchIds: ['branch-1'],
      isSuperAdmin: false,
    };
    vi.mocked(SessionService.getCurrent).mockResolvedValue(mockSession);

    const session = await assertPagePermission(PermissionCode.MANAGE_BRANCHES);
    expect(session).toEqual(mockSession);
    expect(redirect).not.toHaveBeenCalled();
  });

  it('allows super admin to bypass capability checks', async () => {
    const superAdminSession = {
      userId: 'user-admin',
      role: 'SUPER_ADMIN',
      permissions: [],
      assignedBranchIds: [],
      isSuperAdmin: true,
    };
    vi.mocked(SessionService.getCurrent).mockResolvedValue(superAdminSession);

    const session = await assertPagePermission(PermissionCode.MANAGE_SETTINGS);
    expect(session).toEqual(superAdminSession);
    expect(redirect).not.toHaveBeenCalled();
  });

  it('redirects unauthorized user to custom fallback URL when provided', async () => {
    vi.mocked(SessionService.getCurrent).mockResolvedValue({
      userId: 'user-3',
      role: 'KITCHEN',
      permissions: [PermissionCode.MANAGE_ORDERS],
      assignedBranchIds: ['branch-1'],
      isSuperAdmin: false,
    });

    await expect(
      assertPagePermission(PermissionCode.MANAGE_SETTINGS, '/admin/forbidden')
    ).rejects.toThrow('NEXT_REDIRECT:/admin/forbidden');
    expect(redirect).toHaveBeenCalledWith('/admin/forbidden');
  });
});
