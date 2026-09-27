import { useEffect, useState } from 'react'

import { api, ApiError } from '../api/client'
import type { Org } from '../api/types'
import { useOrgs } from '../org/context'
import { navigate } from '../router'
import { Spinner } from '../ui/Spinner'

const MESSAGES: Record<string, string> = {
  invitation_not_found: 'This invitation is invalid, expired, revoked or already used.',
  invitation_for_another_email: 'This invitation was sent to a different email address.',
}

let accepting: Promise<Org> | null = null

export function AcceptInvite() {
  const { reload, select } = useOrgs()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token') ?? ''
    accepting ??= api<Org>('/v1/invitations/accept', {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
    accepting
      .then(async (org) => {
        await reload()
        select(org.id)
        navigate('/', { replace: true })
      })
      .catch((err: unknown) => {
        const code = err instanceof ApiError ? err.code : ''
        setError(MESSAGES[code] ?? 'The invitation could not be accepted.')
      })
  }, [reload, select])

  if (!error) return <Spinner label="Joining the organization…" />
  return (
    <section className="onboard rise">
      <h1>Invitation</h1>
      <p className="error">{error}</p>
      <button className="btn" onClick={() => navigate('/', { replace: true })}>
        Go to dashboard
      </button>
    </section>
  )
}
