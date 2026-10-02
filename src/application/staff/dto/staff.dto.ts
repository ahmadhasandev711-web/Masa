import { z } from 'zod';

export const createStaffSchema = z.object({
  username: z.string().min(3, 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل').trim().toLowerCase(),
  fullName: z.string().min(2, 'الاسم الكامل مطلوب'),
  phone: z.string().min(5, 'رقم الهاتف مطلوب'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 خانات على الأقل'),
  roleId: z.string().min(1, 'الدور الوظيفي مطلوب'),
  branchIds: z.array(z.string()).default([]),
});

export type CreateStaffDto = z.infer<typeof createStaffSchema>;

export const loginSchema = z.object({
  username: z.string().min(1, 'اسم المستخدم مطلوب').trim().toLowerCase(),
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
  branchId: z.string().optional(),
});

export type LoginDto = z.infer<typeof loginSchema>;

export const updateStaffSchema = z.object({
  userId: z.string().min(1, 'معرف الموظف مطلوب'),
  fullName: z.string().min(2, 'الاسم الكامل مطلوب'),
  phone: z.string().min(5, 'رقم الهاتف مطلوب'),
  roleId: z.string().min(1, 'الدور الوظيفي مطلوب'),
  branchIds: z.array(z.string()).default([]),
});

export type UpdateStaffDto = z.infer<typeof updateStaffSchema>;

export const resetStaffPasswordSchema = z.object({
  userId: z.string().min(1, 'معرف الموظف مطلوب'),
  newPassword: z.string().min(6, 'كلمة المرور يجب أن تكون 6 خانات على الأقل'),
});

export type ResetStaffPasswordDto = z.infer<typeof resetStaffPasswordSchema>;

