import { useAuth } from '../auth/context'
import { useOrgs } from '../org/context'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { FullScreen } from '../ui/FullScreen'
import { LogOut, ShieldCheck } from '../ui/icons'

/** Shown when the current org requires 2FA and the user has not enrolled (S03.5.2). */
export function MfaRequired() {
  const { startAction, signOut } = useAuth()
  const { current, orgs, select } = useOrgs()
  const other = orgs.find((o) => o.id !== current?.id && !o.require_mfa)

  return (
    <FullScreen
      title="Two-factor authentication required"
      description={`${current?.name ?? 'This organization'} requires every member to sign in with a second factor.`}
    >
      <Alert tone="info" title="It takes about a minute">
        Install an authenticator app such as Google Authenticator, 1Password or Authy, then scan the
        code on the next screen.
      </Alert>
      <div className="row" style={{ flexWrap: 'wrap' }}>
        <Button variant="primary" icon={ShieldCheck} onClick={() => startAction('CONFIGURE_TOTP')}>
          Set up authenticator app
        </Button>
        {other && <Button onClick={() => select(other.id)}>Switch to {other.name}</Button>}
        <Button variant="ghost" icon={LogOut} onClick={() => signOut()}>
          Sign out
        </Button>
      </div>
    </FullScreen>
  )
}
