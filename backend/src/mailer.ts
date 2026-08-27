// src/mailer.ts
// 解約締切リマインダーメールの送信処理。
// SMTP_HOST が設定されていればそれを使い、未設定ならGmail(アプリパスワード)をデフォルトとして使う。

import nodemailer from 'nodemailer'

function getTransporter() {
  const { SMTP_USER, SMTP_PASS, SMTP_HOST, SMTP_PORT } = process.env

  if (!SMTP_USER || !SMTP_PASS) {
    throw new Error('メール送信に必要な環境変数(SMTP_USER, SMTP_PASS)が未設定です')
  }

  if (SMTP_HOST) {
    const port = Number(SMTP_PORT ?? 587)
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  }

  // デフォルト: Gmail + アプリパスワード
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  })
}

export async function sendReminderEmail(subject: string, text: string): Promise<void> {
  const to = process.env.NOTIFY_TO_EMAIL
  if (!to) {
    throw new Error('メール送信に必要な環境変数(NOTIFY_TO_EMAIL)が未設定です')
  }

  const transporter = getTransporter()
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject,
    text,
  })
}
