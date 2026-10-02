import { z } from 'zod';

export const createBranchSchema = z.object({
  code: z.string().min(2, 'كود الفرع يجب أن يتكون من حرفين على الأقل').toUpperCase(),
  nameAr: z.string().min(2, 'اسم الفرع بالعربية مطلوب'),
  nameEn: z.string().min(2, 'اسم الفرع بالإنجليزية مطلوب'),
  phone: z.string().min(5, 'رقم هاتف الفرع مطلوب'),
  address: z.string().min(3, 'عنوان الفرع مطلوب'),
});

export type CreateBranchDto = z.infer<typeof createBranchSchema>;

export const updateBranchSchema = createBranchSchema.partial();
export type UpdateBranchDto = z.infer<typeof updateBranchSchema>;
