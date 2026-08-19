// src/schemas.ts
// リクエストボディの形をここで一元管理する。
// POST（新規登録）とPUT（更新）で同じ形なので、1つのスキーマを共有する。

import { z } from 'zod'

export const subscriptionInputSchema = z.object({
  name: z.string().trim().min(1, 'サービス名を入力してください'),
  price: z
    .number({ error: '月額料金は数値で入力してください' })
    .int('月額料金は整数で入力してください')
    .positive('月額料金は1円以上で入力してください'),
  cancelDeadline: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), '解約締切日の形式が正しくありません'),
  categoryId: z.number({ error: 'カテゴリを選択してください' }).int(),
})

export type SubscriptionInput = z.infer<typeof subscriptionInputSchema>
