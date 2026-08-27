import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import cron from 'node-cron'
import { subscriptionInputSchema } from './schemas'
import { checkAndSendReminders } from './reminder'

const app = new Hono()

app.use('/api/*', cors({
  origin: 'http://localhost:3000',
}))


app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/api/hello', (c) => {
  return c.json({ message: 'Honoからこんにちは' })
})


serve({
  fetch: app.fetch,
  port: 8787
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})

import { prisma } from './db'

// URLの:idを数値に変換する。数値でなければ400を投げる。
// findUnique({ where: { id: NaN } }) のような無意味なDB問い合わせを防ぐためのガード。
function parseIdParam(idParam: string): number {
  const id = Number(idParam)
  if (!Number.isInteger(id)) {
    throw new HTTPException(400, { message: 'idは数値で指定してください' })
  }
  return id
}

app.get('/api/subscriptions', async (c) => {
  const subscriptions = await prisma.subscription.findMany({
    include: { category: true },
    orderBy: { cancelDeadline: 'asc' },
  })
  return c.json(subscriptions)
})

app.post('/api/subscriptions', async (c) => {
  const body = await c.req.json()

  const result = subscriptionInputSchema.safeParse(body)
  if (!result.success) {
    return c.json({ error: result.error.issues[0].message }, 400)
  }
  const input = result.data

  const subscription = await prisma.subscription.create({
    data: {
      name: input.name,
      price: input.price,
      cancelDeadline: new Date(input.cancelDeadline),
      categoryId: input.categoryId,
    },
  })

  return c.json(subscription, 201)
})

app.get('/api/categories', async (c) => {
  const categories = await prisma.category.findMany({
    orderBy: { id: 'asc' },
  })
  return c.json(categories)
})

app.get('/api/subscriptions/:id', async (c) => {
  const id = parseIdParam(c.req.param('id'))
  const subscription = await prisma.subscription.findUnique({
    where: { id },
  })

  if (!subscription) {
    return c.json({ error: 'サブスクが見つかりません' }, 404)
  }
  return c.json(subscription)
})

app.put('/api/subscriptions/:id', async (c) => {
  const id = parseIdParam(c.req.param('id'))
  const body = await c.req.json()

  const result = subscriptionInputSchema.safeParse(body)
  if (!result.success) {
    return c.json({ error: result.error.issues[0].message }, 400)
  }
  const input = result.data

  const existing = await prisma.subscription.findUnique({ where: { id } })
  if (!existing) {
    return c.json({ error: 'サブスクが見つかりません' }, 404)
  }

  const newDeadline = new Date(input.cancelDeadline)
  // 解約締切日が変わったら、その締切に対する通知はまだ済んでいないはずなので
  // reminderSentAtをリセットして再度リマインダー対象になるようにする。
  const deadlineChanged = existing.cancelDeadline.getTime() !== newDeadline.getTime()

  const subscription = await prisma.subscription.update({
    where: { id },
    data: {
      name: input.name,
      price: input.price,
      cancelDeadline: newDeadline,
      categoryId: input.categoryId,
      ...(deadlineChanged ? { reminderSentAt: null } : {}),
    },
  })

  return c.json(subscription)
})

// 解約締切リマインダーを即時チェック・送信する（動作確認や手動実行用）。
// 通常はサーバー起動中、下部のcronスケジュールにより毎日自動で実行される。
app.post('/api/notify/check-deadlines', async (c) => {
  try {
    const result = await checkAndSendReminders()
    return c.json(result)
  } catch (err) {
    console.error('[reminder] 手動チェックに失敗しました', err)
    const message = err instanceof Error ? err.message : 'リマインダーの送信に失敗しました'
    return c.json({ error: message }, 500)
  }
})

app.delete('/api/subscriptions/:id', async (c) => {
  const id = parseIdParam(c.req.param('id'))

  const existing = await prisma.subscription.findUnique({ where: { id } })
  if (!existing) {
    return c.json({ error: 'サブスクが見つかりません' }, 404)
  }

  await prisma.subscription.delete({
    where: { id },
  })

  return c.body(null, 204)
})

// ここまでのハンドラーで拾いきれなかった例外（Prismaの接続エラーなど）の最終防衛ライン。
// スタックトレースをそのまま返さず、常に { error: string } の形でレスポンスする。
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status)
  }
  console.error(err)
  return c.json({ error: 'サーバーでエラーが発生しました' }, 500)
})

// 解約締切リマインダーの自動チェック。
// サーバープロセスが起動している間のみ、毎日指定時刻(デフォルト9:00 JST)に実行される。
// SMTP_USER等のメール送信用環境変数が未設定の場合はエラーをログに出すだけで、サーバー自体は止めない。
const REMINDER_CRON = process.env.REMINDER_CRON ?? '0 9 * * *'
cron.schedule(
  REMINDER_CRON,
  () => {
    checkAndSendReminders()
      .then(({ notified }) => {
        if (notified > 0) {
          console.log(`[reminder] 解約締切リマインダーを${notified}件分送信しました`)
        }
      })
      .catch((err) => {
        console.error('[reminder] 自動チェックに失敗しました', err)
      })
  },
  { timezone: process.env.REMINDER_TZ ?? 'Asia/Tokyo' },
)

export default app
