import { ListCustomersUseCase } from '../../../../application/customers/use-cases/list-customers.use-case';
import { prisma } from '../../../../infrastructure/db/prisma';
import { CustomersClient } from './customers-client';
import { assertPagePermission } from '../../../../infrastructure/auth/page-guard';
import { PermissionCode } from '../../../../domain/staff/enums/permission.enum';

export default async function CustomersPage() {
  await assertPagePermission(PermissionCode.MANAGE_CUSTOMERS);

  const [listResult, setting] = await Promise.all([
    new ListCustomersUseCase().execute({ page: 1, limit: 50 }),
    prisma.restaurantSetting.findFirst(),
  ]);

  return (
    <CustomersClient
      initialCustomers={listResult.items}
      initialTotal={listResult.total}
      currencySymbol={setting?.currencySymbol ?? 'ج.م'}
    />
  );
}
