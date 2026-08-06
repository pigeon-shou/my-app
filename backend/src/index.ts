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

export default app