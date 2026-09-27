import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useState } from 'react'

import { api, ApiError } from '../api/client'
import type { Org, Security as SecurityState, Session } from '../api/types'
import { useAuth } from '../auth/context'
import { oidcConfig } from '../config'
import { useOrgs, usePermissions } from '../org/context'
import { useToast } from '../ui/toast'
import { ShieldCheck } from '../ui/icons'
import { Stagger } from '../ui/motion'
import { fadeUp, listItem } from '../ui/variants'
import { PageHeader } from '../ui/PageHeader'

function since(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)} h ago`
  return new Date(iso).toLocaleString()
}

export function Security() {
  const { startAction } = useAuth()
  const { current, reload } = useOrgs()
  const { can } = usePermissions()
  const notify = useToast()
  const [security, setSecurity] = useState<SecurityState | null>(null)
  const [sessions, setSessions] = useState<Session[] | null>(null)

  const load = useCallback(
    () =>
      Promise.all([api<SecurityState>('/v1/me/security'), api<Session[]>('/v1/me/sessions')]).then(
        ([status, list]) => {
          setSecurity(status)
          setSessions(list)
        },
      ),
    [],
  )

  useEffect(() => {
    load().catch(() => notify('Could not load your security settings', 'bad'))
  }, [load, notify])

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
    <Stagger className="page">
      <PageHeader
        icon={ShieldCheck}
        title="Security"
        subtitle="Two-factor authentication and where you're signed in."
      />

      <div className="grid">
        <motion.article className="card" variants={fadeUp}>
          <h2 className="card-title">Two-factor authentication</h2>
          {!security ? (
            <div className="skeleton-lines" aria-busy="true">
              <span />
              <span />
            </div>
          ) : (
            <div className="stack">
              <p className="status-line">
                <span className={`dot ${security.mfa_enrolled ? 'dot-ok' : 'dot-warn'}`} />
                {security.mfa_enrolled ? 'Enabled — sign-in asks for a code' : 'Not set up'}
              </p>
              {security.mfa_enrolled ? (
                <>
                  <button
                    className="btn"
                    onClick={() => startAction('CONFIGURE_RECOVERY_AUTHN_CODES')}
                  >
                    Generate recovery codes
                  </button>
                  <a
                    className="link"
                    href={`${oidcConfig.authority}/account/account-security/signing-in`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Manage authenticators ↗
                  </a>
                </>
              ) : (
                <button className="btn btn-primary" onClick={() => startAction('CONFIGURE_TOTP')}>
                  Set up authenticator app
                </button>
              )}
            </div>
          )}
        </motion.article>

        {current && can('org.security') && (
          <motion.article className="card" variants={fadeUp}>
            <h2 className="card-title">{current.name} policy</h2>
            <label className="switch">
              <input
                type="checkbox"
                role="switch"
                checked={current.require_mfa}
                onChange={(e) =>
                  run(
                    () =>
                      api<Org>(`/v1/orgs/${current.id}/security`, {
                        method: 'PATCH',
                        body: JSON.stringify({ require_mfa: e.target.checked }),
                      }),
                    e.target.checked
                      ? 'Two-factor authentication is now required'
                      : 'Two-factor requirement turned off',
                  )
                }
              />
              <span className="switch-track" aria-hidden="true" />
              <span>Require two-factor authentication for every member</span>
            </label>
            <p className="muted small">
              Members without it are asked to set it up at their next sign-in and can't open this
              organization until they do.
            </p>
          </motion.article>
        )}
      </div>

      <motion.article className="card" variants={fadeUp}>
        <header className="account-head">
          <h2 className="card-title">Active sessions</h2>
          {others.length > 0 && (
            <button
              className="btn btn-sm btn-danger"
              onClick={() =>
                run(
                  () => api('/v1/me/sessions/revoke-others', { method: 'POST' }),
                  'Signed out of all other sessions',
                )
              }
            >
              Sign out everywhere else
            </button>
          )}
        </header>
        {!sessions ? (
          <div className="skeleton-lines" aria-busy="true">
            <span />
            <span />
          </div>
        ) : (
          <ul className="rows">
            <AnimatePresence initial={false}>
              {sessions.map((s) => (
                <motion.li
                  key={s.id}
                  className="row"
                  variants={listItem}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  layout
                >
                  <span className="session-icon" aria-hidden="true">
                    ⌁
                  </span>
                  <span className="row-main">
                    <strong>
                      {s.ip_address || 'Unknown address'}{' '}
                      {s.current && <span className="pill">This session</span>}
                    </strong>
                    <span className="muted small">
                      Signed in {since(s.started_at)} · active {since(s.last_access_at)}
                      {s.clients.length ? ` · ${s.clients.join(', ')}` : ''}
                    </span>
                  </span>
                  {!s.current && (
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() =>
                        run(
                          () => api(`/v1/me/sessions/${s.id}`, { method: 'DELETE' }),
                          'Session signed out',
                        )
                      }
                    >
                      Revoke
                    </button>
                  )}
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </motion.article>
    </Stagger>
  )
}
