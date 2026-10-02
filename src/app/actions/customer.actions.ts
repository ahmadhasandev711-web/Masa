'use server';

import { revalidatePath } from 'next/cache';
import { PermissionCode } from '../../domain/staff/enums/permission.enum';
import { SessionService } from '../../infrastructure/auth/session.service';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerAddressDto,
  MatchOrCreateCustomerDto,
} from '../../application/customers/dto/customer.dto';
import { CreateCustomerUseCase } from '../../application/customers/use-cases/create-customer.use-case';
import { UpdateCustomerUseCase } from '../../application/customers/use-cases/update-customer.use-case';
import { SaveCustomerAddressUseCase } from '../../application/customers/use-cases/save-customer-address.use-case';
import { DeleteCustomerAddressUseCase } from '../../application/customers/use-cases/delete-customer-address.use-case';
import { MatchOrCreateCustomerUseCase } from '../../application/customers/use-cases/match-or-create-customer.use-case';
import { ActionResult, toActionFailure } from './action-result';

export async function createCustomerAction(input: CreateCustomerDto): Promise<ActionResult<{ id: string }>> {
  try {
    await SessionService.requirePermission(PermissionCode.MANAGE_CUSTOMERS);
    const result = await new CreateCustomerUseCase().execute(input);
    revalidatePath('/admin/customers');
    return { success: true, data: { id: result.id } };
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function updateCustomerAction(input: UpdateCustomerDto): Promise<ActionResult<{ id: string }>> {
  try {
    await SessionService.requirePermission(PermissionCode.MANAGE_CUSTOMERS);
    const result = await new UpdateCustomerUseCase().execute(input);
    revalidatePath('/admin/customers');
    return { success: true, data: { id: result.id } };
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function saveCustomerAddressAction(input: CustomerAddressDto): Promise<ActionResult<{ id: string }>> {
  try {
    await SessionService.requirePermission(PermissionCode.MANAGE_CUSTOMERS);
    const result = await new SaveCustomerAddressUseCase().execute(input);
    revalidatePath('/admin/customers');
    return { success: true, data: { id: result.id } };
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function deleteCustomerAddressAction(addressId: string, customerId: string): Promise<ActionResult<{ success: boolean }>> {
  try {
    await SessionService.requirePermission(PermissionCode.MANAGE_CUSTOMERS);
    await new DeleteCustomerAddressUseCase().execute(addressId, customerId);
    revalidatePath('/admin/customers');
    return { success: true, data: { success: true } };
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function matchOrCreateCustomerAction(input: MatchOrCreateCustomerDto): Promise<ActionResult<{ customerId: string; addressId?: string | null }>> {
  try {
    const result = await new MatchOrCreateCustomerUseCase().execute(input);
    return { success: true, data: { customerId: result.customer.id, addressId: result.address?.id ?? null } };
  } catch (error) {
    return toActionFailure(error);
  }
}
