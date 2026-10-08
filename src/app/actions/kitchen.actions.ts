'use server';

import { SessionService } from '../../infrastructure/auth/session.service';
import { BranchContextService } from '../../infrastructure/auth/branch-context.service';
import { PermissionCode } from '../../domain/staff/enums/permission.enum';
import { ActionResult, toActionFailure } from './action-result';
import {
  GetKitchenOrdersDto,
  BumpKitchenOrderDto,
  ToggleKitchenItemPreparedDto,
} from '../../application/kitchen/dto/kitchen.dto';
import { GetKitchenOrdersUseCase } from '../../application/kitchen/use-cases/get-kitchen-orders.use-case';
import { BumpKitchenOrderUseCase } from '../../application/kitchen/use-cases/bump-kitchen-order.use-case';
import { ToggleKitchenItemPreparedUseCase } from '../../application/kitchen/use-cases/toggle-kitchen-item-prepared.use-case';

export async function getKitchenOrdersAction(
  input: GetKitchenOrdersDto = {}
): Promise<ActionResult<Awaited<ReturnType<GetKitchenOrdersUseCase['execute']>>>> {
  try {
    const session = await SessionService.requireAnyPermission(
      [PermissionCode.KITCHEN_VIEW, PermissionCode.MANAGE_ORDERS],
      'لا تملك صلاحية عرض شاشة المطبخ'
    );

    let effectiveBranchId = input.branchId;
    if (!session.isSuperAdmin) {
      effectiveBranchId = await BranchContextService.assertBranchAccess(session, input.branchId);
    } else if (input.branchId) {
      await BranchContextService.assertBranchAccess(session, input.branchId);
    }

    const data = await new GetKitchenOrdersUseCase().execute({ branchId: effectiveBranchId });
    return { success: true, data };
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function bumpKitchenOrderAction(
  input: BumpKitchenOrderDto
): Promise<ActionResult<Awaited<ReturnType<BumpKitchenOrderUseCase['execute']>>>> {
  try {
    const session = await SessionService.requireAnyPermission(
      [PermissionCode.KITCHEN_BUMP, PermissionCode.MANAGE_ORDERS],
      'لا تملك صلاحية تجهيز وإنهاء طلبات المطبخ'
    );

    await BranchContextService.assertBranchAccess(session, input.branchId);

    const data = await new BumpKitchenOrderUseCase().execute(input);
    return { success: true, data };
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function toggleKitchenItemPreparedAction(
  input: ToggleKitchenItemPreparedDto
): Promise<ActionResult<Awaited<ReturnType<ToggleKitchenItemPreparedUseCase['execute']>>>> {
  try {
    const session = await SessionService.requireAnyPermission(
      [PermissionCode.KITCHEN_VIEW, PermissionCode.KITCHEN_BUMP, PermissionCode.MANAGE_ORDERS],
      'لا تملك صلاحية تحديث حالة صنف المطبخ'
    );

    if (input.branchId) {
      await BranchContextService.assertBranchAccess(session, input.branchId);
    }

    const scope = BranchContextService.scopeOf(session);
    const data = await new ToggleKitchenItemPreparedUseCase().execute(input, scope);
    return { success: true, data };
  } catch (error) {
    return toActionFailure(error);
  }
}
