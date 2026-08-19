'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

type Category = {
  id: number
  name: string
}

export default function EditSubscription() {
  const router = useRouter()
  const params = useParams()
  const id = params.id

  const [categories, setCategories] = useState<Category[]>([])
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [cancelDeadline, setCancelDeadline] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch('http://localhost:8787/api/categories')
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch(() => setError('カテゴリの取得に失敗しました。時間をおいて再度お試しください。'))

    fetch(`http://localhost:8787/api/subscriptions/${id}`)
      .then(async (res) => {
        if (res.status === 404) {
          setNotFound(true)
          return
        }
        if (!res.ok) {
          setError('サブスク情報の取得に失敗しました。')
          return
        }
        const data = await res.json()
        setName(data.name)
        setPrice(String(data.price))
        setCancelDeadline(data.cancelDeadline.slice(0, 10))
        setCategoryId(data.categoryId)
      })
      .catch(() => setError('通信に失敗しました。サーバーが起動しているか確認してください。'))
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name || !price || !cancelDeadline || !categoryId) {
      setError('全ての項目を入力してください')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`http://localhost:8787/api/subscriptions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          price: Number(price),
          cancelDeadline,
          categoryId,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        setError(body?.error ?? '更新に失敗しました。入力内容を確認してください。')
        return
      }

      router.push('/')
    } catch {
      setError('通信に失敗しました。サーバーが起動しているか確認してください。')
    } finally {
      setSubmitting(false)
    }
  }

  if (notFound) {
    return (
      <div className="p-8">
        <p>指定されたサブスクが見つかりませんでした。</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="p-8">
      <div>
        <label>サービス名</label>
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div>
        <label>月額料金</label>
        <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
      </div>

      <div>
        <label>解約締切日</label>
        <input type="date" value={cancelDeadline} onChange={(e) => setCancelDeadline(e.target.value)} />
      </div>

      <div>
        <label>カテゴリ</label>
        {categories.map((c) => (
          <button
            type="button"
            key={c.id}
            onClick={() => setCategoryId(c.id)}
            className={`px-3 py-1 m-1 rounded-full border cursor-pointer ${
              categoryId === c.id
                ? 'bg-gray-800 text-white border-gray-800'
                : 'bg-white text-gray-800 border-gray-300'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {error && <p className="text-red-600 mt-2">{error}</p>}

      <button type="submit" disabled={submitting}>
        {submitting ? '更新中...' : '更新する'}
      </button>
    </form>
  )
}