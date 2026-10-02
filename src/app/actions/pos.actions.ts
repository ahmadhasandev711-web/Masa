'use server';

import { revalidatePath } from 'next/cache';
import { PermissionCode } from '../../domain/staff/enums/permission.enum';
import { BranchContextService } from '../../infrastructure/auth/branch-context.service';
import { RbacGuard } from '../../infrastructure/auth/rbac-guard';
import { SessionService } from '../../infrastructure/auth/session.service';
import { PrismaPosRepository } from '../../infrastructure/pos/prisma-pos.repository';
import { ActionResult, toActionFailure } from './action-result';
import { PosReceipt, PosShift, PosShiftClose } from '../../domain/pos/contracts/pos.repository';
import { CloseCashShiftDto, CreatePosOrderDto, OpenCashShiftDto } from '../../application/pos/dto/pos.dto';
import { CloseCashShiftUseCase, OpenCashShiftUseCase } from '../../application/pos/use-cases/cash-shift.use-cases';
import { CreatePosOrderUseCase } from '../../application/pos/use-cases/create-pos-order.use-case';

export async function openCashShiftAction(input: OpenCashShiftDto): Promise<ActionResult<PosShift>> {
  try {
    const session = await SessionService.requirePermission(PermissionCode.POS_ACCESS);
    await BranchContextService.assertBranchAccess(session, input.branchId);
    const shift = await new OpenCashShiftUseCase(new PrismaPosRepository()).execute(input, session.userId);
    revalidatePath('/pos');
    return { success: true, data: shift };
  } catch (error) { return toActionFailure(error); }
}
export async function closeCashShiftAction(input: CloseCashShiftDto): Promise<ActionResult<PosShiftClose>> {
  try {
    const session = await SessionService.requirePermission(PermissionCode.POS_ACCESS);
    await BranchContextService.assertBranchAccess(session, input.branchId);
    const result = await new CloseCashShiftUseCase(new PrismaPosRepository()).execute(input, session.userId);
    revalidatePath('/pos');
    return { success: true, data: result };
  } catch (error) { return toActionFailure(error); }
}
export async function createPosOrderAction(input: CreatePosOrderDto): Promise<ActionResult<PosReceipt>> {
  try {
    const session = await SessionService.requirePermission(PermissionCode.POS_ACCESS);
    const branchId = await BranchContextService.assertBranchAccess(session, input.branchId);
    const scope = { branchId, cashierId: session.userId, canDiscount: RbacGuard.hasPermission(session, PermissionCode.APPLY_POS_DISCOUNT) };
    const receipt = await new CreatePosOrderUseCase(new PrismaPosRepository()).execute(input, scope);
    return { success: true, data: receipt };
  } catch (error) { return toActionFailure(error); }
}
