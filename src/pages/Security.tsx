import { useCallback, useEffect, useState } from 'react'

import { api, ApiError } from '../api/client'
import type { Org, Security as SecurityState, Session } from '../api/types'
import { useAuth } from '../auth/context'
import { oidcConfig } from '../config'
import { useOrgs, usePermissions } from '../org/context'
import { Alert } from '../ui/Alert'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { DataTable } from '../ui/DataTable'
import { Switch } from '../ui/Field'
import { dateTime, relativeTime } from '../ui/format'
import { ExternalLink, ICON_STROKE, Laptop, LogOut, ShieldAlert, ShieldCheck } from '../ui/icons'
import { Page, Section } from '../ui/Page'
import { Skeleton } from '../ui/Skeleton'
import { useToast } from '../ui/toast'

export function Security() {
  const { startAction } = useAuth()
  const { current, reload } = useOrgs()
  const { can } = usePermissions()
  const notify = useToast()
  const [security, setSecurity] = useState<SecurityState | null>(null)
  const [sessions, setSessions] = useState<Session[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmOthers, setConfirmOthers] = useState(false)
  const [savingPolicy, setSavingPolicy] = useState(false)

  const load = useCallback(() => {
    return Promise.all([
      api<SecurityState>('/v1/me/security'),
      api<Session[]>('/v1/me/sessions'),
    ]).then(
      ([status, list]) => {
        setError(null)
        setSecurity(status)
        setSessions(list)
      },
      (err: unknown) =>
        setError(err instanceof ApiError ? err.code : 'Could not load your sessions'),
    )
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function run(action: () => Promise<unknown>, success: string) {
    try {
      await action()
      notify(success)
      await Promise.all([load(), reload()])
    } catch (err) {
      const code = err instanceof ApiError ? err.code : ''
      notify(
        code === 'enable_mfa_first'
          ? 'Set up two-factor authentication for yourself first.'
          : code || 'Something went wrong',
        'bad',
      )
    }
  }

  const others = sessions?.filter((s) => !s.current) ?? []

  return (
    <Page title="Security" description="How you sign in, and where you're signed in right now.">
      <Section
        title="Sign-in"
        description="Protect your account with a second factor from an authenticator app."
      >
        <div className="settings">
          <div className="setting">
            <div className="setting__text">
              <h3>
                Two-factor authentication
                {security &&
                  (security.mfa_enrolled ? (
                    <Badge tone="success" icon={ShieldCheck}>
                      On
                    </Badge>
                  ) : (
                    <Badge tone="warning" icon={ShieldAlert}>
                      Off
                    </Badge>
                  ))}
              </h3>
              <p>
                {security?.mfa_enrolled
                  ? 'Sign-in asks for a code from your authenticator app. Keep recovery codes somewhere safe.'
                  : 'Anyone with your password can sign in. Add an authenticator app to require a code.'}
              </p>
            </div>
            <div className="setting__control">
              {!security ? (
                <Skeleton width={140} height={30} />
              ) : security.mfa_enrolled ? (
                <>
                  <Button onClick={() => startAction('CONFIGURE_RECOVERY_AUTHN_CODES')}>
                    Recovery codes
                  </Button>
                  <Button
                    variant="ghost"
                    trailingIcon={ExternalLink}
                    onClick={() =>
                      window.open(
                        `${oidcConfig.authority}/account/account-security/signing-in`,
                        '_blank',
                        'noopener',
                      )
                    }
                  >
                    Manage
                  </Button>
                </>
              ) : (
                <Button variant="primary" onClick={() => startAction('CONFIGURE_TOTP')}>
                  Set up authenticator app
                </Button>
              )}
            </div>
          </div>
        </div>
      </Section>

      {current && can('org.security') && (
        <Section
          title="Organization policy"
          description={`Rules that apply to everyone in ${current.name}.`}
        >
          <div className="settings">
            <div className="setting">
              <div className="setting__text">
                <h3>Require two-factor authentication</h3>
                <p>
                  Members without a second factor are asked to set one up at their next sign-in and
                  can't open {current.name} until they do. You need two-factor yourself to turn this
                  on.
                </p>
              </div>
              <div className="setting__control">
                <Switch
                  label="Require two-factor authentication"
                  checked={current.require_mfa}
                  disabled={savingPolicy}
                  onChange={async (on) => {
                    setSavingPolicy(true)
                    await run(
                      () =>
                        api<Org>(`/v1/orgs/${current.id}/security`, {
                          method: 'PATCH',
                          body: JSON.stringify({ require_mfa: on }),
                        }),
                      on
                        ? 'Two-factor authentication is now required'
                        : 'Two-factor requirement turned off',
                    )
                    setSavingPolicy(false)
                  }}
                />
              </div>
            </div>
          </div>
        </Section>
      )}

      <Section
        title="Sessions"
        description="Browsers and devices signed in to your account. Revoked sessions are signed out on their next request."
        actions={
          others.length > 0 && (
            <Button variant="danger-ghost" icon={LogOut} onClick={() => setConfirmOthers(true)}>
              Sign out everywhere else
            </Button>
          )
        }
      >
        {error && (
          <Alert
            tone="danger"
            title="Couldn't load sessions"
            actions={
              <Button size="sm" onClick={load}>
                Try again
              </Button>
            }
          >
            {error}
          </Alert>
        )}
        {!error && (
          <DataTable
            label="sessions"
            rows={sessions}
            rowKey={(s) => s.id}
            empty={{
              icon: Laptop,
              title: 'No active sessions',
              text: 'Sessions appear here when you sign in.',
            }}
            columns={[
              {
                key: 'session',
                header: 'Session',
                main: true,
                render: (s) => (
                  <span className="cell-primary">
                    <span className="empty__icon" style={{ width: 30, height: 30, margin: 0 }}>
                      <Laptop size={15} strokeWidth={ICON_STROKE} />
                    </span>
                    <span className="cell-stack">
                      <strong className="row" style={{ gap: 6 }}>
                        {s.ip_address || 'Unknown address'}
                        {s.current && (
                          <Badge tone="success" dot>
                            This session
                          </Badge>
                        )}
                      </strong>
                      <span>{s.clients.join(', ') || 'Riven'}</span>
                    </span>
                  </span>
                ),
              },
              {
                key: 'started',
                header: 'Signed in',
                render: (s) => (
                  <span className="t-sm t-muted" title={dateTime(s.started_at)}>
                    {relativeTime(s.started_at)}
                  </span>
                ),
              },
              {
                key: 'active',
                header: 'Last active',
                render: (s) => (
                  <span className="t-sm t-muted">{relativeTime(s.last_access_at)}</span>
                ),
              },
              {
                key: 'actions',
                actions: true,
                header: '',
                align: 'right',
                shrink: true,
                hideLabelOnMobile: true,
                render: (s) =>
                  s.current ? null : (
                    <Button
                      variant="danger-ghost"
                      size="sm"
                      onClick={() =>
                        run(
                          () => api(`/v1/me/sessions/${s.id}`, { method: 'DELETE' }),
                          'Session signed out',
                        )
                      }
                    >
                      Revoke
                    </Button>
                  ),
              },
            ]}
          />
        )}
      </Section>

      {confirmOthers && (
        <ConfirmDialog
          title="Sign out everywhere else?"
          confirmLabel={`Sign out ${others.length} session${others.length === 1 ? '' : 's'}`}
          onClose={() => setConfirmOthers(false)}
          onConfirm={() =>
            run(
              () => api('/v1/me/sessions/revoke-others', { method: 'POST' }),
              'Signed out of all other sessions',
            )
          }
        >
          Every other browser and device is signed out on its next request. This session stays
          signed in.
        </ConfirmDialog>
      )}
    </Page>
  )
}
