'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type Subscription = {
  id: number
  name: string
  price: number
  cancelDeadline: string
  category: { id: number; name: string }
}

// バックエンドの解約リマインダーメール(REMINDER_DAYS_BEFORE)のデフォルト値と合わせている。
// メール側の日数を変更した場合はこちらも合わせて変更する。
const REMINDER_DAYS_BEFORE = 3

// 今日から解約締切日までの日数を返す（締切を過ぎていれば負の数）
function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const deadline = new Date(dateStr)
  deadline.setHours(0, 0, 0, 0)
  return Math.round((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function deadlineLabel(remaining: number): string {
  if (remaining < 0) return '期限切れ'
  if (remaining === 0) return '本日締切'
  return `あと${remaining}日`
}

export default function Home() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('http://localhost:8787/api/subscriptions')
      .then((res) => res.json())
      .then((data) => setSubscriptions(data))
      .catch(() => setError('一覧の取得に失敗しました。サーバーが起動しているか確認してください。'))
  }, [])

  const handleDelete = async (id: number) => {
    const ok = confirm('本当に削除しますか?')
    if (!ok) return

    setError(null)
    try {
      const res = await fetch(`http://localhost:8787/api/subscriptions/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        setError(body?.error ?? '削除に失敗しました。')
        return
      }

      setSubscriptions(subscriptions.filter((s) => s.id !== id))
    } catch {
      setError('通信に失敗しました。サーバーが起動しているか確認してください。')
    }
  }

  const total = subscriptions.reduce((sum, s) => sum + s.price, 0)
  const urgentCount = subscriptions.filter((s) => daysUntil(s.cancelDeadline) <= REMINDER_DAYS_BEFORE).length

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-4">サブスク一覧</h1>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {urgentCount > 0 && (
        <p className="mb-4 text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
          解約締切が近いサブスクが{urgentCount}件あります(残り{REMINDER_DAYS_BEFORE}日以内)
        </p>
      )}
      <p className="mb-4">月額合計: ¥{total.toLocaleString()}</p>

      <Link href="/new" className="text-blue-600 underline">
        + 新規登録
      </Link>

      <ul className="mt-4">
        {subscriptions.map((s) => {
          const remaining = daysUntil(s.cancelDeadline)
          const isUrgent = remaining <= REMINDER_DAYS_BEFORE

          return (
            <li
              key={s.id}
              className={`border-b py-3 flex items-center justify-between ${isUrgent ? 'bg-red-50' : ''}`}
            >
              <div>
                <p className="font-bold">{s.name}({s.category.name})</p>
                <p>
                  ¥{s.price.toLocaleString()} / 解約締切: {s.cancelDeadline.slice(0, 10)}
                  {isUrgent && (
                    <span className="ml-2 text-red-600 font-bold">{deadlineLabel(remaining)}</span>
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                <Link href={`/edit/${s.id}`} className="text-blue-600 underline">
                  編集
                </Link>
                <button onClick={() => handleDelete(s.id)} className="text-red-600 underline">
                  削除
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}