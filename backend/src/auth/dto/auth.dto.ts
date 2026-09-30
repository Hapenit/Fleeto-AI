import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Invalid email format').transform(s => s.toLowerCase()),
  password: z.string().min(1, 'Password is required'),
});

export type LoginDto = z.infer<typeof LoginSchema>;

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export type ChangePasswordDto = z.infer<typeof ChangePasswordSchema>;
