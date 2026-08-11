import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'

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

app.get('/api/subscriptions', async (c) => {
  const subscriptions = await prisma.subscription.findMany({
    include: { category: true },
    orderBy: { cancelDeadline: 'asc' },
  })
  return c.json(subscriptions)
})

app.post('/api/subscriptions', async (c) => {
  const body = await c.req.json()

  const subscription = await prisma.subscription.create({
    data: {
      name: body.name,
      price: body.price,
      cancelDeadline: new Date(body.cancelDeadline),
      categoryId: body.categoryId,
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
  const id = Number(c.req.param('id'))
  const subscription = await prisma.subscription.findUnique({
    where: { id },
  })
  return c.json(subscription)
})

app.put('/api/subscriptions/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const body = await c.req.json()

  const subscription = await prisma.subscription.update({
    where: { id },
    data: {
      name: body.name,
      price: body.price,
      cancelDeadline: new Date(body.cancelDeadline),
      categoryId: body.categoryId,
    },
  })

  return c.json(subscription)
})

app.delete('/api/subscriptions/:id', async (c) => {
  const id = Number(c.req.param('id'))

  await prisma.subscription.delete({
    where: { id },
  })

  return c.body(null, 204)
})
export default app