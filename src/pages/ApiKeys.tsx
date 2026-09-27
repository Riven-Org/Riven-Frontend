import { useCallback, useEffect, useState, type FormEvent } from 'react'

import { api, ApiError } from '../api/client'
import type { IssuedKey, Permission, ServiceAccount } from '../api/types'
import { useOrgs, usePermissions } from '../org/context'
import { Modal } from '../ui/Modal'
import { useToast } from '../ui/toast'

type Kind = 'ai_agent' | 'ci' | 'bot'

const KINDS: { value: Kind; label: string; hint: string }[] = [
  { value: 'ai_agent', label: 'AI agent', hint: 'A coding agent whose changes Riven verifies' },
  { value: 'ci', label: 'CI system', hint: 'A pipeline that submits changes and reads runs' },
  { value: 'bot', label: 'Bot', hint: 'Dependency updaters and other automation' },
]

const DEFAULT_SCOPES: Record<Kind, Permission[]> = {
  ai_agent: ['changes.submit', 'changes.read', 'runs.read'],
  ci: ['changes.submit', 'changes.read', 'runs.read', 'runs.cancel'],
  bot: ['changes.submit', 'changes.read'],
}

function relative(iso: string | null): string {
  if (!iso) return 'never'
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)} h ago`
  return new Date(iso).toLocaleDateString()
}

function errorText(err: unknown): string {
  if (!(err instanceof ApiError)) return 'Something went wrong'
  if (err.code.startsWith('cannot_grant:')) {
    return `You can't grant ${err.code.slice('cannot_grant:'.length)}: you don't hold it yourself.`
  }
  return err.code
}

export function ApiKeys() {
  const { current } = useOrgs()
  const { can } = usePermissions()
  const notify = useToast()
  const [accounts, setAccounts] = useState<ServiceAccount[] | null>(null)
  const [revealed, setRevealed] = useState<IssuedKey | null>(null)
  const [newKeyFor, setNewKeyFor] = useState<ServiceAccount | null>(null)
  const [name, setName] = useState('')
  const [kind, setKind] = useState<Kind>('ai_agent')
  const [model, setModel] = useState('')
  const orgId = current?.id
  const canManage = can('api_keys.manage')

  const load = useCallback(() => {
    if (!orgId) return Promise.resolve()
    return api<ServiceAccount[]>(`/v1/orgs/${orgId}/service-accounts`).then(setAccounts)
  }, [orgId])

  useEffect(() => {
    load().catch((err) => notify(errorText(err), 'bad'))
  }, [load, notify])

  async function run<T>(action: () => Promise<T>, success?: string): Promise<T | undefined> {
    try {
      const result = await action()
      if (success) notify(success)
      await load()
      return result
    } catch (err) {
      notify(errorText(err), 'bad')
      return undefined
    }
  }

  async function createAccount(event: FormEvent) {
    event.preventDefault()
    await run(
      () =>
        api(`/v1/orgs/${orgId}/service-accounts`, {
          method: 'POST',
          body: JSON.stringify({ name, kind, agent_model: model || null }),
        }),
      `Service account ${name} created`,
    )
    setName('')
    setModel('')
  }

  if (!current) return null

  return (
    <section className="page">
      <header className="page-head rise">
        <h1>API keys</h1>
        <p className="muted">
          Service accounts let AI agents, CI and bots submit changes. Every change they submit is
          recorded under their identity, so Riven never lets a producer verify its own work.
        </p>
      </header>

      {canManage && (
        <form className="card rise" onSubmit={createAccount} style={{ animationDelay: '60ms' }}>
          <h2 className="card-title">New service account</h2>
          <div className="invite-row">
            <label className="field grow">
              <span>Name</span>
              <input
                required
                pattern="[A-Za-z0-9._\-]+"
                minLength={2}
                maxLength={100}
                value={name}
                placeholder="claude-code"
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className="field">
              <span>Kind</span>
              <select value={kind} onChange={(e) => setKind(e.target.value as Kind)}>
                {KINDS.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </select>
            </label>
            {kind === 'ai_agent' && (
              <label className="field">
                <span>Model (optional)</span>
                <input
                  value={model}
                  maxLength={128}
                  placeholder="claude-opus-5-5"
                  onChange={(e) => setModel(e.target.value)}
                />
              </label>
            )}
            <button className="btn btn-primary" disabled={name.length < 2}>
              Create
            </button>
          </div>
          <p className="muted small">{KINDS.find((k) => k.value === kind)?.hint}</p>
        </form>
      )}

      {!accounts ? (
        <div className="card">
          <div className="skeleton-lines" aria-busy="true">
            <span />
            <span />
          </div>
        </div>
      ) : accounts.length === 0 ? (
        <div className="card empty rise">
          <p>No service accounts yet.</p>
          {canManage && <p className="muted">Create one above to connect an agent or CI.</p>}
        </div>
      ) : (
        accounts.map((account, index) => (
          <article
            key={account.id}
            className="card rise"
            style={{ animationDelay: `${120 + index * 60}ms` }}
          >
            <header className="account-head">
              <div>
                <h2 className="account-name">{account.name}</h2>
                <span className="muted">
                  {KINDS.find((k) => k.value === account.kind)?.label ?? account.kind}
                  {account.agent_model ? ` · ${account.agent_model}` : ''}
                </span>
              </div>
              {canManage && (
                <div className="actions">
                  <button className="btn btn-sm" onClick={() => setNewKeyFor(account)}>
                    New key
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() =>
                      run(
                        () =>
                          api(`/v1/orgs/${orgId}/service-accounts/${account.id}`, {
                            method: 'DELETE',
                          }),
                        `${account.name} disabled and its keys revoked`,
                      )
                    }
                  >
                    Disable
                  </button>
                </div>
              )}
            </header>
            {account.keys.length === 0 ? (
              <p className="muted">No active keys.</p>
            ) : (
              <ul className="rows">
                {account.keys.map((key) => (
                  <li key={key.id} className="row key-row">
                    <code className="key-prefix">{key.prefix}_••••••••</code>
                    <span className="row-main">
                      <span className="scopes">
                        {key.scopes.map((s) => (
                          <span key={s} className="scope">
                            {s}
                          </span>
                        ))}
                      </span>
                      <span className="muted small">
                        Created {relative(key.created_at)} · last used {relative(key.last_used_at)}
                        {' · '}
                        {key.expires_at
                          ? `expires ${new Date(key.expires_at).toLocaleDateString()}`
                          : 'never expires'}
                      </span>
                    </span>
                    {canManage && (
                      <span className="actions">
                        <button
                          className="btn btn-sm"
                          onClick={async () => {
                            const issued = await run(() =>
                              api<IssuedKey>(`/v1/orgs/${orgId}/api-keys/${key.id}/rotate`, {
                                method: 'POST',
                              }),
                            )
                            if (issued) setRevealed(issued)
                          }}
                        >
                          Rotate
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() =>
                            run(
                              () => api(`/v1/orgs/${orgId}/api-keys/${key.id}`, { method: 'DELETE' }),
                              'Key revoked',
                            )
                          }
                        >
                          Revoke
                        </button>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))
      )}

      {newKeyFor && (
        <NewKeyDialog
          account={newKeyFor}
          granted={current.permissions}
          onClose={() => setNewKeyFor(null)}
          onCreate={async (scopes, days) => {
            const issued = await run(() =>
              api<IssuedKey>(`/v1/orgs/${orgId}/service-accounts/${newKeyFor.id}/keys`, {
                method: 'POST',
                body: JSON.stringify({ scopes, expires_in_days: days }),
              }),
            )
            setNewKeyFor(null)
            if (issued) setRevealed(issued)
          }}
        />
      )}
      {revealed && <RevealKey issued={revealed} onClose={() => setRevealed(null)} />}
    </section>
  )
}

function NewKeyDialog({
  account,
  granted,
  onClose,
  onCreate,
}: {
  account: ServiceAccount
  granted: Permission[]
  onClose: () => void
  onCreate: (scopes: Permission[], days: number | null) => void
}) {
  const [scopes, setScopes] = useState<Set<Permission>>(
    () => new Set(DEFAULT_SCOPES[account.kind as Kind] ?? []),
  )
  const [days, setDays] = useState<string>('90')

  const toggle = (p: Permission) =>
    setScopes((current) => {
      const next = new Set(current)
      if (next.has(p)) next.delete(p)
      else next.add(p)
      return next
    })

  return (
    <Modal title={`New key for ${account.name}`} onClose={onClose}>
      <p className="muted">Pick what this key may do. You can only grant what you hold.</p>
      <div className="scope-grid" role="group" aria-label="Scopes">
        {granted.map((p) => (
          <label key={p} className="check">
            <input type="checkbox" checked={scopes.has(p)} onChange={() => toggle(p)} />
            <code>{p}</code>
          </label>
        ))}
      </div>
      <label className="field">
        <span>Expires</span>
        <select value={days} onChange={(e) => setDays(e.target.value)}>
          <option value="30">in 30 days</option>
          <option value="90">in 90 days</option>
          <option value="365">in 1 year</option>
          <option value="never">never</option>
        </select>
      </label>
      <div className="modal-actions">
        <button className="btn" onClick={onClose}>
          Cancel
        </button>
        <button
          className="btn btn-primary"
          disabled={scopes.size === 0}
          onClick={() => onCreate([...scopes], days === 'never' ? null : Number(days))}
        >
          Create key
        </button>
      </div>
    </Modal>
  )
}

function RevealKey({ issued, onClose }: { issued: IssuedKey; onClose: () => void }) {
  const [copied, setCopied] = useState(false)

  return (
    <Modal title="Copy your new API key" onClose={onClose}>
      <p className="warning">
        This is the only time the key is shown. Store it in your agent's or CI's secret store now.
      </p>
      <div className="secret">
        <code data-testid="api-key-secret">{issued.secret}</code>
        <button
          className="btn btn-sm btn-primary"
          onClick={async () => {
            await navigator.clipboard.writeText(issued.secret).catch(() => undefined)
            setCopied(true)
          }}
        >
          {copied ? 'Copied ✓' : 'Copy'}
        </button>
      </div>
      <p className="muted small">
        Use it as <code>Authorization: Bearer {issued.prefix}_…</code>
      </p>
      <div className="modal-actions">
        <button className="btn btn-primary" onClick={onClose}>
          I've stored it
        </button>
      </div>
    </Modal>
  )
}
