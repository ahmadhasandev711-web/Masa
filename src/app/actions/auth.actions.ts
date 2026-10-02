'use server';

import { redirect } from 'next/navigation';
import { AuthenticateStaffUseCase } from '../../application/staff/use-cases/authenticate-staff.use-case';
import { loginSchema } from '../../application/staff/dto/staff.dto';
import { SessionService } from '../../infrastructure/auth/session.service';
import { toActionFailure } from './action-result';
import { PermissionCode } from '../../domain/staff/enums/permission.enum';

export async function loginAction(_previous: { error?: string }, formData: FormData) {
  let destination = '/admin/menu';
  try {
    const credentials = loginSchema.parse({
      username: formData.get('username'),
      password: formData.get('password'),
      branchId: formData.get('branchId') || undefined,
    });
    const result = await new AuthenticateStaffUseCase().execute(credentials);
    await SessionService.write(result.token);
    if (result.user.permissions.includes(PermissionCode.POS_ACCESS) && !result.user.permissions.includes(PermissionCode.MANAGE_MENU)) destination = '/pos';
  } catch (error) {
    const failure = toActionFailure(error);
    return { error: failure.success ? undefined : failure.error };
  }

  redirect(destination);
}

export async function logoutAction(): Promise<void> {
  await SessionService.clear();
  redirect('/login');
}
