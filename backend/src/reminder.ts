// src/reminder.ts
// 解約締切が近い(または過ぎている)のに未通知のサブスクをまとめて1通のメールで知らせる。
//
// 対象条件: cancelDeadline <= 今日 + REMINDER_DAYS_BEFORE日、かつ reminderSentAt が未設定
// reminderSentAt は cancelDeadline が更新される（＝解約締切日が変わる）と null にリセットされるので、
// 「まだこの締切について通知していないサブスク」だけが毎回対象になる。

import { prisma } from './db'
import { sendReminderEmail } from './mailer'

const DEFAULT_REMINDER_DAYS_BEFORE = 3

function getReminderDaysBefore(): number {
  const raw = process.env.REMINDER_DAYS_BEFORE
  const parsed = raw ? Number(raw) : DEFAULT_REMINDER_DAYS_BEFORE
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_REMINDER_DAYS_BEFORE
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export async function checkAndSendReminders(): Promise<{ notified: number }> {
  const daysBefore = getReminderDaysBefore()

  const threshold = new Date()
  threshold.setDate(threshold.getDate() + daysBefore)
  threshold.setHours(23, 59, 59, 999)

  const targets = await prisma.subscription.findMany({
    where: {
      cancelDeadline: { lte: threshold },
      reminderSentAt: null,
    },
    include: { category: true },
    orderBy: { cancelDeadline: 'asc' },
  })

  if (targets.length === 0) {
    return { notified: 0 }
  }

  const lines = targets.map((s) => {
    return `・${s.name}(${s.category.name}) 月額¥${s.price.toLocaleString()} - 解約締切: ${formatDate(s.cancelDeadline)}`
  })

  const subject = `【サブスク管理】解約締切が近いサブスクが${targets.length}件あります`
  const text = [
    `解約締切まで${daysBefore}日以内、または締切を過ぎているサブスクが${targets.length}件あります。`,
    '',
    ...lines,
  ].join('\n')

  await sendReminderEmail(subject, text)

  await prisma.subscription.updateMany({
    where: { id: { in: targets.map((s) => s.id) } },
    data: { reminderSentAt: new Date() },
  })

  return { notified: targets.length }
}
