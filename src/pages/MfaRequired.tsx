import { useAuth } from '../auth/context'
import { useOrgs } from '../org/context'
import { Logo } from '../ui/Logo'

/** Shown when the current org requires 2FA and the user has not enrolled (S03.5.2). */
export function MfaRequired() {
  const { startAction, signOut } = useAuth()
  const { current, orgs, select } = useOrgs()
  const others = orgs.filter((o) => o.id !== current?.id && !o.require_mfa)

  return (
    <section className="onboard rise">
      <Logo size={40} />
      <h1>Two-factor authentication required</h1>
      <p className="muted">
        {current?.name ?? 'This organization'} requires every member to sign in with a second
        factor. Set up an authenticator app (Google Authenticator, 1Password, Authy…) to continue.
      </p>
      <div className="actions">
        <button className="btn btn-primary" onClick={() => startAction('CONFIGURE_TOTP')}>
          Set up authenticator app
        </button>
        {others.length > 0 && (
          <button className="btn" onClick={() => select(others[0].id)}>
            Switch to {others[0].name}
          </button>
        )}
        <button className="btn" onClick={() => signOut()}>
          Sign out
        </button>
      </div>
    </section>
  )
}
