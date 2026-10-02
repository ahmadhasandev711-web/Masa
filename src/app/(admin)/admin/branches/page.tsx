import { ListBranchesUseCase } from '../../../../application/branches/use-cases/list-branches.use-case';
import { BranchClient } from './branch-client';
import { assertPagePermission } from '../../../../infrastructure/auth/page-guard';
import { PermissionCode } from '../../../../domain/staff/enums/permission.enum';

export default async function BranchesPage() {
  await assertPagePermission(PermissionCode.MANAGE_BRANCHES);

  const useCase = new ListBranchesUseCase();
  const branches = await useCase.execute();

  return <BranchClient initialBranches={branches} />;
}
