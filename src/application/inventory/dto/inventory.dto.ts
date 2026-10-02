import { z } from 'zod';
import { UnitOfMeasure, InventoryMovementType } from '../../../domain/inventory/enums';

export const SaveInventoryItemSchema = z.object({
  id: z.string().uuid().optional(),
  sku: z.string().trim().max(50).optional().nullable(),
  nameAr: z.string().trim().min(2, 'اسم المكون بالعربية يجب ألا يقل عن حرفين'),
  nameEn: z.string().trim().min(2, 'اسم المكون بالإنجليزية يجب ألا يقل عن حرفين'),
  unit: z.enum([
    UnitOfMeasure.GRAM,
    UnitOfMeasure.KG,
    UnitOfMeasure.ML,
    UnitOfMeasure.LITER,
    UnitOfMeasure.PIECE,
  ]),
  defaultCostDecimal: z.number().min(0, 'التكلفة لا يمكن أن تكون سالبة'),
  isActive: z.boolean().default(true),
});

export type SaveInventoryItemInput = z.infer<typeof SaveInventoryItemSchema>;

export const StockAdjustmentSchema = z.object({
  branchId: z.string().uuid('معرف الفرع غير صالح'),
  inventoryItemId: z.string().uuid('معرف المكون غير صالح'),
  type: z.enum([
    InventoryMovementType.OPERATIONAL_CONSUMPTION,
    InventoryMovementType.WASTE,
    InventoryMovementType.ADJUSTMENT,
  ]),
  quantityDelta: z.number().refine((val) => val !== 0, 'كمية الحركة يجب ألا تساوي صفراً'),
  notes: z.string().trim().max(500).optional(),
});

export type StockAdjustmentInputDto = z.infer<typeof StockAdjustmentSchema>;

export const RecipeItemInputSchema = z.object({
  inventoryItemId: z.string().uuid('معرف المكون غير صالح'),
  productSizeId: z.string().uuid().optional().nullable(),
  modifierId: z.string().uuid().optional().nullable(),
  quantity: z.number().positive('الكمية يجب أن تكون أكبر من الصفر'),
});

export const SaveProductRecipesSchema = z.object({
  productId: z.string().uuid('معرف الصنف غير صالح'),
  items: z.array(RecipeItemInputSchema),
});

export type SaveProductRecipesInput = z.infer<typeof SaveProductRecipesSchema>;

export const SaveSupplierSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2, 'اسم المورد يجب ألا يقل عن حرفين'),
  contactName: z.string().trim().max(100).optional().nullable(),
  phone: z.string().trim().max(30).optional().nullable(),
  email: z.string().trim().email('صيغة البريد الإلكتروني غير صالحة').optional().nullable().or(z.literal('')),
  address: z.string().trim().max(255).optional().nullable(),
  taxNumber: z.string().trim().max(50).optional().nullable(),
  isActive: z.boolean().default(true),
});

export type SaveSupplierInput = z.infer<typeof SaveSupplierSchema>;

export const PurchaseOrderItemInputSchema = z.object({
  inventoryItemId: z.string().uuid('معرف المكون غير صالح'),
  quantity: z.number().positive('الكمية يجب أن تكون أكبر من الصفر'),
  unitCostDecimal: z.number().min(0, 'سعر الوحدة لا يمكن أن يكون سالباً'),
});

export const CreatePurchaseOrderSchema = z.object({
  supplierId: z.string().uuid('معرف المورد غير صالح'),
  branchId: z.string().uuid('معرف الفرع غير صالح'),
  invoiceNumber: z.string().trim().max(100).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
  items: z.array(PurchaseOrderItemInputSchema).min(1, 'يجب إضافة صنف واحد على الأقل في أمر الشراء'),
});

export type CreatePurchaseOrderInput = z.infer<typeof CreatePurchaseOrderSchema>;
