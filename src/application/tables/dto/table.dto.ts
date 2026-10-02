import { z } from 'zod';
import { TableShape } from '../../../domain/tables/enums';

// 1. Table Sections
export const createTableSectionSchema = z.object({
  branchId: z.string().uuid('معرف الفرع غير صالح'),
  nameAr: z.string().min(1, 'اسم القسم بالعربية مطلوب'),
  nameEn: z.string().min(1, 'اسم القسم بالإنجليزية مطلوب'),
  sortOrder: z.number().int().default(0),
});

export const updateTableSectionSchema = z.object({
  id: z.string().uuid('معرف القسم غير صالح'),
  nameAr: z.string().min(1).optional(),
  nameEn: z.string().min(1).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

// 2. Dining Tables
export const createTableSchema = z.object({
  branchId: z.string().uuid('معرف الفرع غير صالح'),
  sectionId: z.string().uuid('معرف القسم غير صالح').nullable().optional(),
  tableNumber: z.string().min(1, 'رقم الطاولة مطلوب'),
  capacity: z.number().int().min(1, 'سعة المقاعد يجب أن تكون 1 على الأقل').default(4),
  shape: z.enum(['SQUARE', 'ROUND', 'RECTANGLE']).default(TableShape.SQUARE),
  sortOrder: z.number().int().default(0),
});

export const updateTableSchema = z.object({
  id: z.string().uuid('معرف الطاولة غير صالح'),
  sectionId: z.string().uuid().nullable().optional(),
  tableNumber: z.string().min(1).optional(),
  capacity: z.number().int().min(1).optional(),
  shape: z.enum(['SQUARE', 'ROUND', 'RECTANGLE']).optional(),
  status: z.enum(['AVAILABLE', 'OCCUPIED', 'BILL_PRINTED', 'RESERVED', 'CLEANING']).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

// 3. Tab Operations
export const tableItemInputSchema = z.object({
  productId: z.string().uuid('معرف الصنف غير صالح'),
  sizeId: z.string().uuid('معرف المقاس غير صالح'),
  modifierIds: z.array(z.string().uuid()).default([]),
  quantity: z.number().int().min(1, 'الكمية يجب أن تكون 1 على الأقل'),
});

export const openTableTabSchema = z.object({
  branchId: z.string().uuid('معرف الفرع غير صالح'),
  tableId: z.string().uuid('معرف الطاولة غير صالح'),
  cashShiftId: z.string().uuid('معرف الوردية غير صالح'),
  cashierId: z.preprocess((val) => (val === '' ? undefined : val), z.string().uuid('معرف الكاشير غير صالح').optional()),
  guestCount: z.number().int().min(1, 'عدد الضيوف يجب أن يكون 1 على الأقل').default(2),
  customerNotes: z.string().nullable().optional(),
  items: z.array(tableItemInputSchema).default([]),
});

export const addItemsToTabSchema = z.object({
  orderId: z.string().uuid('معرف الطلب غير صالح'),
  items: z.array(tableItemInputSchema).min(1, 'يجب إضافة صنف واحد على الأقل'),
});

export const transferTableSchema = z.object({
  fromTableId: z.string().uuid('معرف الطاولة الحالية غير صالح'),
  toTableId: z.string().uuid('معرف الطاولة المنقول إليها غير صالح'),
});

export const printTableBillSchema = z.object({
  tableId: z.string().uuid('معرف الطاولة غير صالح'),
});

export const splitBillEqualSchema = z.object({
  orderId: z.string().uuid('معرف الطلب غير صالح'),
  splitCount: z.number().int().min(2, 'التقسيم يتطلب شخصين على الأقل'),
});

export const closeTableTabSchema = z.object({
  orderId: z.string().uuid('معرف الطلب غير صالح'),
  tableId: z.string().uuid('معرف الطاولة غير صالح'),
  cashShiftId: z.string().uuid('معرف الوردية غير صالح'),
  cashierId: z.string().uuid('معرف الكاشير غير صالح'),
  paymentMethod: z.enum(['CASH', 'CARD', 'MIXED']).default('CASH'),
  payments: z.array(
    z.object({
      method: z.enum(['CASH', 'CARD']),
      amountMinor: z.number().int().positive('المبلغ يجب أن يكون موجباً'),
    })
  ).optional(),
});

export type CreateTableSectionDto = z.infer<typeof createTableSectionSchema>;
export type UpdateTableSectionDto = z.infer<typeof updateTableSectionSchema>;
export type CreateTableDto = z.infer<typeof createTableSchema>;
export type UpdateTableDto = z.infer<typeof updateTableSchema>;
export type OpenTableTabDto = z.infer<typeof openTableTabSchema>;
export type AddItemsToTabDto = z.infer<typeof addItemsToTabSchema>;
export type TransferTableDto = z.infer<typeof transferTableSchema>;
export type PrintTableBillDto = z.infer<typeof printTableBillSchema>;
export type SplitBillEqualDto = z.infer<typeof splitBillEqualSchema>;
export type CloseTableTabDto = z.infer<typeof closeTableTabSchema>;
