import { GetCatalogUseCase } from '../../../../application/catalog/use-cases/get-catalog.use-case';
import { MenuManager } from './menu-manager';
import { assertPagePermission } from '../../../../infrastructure/auth/page-guard';
import { PermissionCode } from '../../../../domain/staff/enums/permission.enum';
import { prisma } from '../../../../infrastructure/db/prisma';

export default async function MenuPage() {
  await assertPagePermission(PermissionCode.MANAGE_MENU);

  const [catalog, setting] = await Promise.all([
    new GetCatalogUseCase().execute(),
    prisma.restaurantSetting.findFirst(),
  ]);

  return (
    <MenuManager
      {...catalog}
      restaurantNameAr={setting?.nameAr || 'المطعم'}
      restaurantNameEn={setting?.nameEn || 'Restaurant'}
    />
  );
}

