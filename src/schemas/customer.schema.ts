import { z } from 'zod'

export const createCustomerSchema = z.object({
  companyName: z.string().min(1, '会社名を入力してください').max(200, '会社名は200文字以内で入力してください'),
  companyPerson: z.string().max(100, '担当者名は100文字以内で入力してください').optional().nullable(),
  email: z.string().email('メールアドレスの形式が正しくありません').optional().nullable().or(z.literal('')),
  address: z.string().max(500, '住所は500文字以内で入力してください').optional().nullable(),
  phone: z.string().max(20, '電話番号は20文字以内で入力してください').optional().nullable(),
})

export const updateCustomerSchema = createCustomerSchema

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>
