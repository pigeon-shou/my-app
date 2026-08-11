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

  useEffect(() => {
    fetch('http://localhost:8787/api/categories')
      .then((res) => res.json())
      .then((data) => setCategories(data))

    fetch(`http://localhost:8787/api/subscriptions/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setName(data.name)
        setPrice(String(data.price))
        setCancelDeadline(data.cancelDeadline.slice(0, 10))
        setCategoryId(data.categoryId)
      })
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !price || !cancelDeadline || !categoryId) {
      alert('全ての項目を入力してください')
      return
    }

    await fetch(`http://localhost:8787/api/subscriptions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        price: Number(price),
        cancelDeadline,
        categoryId,
      }),
    })

    router.push('/')
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

      <button type="submit">更新する</button>
    </form>
  )
}