import { useState, type FormEvent } from 'react'

import { api, ApiError } from '../api/client'
import type { Org } from '../api/types'
import { useOrgs } from '../org/context'
import { navigate } from '../router'
import { Logo } from '../ui/Logo'

export function CreateOrg({ first = false }: { first?: boolean }) {
  const { reload, select } = useOrgs()
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const org = await api<Org>('/v1/orgs', { method: 'POST', body: JSON.stringify({ name }) })
      await reload()
      select(org.id)
      navigate('/')
    } catch (err) {
      setError(err instanceof ApiError ? err.code : 'Could not create the organization')
      setBusy(false)
    }
  }

  return (
    <section className="onboard rise">
      <Logo size={40} />
      <h1>{first ? 'Create your organization' : 'New organization'}</h1>
      <p className="muted">
        An organization holds your repositories, verification history and team. You can invite
        people once it exists.
      </p>
      <form className="card form" onSubmit={submit}>
        <label className="field">
          <span>Organization name</span>
          <input
            autoFocus
            required
            minLength={2}
            maxLength={200}
            value={name}
            placeholder="Acme Robotics"
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn btn-primary" disabled={busy || name.trim().length < 2}>
          {busy ? 'Creating…' : 'Create organization'}
        </button>
      </form>
    </section>
  )
}
