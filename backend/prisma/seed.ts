// prisma/seed.ts
import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  const categories = ['動画配信', '音楽', '仕事・学習ツール', 'クラウドストレージ', 'ゲーム', 'フィットネス・健康', 'その他']

  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    })
  }
}

main()
  .then(() => console.log('シード完了'))
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect())