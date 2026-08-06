async function getData() {
  const res = await fetch('http://localhost:8787/api/subscriptions')
  return res.json()
}

export default async function Home() {
  const data = await getData()
  return <div>{JSON.stringify(data)}</div>
}