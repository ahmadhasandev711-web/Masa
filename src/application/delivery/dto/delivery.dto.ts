import { z } from 'zod';
import { VehicleType, DriverStatus } from '../../../domain/delivery/enums';

export const saveDriverSchema = z.object({
  id: z.string().uuid().optional(),
  branchId: z.string().uuid('معرف الفرع مطلوب'),
  fullName: z.string().min(2, 'اسم الطيار يجب ألا يقل عن حرفين'),
  phone: z.string().min(6, 'رقم الهاتف غير صالح'),
  vehicleType: z.nativeEnum(VehicleType).default(VehicleType.MOTORCYCLE),
  licensePlate: z.string().optional().nullable(),
  status: z.nativeEnum(DriverStatus).optional().default(DriverStatus.AVAILABLE),
  isActive: z.boolean().optional().default(true),
});

export type SaveDriverDto = z.input<typeof saveDriverSchema>;

export const dispatchOrderSchema = z.object({
  branchId: z.string().uuid('معرف الفرع مطلوب'),
  driverId: z.string().uuid('معرف الطيار مطلوب'),
  orderIds: z.array(z.string().uuid()).min(1, 'يرجى تحديد طلب واحد على الأقل للإسناد'),
});

export type DispatchOrderDto = z.infer<typeof dispatchOrderSchema>;

export const settleDriverCashSchema = z.object({
  branchId: z.string().uuid('معرف الفرع مطلوب'),
  driverId: z.string().uuid('معرف الطيار مطلوب'),
  cashShiftId: z.string().uuid().optional().nullable(),
  cashierId: z.string().uuid('معرف الموظف المستلم مطلوب'),
  notes: z.string().optional().nullable(),
});

export type SettleDriverCashDto = z.infer<typeof settleDriverCashSchema>;
