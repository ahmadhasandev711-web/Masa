import { z } from 'zod';
import { BookingStatus } from '../../../domain/bookings/enums/booking-status.enum';

export const CreateEventBookingSchema = z.object({
  customerName: z.string().trim().min(2, 'الاسم يجب أن يكون حرفين على الأقل').max(100),
  customerPhone: z.string().trim().min(8, 'رقم الهاتف غير صالح').max(20),
  guestsCount: z.coerce.number().int().min(2, 'الحد الأدنى لعدد الأفراد فردان').max(1000),
  eventDate: z.string().min(1, 'تاريخ المناسبة مطلوب'),
  branchId: z.string().min(1, 'يرجى اختيار الفرع'),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export type CreateEventBookingInput = z.infer<typeof CreateEventBookingSchema>;

export const UpdateBookingStatusSchema = z.object({
  bookingId: z.string().uuid(),
  status: z.nativeEnum(BookingStatus),
});

export type UpdateBookingStatusInput = z.infer<typeof UpdateBookingStatusSchema>;
