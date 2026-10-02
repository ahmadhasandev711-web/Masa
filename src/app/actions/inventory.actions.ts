'use server';

import { revalidatePath } from 'next/cache';
import { PermissionCode } from '../../domain/staff/enums/permission.enum';
import { SessionService } from '../../infrastructure/auth/session.service';
import { BranchContextService } from '../../infrastructure/auth/branch-context.service';
import { prisma } from '../../infrastructure/db/prisma';
import { NotFoundError } from '../../domain/shared/errors/domain-error';
import {
  SaveInventoryItemInput,
  StockAdjustmentInputDto,
  SaveProductRecipesInput,
  SaveSupplierInput,
  CreatePurchaseOrderInput,
} from '../../application/inventory/dto/inventory.dto';
import { SaveInventoryItemUseCase } from '../../application/inventory/use-cases/manage-inventory-items.use-cases';
import { AdjustStockUseCase } from '../../application/inventory/use-cases/manage-branch-stock.use-cases';
import { SaveProductRecipesUseCase } from '../../application/inventory/use-cases/manage-recipes.use-cases';
import { SaveSupplierUseCase } from '../../application/inventory/use-cases/manage-suppliers.use-cases';
import {
  CreatePurchaseOrderUseCase,
  ReceivePurchaseOrderUseCase,
} from '../../application/inventory/use-cases/manage-purchase-orders.use-cases';
import { ActionResult, toActionFailure } from './action-result';

export async function saveInventoryItemAction(input: SaveInventoryItemInput): Promise<ActionResult<{ id: string }>> {
  try {
    await SessionService.requirePermission(PermissionCode.MANAGE_INVENTORY);
    const result = await new SaveInventoryItemUseCase().execute(input);
    revalidatePath('/admin/inventory');
    return { success: true, data: { id: result.id } };
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function adjustStockAction(input: StockAdjustmentInputDto): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await SessionService.requirePermission(PermissionCode.MANAGE_INVENTORY);
    await BranchContextService.assertBranchAccess(session, input.branchId);
    const result = await new AdjustStockUseCase().execute(input, session.userId);
    revalidatePath('/admin/inventory');
    return { success: true, data: { id: result.id } };
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function saveProductRecipesAction(input: SaveProductRecipesInput): Promise<ActionResult<{ success: boolean }>> {
  try {
    await SessionService.requirePermission(PermissionCode.MANAGE_INVENTORY);
    await new SaveProductRecipesUseCase().execute(input);
    revalidatePath('/admin/inventory');
    return { success: true, data: { success: true } };
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function saveSupplierAction(input: SaveSupplierInput): Promise<ActionResult<{ id: string }>> {
  try {
    await SessionService.requirePermission(PermissionCode.MANAGE_INVENTORY);
    const result = await new SaveSupplierUseCase().execute(input);
    revalidatePath('/admin/inventory');
    return { success: true, data: { id: result.id } };
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function createPurchaseOrderAction(input: CreatePurchaseOrderInput): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await SessionService.requirePermission(PermissionCode.MANAGE_INVENTORY);
    await BranchContextService.assertBranchAccess(session, input.branchId);
    const result = await new CreatePurchaseOrderUseCase().execute(input, session.userId);
    revalidatePath('/admin/inventory');
    return { success: true, data: { id: result.id } };
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function receivePurchaseOrderAction(orderId: string): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await SessionService.requirePermission(PermissionCode.MANAGE_INVENTORY);
    const order = await prisma.purchaseOrder.findUnique({
      where: { id: orderId },
      select: { branchId: true },
    });
    if (!order) {
      throw new NotFoundError('أمر الشراء', orderId);
    }
    await BranchContextService.assertBranchAccess(session, order.branchId);
    const result = await new ReceivePurchaseOrderUseCase().execute(orderId, session.userId);
    revalidatePath('/admin/inventory');
    return { success: true, data: { id: result.id } };
  } catch (error) {
    return toActionFailure(error);
  }
}
