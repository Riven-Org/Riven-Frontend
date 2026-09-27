import { useEffect, useState } from 'react'

import { completeSignIn } from '../auth/userManager'
import { navigate } from '../router'
import { Spinner } from '../ui/Spinner'

export function AuthCallback() {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    completeSignIn()
      .then((returnTo) => navigate(returnTo.startsWith('/auth') ? '/' : returnTo, { replace: true }))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : String(err)))
  }, [])

  if (error) {
    return (
      <div className="center-screen">
        <h2>Sign-in did not complete</h2>
        <p className="muted">{error}</p>
        <button className="btn btn-primary" onClick={() => navigate('/', { replace: true })}>
          Back to sign in
        </button>
      </div>
    )
  }
  return <Spinner label="Signing you in…" />
}
