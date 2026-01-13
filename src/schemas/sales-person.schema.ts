import { z } from 'zod'

export const createSalesPersonSchema = z.object({
  name: z.string().min(1, '氏名を入力してください').max(100, '氏名は100文字以内で入力してください'),
  email: z.string().email('メールアドレスの形式が正しくありません'),
  password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
  department: z.string().max(100, '部署は100文字以内で入力してください').optional().nullable(),
  isManager: z.boolean().optional().default(false),
})

export const updateSalesPersonSchema = z.object({
  name: z.string().min(1, '氏名を入力してください').max(100, '氏名は100文字以内で入力してください'),
  email: z.string().email('メールアドレスの形式が正しくありません'),
  password: z.string().min(8, 'パスワードは8文字以上で入力してください').optional().or(z.literal('')),
  department: z.string().max(100, '部署は100文字以内で入力してください').optional().nullable(),
  isManager: z.boolean().optional(),
})

export type CreateSalesPersonInput = z.infer<typeof createSalesPersonSchema>
export type UpdateSalesPersonInput = z.infer<typeof updateSalesPersonSchema>
