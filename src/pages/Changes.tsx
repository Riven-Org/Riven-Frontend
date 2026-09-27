import { useEffect, useState } from 'react'

import { api } from '../api/client'
import type { Change } from '../api/types'
import { useOrgs } from '../org/context'
import { Producer } from '../ui/Producer'

export function Changes() {
  const { current } = useOrgs()
  const [changes, setChanges] = useState<Change[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const orgId = current?.id

  useEffect(() => {
    if (!orgId) return
    api<Change[]>(`/v1/orgs/${orgId}/changes`).then(setChanges, (err: Error) =>
      setError(err.message),
    )
  }, [orgId])

  return (
    <section className="page">
      <header className="page-head rise">
        <h1>Changes</h1>
        <p className="muted">Every captured change and the authenticated identity that produced it.</p>
      </header>
      <div className="card rise" style={{ animationDelay: '60ms' }}>
        {error ? (
          <p className="error">{error}</p>
        ) : !changes ? (
          <div className="skeleton-lines" aria-busy="true">
            <span />
            <span />
            <span />
          </div>
        ) : changes.length === 0 ? (
          <p className="muted">
            No changes yet. Agents and CI submit them with an API key; see the API keys page.
          </p>
        ) : (
          <ul className="rows">
            {changes.map((c) => (
              <li key={c.id} className="row change-row">
                <span className="row-main">
                  <strong>{c.title || c.commit_sha}</strong>
                  <span className="muted small">
                    <code>{c.repository}</code> · <code>{c.commit_sha.slice(0, 8)}</code>
                    {c.branch ? ` · ${c.branch}` : ''} · {new Date(c.captured_at).toLocaleString()}
                  </span>
                </span>
                <Producer
                  kind={c.producer.kind}
                  identity={c.producer.identity}
                  model={c.producer.agent_model}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
