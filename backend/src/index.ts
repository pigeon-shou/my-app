import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import { subscriptionInputSchema } from './schemas'

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

  const subscription = await prisma.subscription.update({
    where: { id },
    data: {
      name: input.name,
      price: input.price,
      cancelDeadline: new Date(input.cancelDeadline),
      categoryId: input.categoryId,
    },
  })

  return c.json(subscription)
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

export default app
