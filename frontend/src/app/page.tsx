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

export default function Home() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])

  useEffect(() => {
    fetch('http://localhost:8787/api/subscriptions')
      .then((res) => res.json())
      .then((data) => setSubscriptions(data))
  }, [])

  const handleDelete = async (id: number) => {
    const ok = confirm('本当に削除しますか?')
    if (!ok) return

    await fetch(`http://localhost:8787/api/subscriptions/${id}`, {
      method: 'DELETE',
    })

    setSubscriptions(subscriptions.filter((s) => s.id !== id))
  }

  const total = subscriptions.reduce((sum, s) => sum + s.price, 0)

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-4">サブスク一覧</h1>
      <p className="mb-4">月額合計: ¥{total.toLocaleString()}</p>

      <Link href="/new" className="text-blue-600 underline">
        + 新規登録
      </Link>

      <ul className="mt-4">
        {subscriptions.map((s) => (
          <li key={s.id} className="border-b py-3 flex items-center justify-between">
            <div>
              <p className="font-bold">{s.name}({s.category.name})</p>
              <p>¥{s.price.toLocaleString()} / 解約締切: {s.cancelDeadline.slice(0, 10)}</p>
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
        ))}
      </ul>
    </div>
  )
}