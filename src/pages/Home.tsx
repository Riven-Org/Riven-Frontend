import { useEffect, useState } from 'react'

import { api } from '../api/client'
import type { Me } from '../api/types'

export function Home() {
  const [me, setMe] = useState<Me | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api<Me>('/v1/me').then(setMe, (err: Error) => setError(err.message))
  }, [])

  return (
    <section className="page">
      <header className="page-head rise">
        <h1>{me ? `Welcome, ${me.name.split(' ')[0] || me.email}` : 'Welcome'}</h1>
        <p className="muted">Your verification workspace.</p>
      </header>

      <div className="grid">
        <article className="card rise" style={{ animationDelay: '80ms' }}>
          <h2 className="card-title">Signed in as</h2>
          {me ? (
            <dl className="facts">
              <dt>Name</dt>
              <dd>{me.name || '—'}</dd>
              <dt>Email</dt>
              <dd>{me.email}</dd>
              <dt>Identity</dt>
              <dd>
                <span className="pill">{me.kind}</span>
              </dd>
            </dl>
          ) : error ? (
            <p className="error">Could not load your profile: {error}</p>
          ) : (
            <div className="skeleton-lines" aria-busy="true">
              <span />
              <span />
              <span />
            </div>
          )}
        </article>
      </div>
    </section>
  )
}
