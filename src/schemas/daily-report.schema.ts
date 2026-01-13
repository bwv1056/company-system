import { z } from 'zod'

export const visitRecordSchema = z.object({
  id: z.number().optional(),
  customerId: z.number({ required_error: '顧客を選択してください' }),
  visitTime: z.string().optional().nullable(),
  visitContent: z.string().min(1, '訪問内容を入力してください'),
})

export const createDailyReportSchema = z.object({
  reportDate: z.string().min(1, '報告日を選択してください'),
  problem: z.string().optional().nullable(),
  plan: z.string().optional().nullable(),
  visitRecords: z.array(visitRecordSchema).optional(),
})

export const updateDailyReportSchema = createDailyReportSchema

export const createCommentSchema = z.object({
  coment: z.string().min(1, 'コメントを入力してください'),
})

export type VisitRecordInput = z.infer<typeof visitRecordSchema>
export type CreateDailyReportInput = z.infer<typeof createDailyReportSchema>
export type UpdateDailyReportInput = z.infer<typeof updateDailyReportSchema>
export type CreateCommentInput = z.infer<typeof createCommentSchema>
