'use server';

import { SessionService } from '../../infrastructure/auth/session.service';
import { BranchContextService } from '../../infrastructure/auth/branch-context.service';
import { PermissionCode } from '../../domain/staff/enums/permission.enum';
import { ActionResult, toActionFailure } from './action-result';
import {
  SaveDriverDto,
  DispatchOrderDto,
} from '../../application/delivery/dto/delivery.dto';
import { ListBranchDriversUseCase } from '../../application/delivery/use-cases/list-branch-drivers.use-case';
import { SaveDriverUseCase } from '../../application/delivery/use-cases/save-driver.use-case';
import { DispatchOrderUseCase } from '../../application/delivery/use-cases/dispatch-order.use-case';
import { GetDriverPendingSettlementUseCase } from '../../application/delivery/use-cases/get-driver-pending-settlement.use-case';
import { SettleDriverCashUseCase } from '../../application/delivery/use-cases/settle-driver-cash.use-case';

// 1. List Branch Drivers
export async function listBranchDriversAction(
  branchId: string
): Promise<ActionResult<Awaited<ReturnType<ListBranchDriversUseCase['execute']>>>> {
  try {
    const session = await SessionService.getCurrent();
    if (!session) return toActionFailure(new Error('يرجى تسجيل الدخول'));

    const hasAccess =
      session.isSuperAdmin ||
      session.permissions.includes(PermissionCode.MANAGE_ORDERS) ||
      session.permissions.includes(PermissionCode.POS_ACCESS);
    if (!hasAccess) return toActionFailure(new Error('لا تملك صلاحية استعراض طياري التوصيل'));

    BranchContextService.assertBranchAccess(session, branchId);
    const result = await new ListBranchDriversUseCase().execute(branchId);
    return { success: true, data: result };
  } catch (error) {
    return toActionFailure(error);
  }
}

// 2. Save Driver
export async function saveDriverAction(
  input: SaveDriverDto
): Promise<ActionResult<Awaited<ReturnType<SaveDriverUseCase['execute']>>>> {
  try {
    const session = await SessionService.getCurrent();
    if (!session) return toActionFailure(new Error('يرجى تسجيل الدخول'));

    const hasAccess =
      session.isSuperAdmin ||
      session.permissions.includes(PermissionCode.MANAGE_ORDERS) ||
      session.permissions.includes(PermissionCode.MANAGE_STAFF);
    if (!hasAccess) return toActionFailure(new Error('لا تملك صلاحية إدارة طياري التوصيل'));

    BranchContextService.assertBranchAccess(session, input.branchId);
    const result = await new SaveDriverUseCase().execute(input);
    return { success: true, data: result };
  } catch (error) {
    return toActionFailure(error);
  }
}

// 3. Dispatch Orders to Driver
export async function dispatchOrdersAction(
  input: DispatchOrderDto
): Promise<ActionResult<Awaited<ReturnType<DispatchOrderUseCase['execute']>>>> {
  try {
    const session = await SessionService.getCurrent();
    if (!session) return toActionFailure(new Error('يرجى تسجيل الدخول'));

    const hasAccess =
      session.isSuperAdmin ||
      session.permissions.includes(PermissionCode.MANAGE_ORDERS);
    if (!hasAccess) return toActionFailure(new Error('لا تملك صلاحية إسناد وتوزيع الطلبات'));

    BranchContextService.assertBranchAccess(session, input.branchId);
    const result = await new DispatchOrderUseCase().execute(input);
    return { success: true, data: result };
  } catch (error) {
    return toActionFailure(error);
  }
}

// 4. Get Driver Pending Settlement
export async function getDriverPendingSettlementAction(
  driverId: string
): Promise<ActionResult<Awaited<ReturnType<GetDriverPendingSettlementUseCase['execute']>>>> {
  try {
    const session = await SessionService.getCurrent();
    if (!session) return toActionFailure(new Error('يرجى تسجيل الدخول'));

    const hasAccess =
      session.isSuperAdmin ||
      session.permissions.includes(PermissionCode.MANAGE_ORDERS) ||
      session.permissions.includes(PermissionCode.MANAGE_FINANCE);
    if (!hasAccess) return toActionFailure(new Error('لا تملك صلاحية استعراض حسابات عهدة الطيار'));

    const result = await new GetDriverPendingSettlementUseCase().execute(driverId);
    BranchContextService.assertBranchAccess(session, result.driver.branchId);
    return { success: true, data: result };
  } catch (error) {
    return toActionFailure(error);
  }
}

// 5. Settle Driver Cash
export async function settleDriverCashAction(input: {
  branchId: string;
  driverId: string;
  notes?: string;
}): Promise<ActionResult<Awaited<ReturnType<SettleDriverCashUseCase['execute']>>>> {
  try {
    const session = await SessionService.getCurrent();
    if (!session) return toActionFailure(new Error('يرجى تسجيل الدخول'));

    const hasAccess =
      session.isSuperAdmin ||
      session.permissions.includes(PermissionCode.MANAGE_ORDERS) ||
      session.permissions.includes(PermissionCode.MANAGE_FINANCE);
    if (!hasAccess) return toActionFailure(new Error('لا تملك صلاحية تسوية العهد النقدية'));

    BranchContextService.assertBranchAccess(session, input.branchId);
    const result = await new SettleDriverCashUseCase().execute({
      branchId: input.branchId,
      driverId: input.driverId,
      cashierId: session.userId,
      notes: input.notes,
    });
    return { success: true, data: result };
  } catch (error) {
    return toActionFailure(error);
  }
}
