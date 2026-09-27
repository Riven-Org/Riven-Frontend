import { useEffect, useState } from 'react'

import { api, ApiError } from '../api/client'
import type { Org } from '../api/types'
import { useOrgs } from '../org/context'
import { navigate } from '../router'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { FullScreen, LoadingScreen } from '../ui/FullScreen'

const MESSAGES: Record<string, string> = {
  invitation_not_found: 'This invitation is invalid, has expired, was revoked or was already used.',
  invitation_for_another_email:
    'This invitation was sent to a different email address than the one you signed in with.',
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

  if (!error) return <LoadingScreen label="Joining the organization…" />
  return (
    <FullScreen
      title="Invitation can't be used"
      description="Ask whoever invited you to send a new invitation."
    >
      <Alert tone="danger">{error}</Alert>
      <div>
        <Button variant="primary" onClick={() => navigate('/', { replace: true })}>
          Go to dashboard
        </Button>
      </div>
    </FullScreen>
  )
}
