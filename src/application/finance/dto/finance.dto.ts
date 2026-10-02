import { z } from 'zod';
import { CashMovementType, ExpenseSource } from '../../../domain/finance/enums';

export const RecordCashMovementSchema = z.object({
  shiftId: z.string().min(1, 'معرف الوردية مطلوب'),
  branchId: z.string().min(1, 'معرف الفرع مطلوب'),
  type: z.nativeEnum(CashMovementType),
  amountMinor: z.number().int().positive('المبلغ يجب أن يكون رقماً صحيحاً وموجباً'),
  reason: z.string().trim().min(3, 'سبب الحركة يجب أن يكون 3 أحرف على الأقل'),
});
export type RecordCashMovementDto = z.infer<typeof RecordCashMovementSchema>;

export const BlindCloseCashShiftSchema = z.object({
  shiftId: z.string().min(1, 'معرف الوردية مطلوب'),
  branchId: z.string().min(1, 'معرف الفرع مطلوب'),
  countedCashMinor: z.number().int().min(0, 'النقد الفعلي لا يمكن أن يكون سالباً'),
  varianceReason: z.string().trim().optional(),
});
export type BlindCloseCashShiftDto = z.infer<typeof BlindCloseCashShiftSchema>;

export const AuditShiftSchema = z.object({
  shiftId: z.string().min(1, 'معرف الوردية مطلوب'),
  branchId: z.string().min(1, 'معرف الفرع مطلوب'),
  notes: z.string().trim().optional(),
});
export type AuditShiftDto = z.infer<typeof AuditShiftSchema>;

export const CreateExpenseSchema = z.object({
  branchId: z.string().min(1, 'معرف الفرع مطلوب'),
  categoryId: z.string().min(1, 'تصنيف المصروف مطلوب'),
  amountMinor: z.number().int().positive('مبلغ المصروف يجب أن يكون موجباً'),
  source: z.nativeEnum(ExpenseSource),
  description: z.string().trim().min(3, 'بيان المصروف يجب أن يكون 3 أحرف على الأقل'),
  receiptNumber: z.string().trim().optional().nullable(),
  cashShiftId: z.string().trim().optional().nullable(),
});
export type CreateExpenseDto = z.infer<typeof CreateExpenseSchema>;

export const ProfitAndLossFilterSchema = z.object({
  branchId: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
});
export type ProfitAndLossFilterDto = z.infer<typeof ProfitAndLossFilterSchema>;
