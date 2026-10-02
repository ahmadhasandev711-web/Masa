import { GetCatalogUseCase } from '../../../../application/catalog/use-cases/get-catalog.use-case';
import { MenuManager } from './menu-manager';
import { assertPagePermission } from '../../../../infrastructure/auth/page-guard';
import { PermissionCode } from '../../../../domain/staff/enums/permission.enum';

export default async function MenuPage() {
  await assertPagePermission(PermissionCode.MANAGE_MENU);

  const catalog = await new GetCatalogUseCase().execute();
  return <MenuManager {...catalog} />;
}
