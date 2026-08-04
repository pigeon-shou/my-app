async function getData() {
  const res = await fetch('http://localhost:8787/api/hello')
  return res.json()
}

export default async function Home() {
  const data = await getData()
  return <div>{data.message}</div>
}