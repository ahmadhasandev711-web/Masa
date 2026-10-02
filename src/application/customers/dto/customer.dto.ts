import { z } from 'zod';

export const customerAddressSchema = z.object({
  id: z.string().uuid().optional(),
  customerId: z.string().uuid('معرف العميل غير صالح'),
  title: z.string().min(1, 'عنوان الموقع مطلوب (مثال: المنزل، العمل)'),
  city: z.string().min(1, 'المدينة مطلوبة').default('Cairo'),
  area: z.string().min(1, 'المنطقة أو الحي مطلوب'),
  street: z.string().min(1, 'اسم الشارع مطلوب'),
  building: z.string().nullable().optional(),
  floor: z.string().nullable().optional(),
  apartment: z.string().nullable().optional(),
  landmark: z.string().nullable().optional(),
  deliveryNotes: z.string().nullable().optional(),
  isDefault: z.boolean().default(false),
});

export const createCustomerSchema = z.object({
  fullName: z.string().min(2, 'اسم العميل يجب ألا يقل عن حرفين'),
  phone: z.string().min(5, 'رقم الهاتف مطلوب'),
  email: z.string().email('صيغة البريد الإلكتروني غير صحيحة').nullable().optional().or(z.literal('')),
  notes: z.string().nullable().optional(),
});

export const updateCustomerSchema = z.object({
  id: z.string().uuid('معرف العميل غير صالح'),
  fullName: z.string().min(2, 'اسم العميل يجب ألا يقل عن حرفين'),
  phone: z.string().min(5, 'رقم الهاتف مطلوب').optional(),
  email: z.string().email('صيغة البريد الإلكتروني غير صحيحة').nullable().optional().or(z.literal('')),
  notes: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const matchOrCreateCustomerSchema = z.object({
  phone: z.string().min(5, 'رقم الهاتف مطلوب'),
  fullName: z.string().min(2, 'اسم العميل مطلوب'),
  email: z.string().email().nullable().optional().or(z.literal('')),
  address: z.object({
    title: z.string().default('عنوان التوصيل'),
    city: z.string().default('Cairo'),
    area: z.string().min(1, 'المنطقة أو الحي مطلوب'),
    street: z.string().min(1, 'اسم الشارع مطلوب'),
    building: z.string().nullable().optional(),
    floor: z.string().nullable().optional(),
    apartment: z.string().nullable().optional(),
    landmark: z.string().nullable().optional(),
    deliveryNotes: z.string().nullable().optional(),
  }).optional(),
});

export const listCustomersQuerySchema = z.object({
  term: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type CustomerAddressDto = z.infer<typeof customerAddressSchema>;
export type CreateCustomerDto = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerDto = z.infer<typeof updateCustomerSchema>;
export type MatchOrCreateCustomerDto = z.infer<typeof matchOrCreateCustomerSchema>;
export type ListCustomersQueryDto = z.infer<typeof listCustomersQuerySchema>;
