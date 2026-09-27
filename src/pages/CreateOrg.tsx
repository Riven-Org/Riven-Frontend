import { useState, type FormEvent } from 'react'

import { api, ApiError } from '../api/client'
import type { Org } from '../api/types'
import { useOrgs } from '../org/context'
import { navigate } from '../router'
import { Button } from '../ui/Button'
import { Field, Input } from '../ui/Field'
import { FullScreen } from '../ui/FullScreen'

export function CreateOrg({ first = false }: { first?: boolean }) {
  const { reload, select } = useOrgs()
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (name.trim().length < 2) {
      setError('Use at least 2 characters.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const org = await api<Org>('/v1/orgs', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim() }),
      })
      await reload()
      select(org.id)
      navigate('/')
    } catch (err) {
      setError(err instanceof ApiError ? err.code : 'Could not create the organization.')
      setBusy(false)
    }
  }

  return (
    <FullScreen
      title={first ? 'Create your organization' : 'New organization'}
      description="An organization holds your repositories, verification history and team. You'll be its owner."
    >
      <form className="stack" style={{ gap: 20 }} onSubmit={submit} noValidate>
        <Field
          label="Organization name"
          error={error}
          help="Usually your company or team name. You can rename it later."
        >
          {(props) => (
            <Input
              {...props}
              autoFocus
              maxLength={200}
              value={name}
              placeholder="Acme Robotics"
              onChange={(e) => {
                setName(e.target.value)
                setError(null)
              }}
            />
          )}
        </Field>
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          {!first && <Button onClick={() => navigate('/')}>Cancel</Button>}
          <Button variant="primary" type="submit" loading={busy}>
            Create organization
          </Button>
        </div>
      </form>
    </FullScreen>
  )
}
