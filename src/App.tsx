import { useEffect, useState } from 'react'

type ApiState = 'checking' | 'up' | 'down'

function App() {
  const [api, setApi] = useState<ApiState>('checking')

  useEffect(() => {
    fetch('/api/health')
      .then((res) => setApi(res.ok ? 'up' : 'down'))
      .catch(() => setApi('down'))
  }, [])

  return (
    <main className="shell">
      <h1>Riven</h1>
      <p className="tagline">Verify. Remember. Learn from every change.</p>
      <p className={`status status-${api}`}>API: {api}</p>
    </main>
  )
}

export default App
