import { z } from 'zod';

export const getKitchenOrdersSchema = z.object({
  branchId: z.string().uuid('معرف الفرع غير صالح').optional(),
});

export type GetKitchenOrdersDto = z.infer<typeof getKitchenOrdersSchema>;

export const bumpKitchenOrderSchema = z.object({
  orderId: z.string().uuid('معرف الطلب غير صالح'),
  branchId: z.string().uuid('معرف الفرع غير صالح'),
});

export type BumpKitchenOrderDto = z.infer<typeof bumpKitchenOrderSchema>;

export const toggleKitchenItemPreparedSchema = z.object({
  orderItemId: z.string().uuid('معرف الصنف غير صالح'),
  isPrepared: z.boolean(),
  branchId: z.string().uuid('معرف الفرع غير صالح').optional(),
});

export type ToggleKitchenItemPreparedDto = z.infer<typeof toggleKitchenItemPreparedSchema>;
