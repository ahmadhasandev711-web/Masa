'use server';

import { revalidatePath } from 'next/cache';
import { CreateEventBookingInput, UpdateBookingStatusInput } from '../../application/bookings/dto/event-booking.dto';
import { CreateEventBookingUseCase } from '../../application/bookings/use-cases/create-event-booking.use-case';
import { UpdateBookingStatusUseCase } from '../../application/bookings/use-cases/update-booking-status.use-case';
import { SessionService } from '../../infrastructure/auth/session.service';
import { PermissionCode } from '../../domain/staff/enums/permission.enum';
import { ActionResult, toActionFailure } from './action-result';

export async function createEventBookingAction(
  input: CreateEventBookingInput
): Promise<ActionResult<{ id: string; whatsappUrl: string }>> {
  try {
    const result = await new CreateEventBookingUseCase().execute(input);
    revalidatePath('/admin/bookings');
    return {
      success: true,
      data: { id: result.id, whatsappUrl: result.whatsappUrl },
    };
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function updateBookingStatusAction(
  input: UpdateBookingStatusInput
): Promise<ActionResult<{ success: boolean }>> {
  try {
    await SessionService.requirePermission(PermissionCode.MANAGE_ORDERS);
    await new UpdateBookingStatusUseCase().execute(input);
    revalidatePath('/admin/bookings');
    return {
      success: true,
      data: { success: true },
    };
  } catch (error) {
    return toActionFailure(error);
  }
}
