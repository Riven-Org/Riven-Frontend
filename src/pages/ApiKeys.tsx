import { useCallback, useEffect, useState, type FormEvent } from 'react'

import { api, ApiError } from '../api/client'
import type { ApiKey, IssuedKey, Permission, ServiceAccount } from '../api/types'
import { useOrgs, usePermissions } from '../org/context'
import { Alert } from '../ui/Alert'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { DataTable } from '../ui/DataTable'
import { EmptyState } from '../ui/EmptyState'
import { Checkbox, Field, Input, Select } from '../ui/Field'
import { relativeTime, shortDate } from '../ui/format'
import {
  Bot,
  Check,
  Copy,
  Cpu,
  Ellipsis,
  ICON_STROKE,
  KeyRound,
  Plus,
  RotateCw,
  Trash2,
  Workflow,
} from '../ui/icons'
import { Menu } from '../ui/Menu'
import { Modal } from '../ui/Modal'
import { Page } from '../ui/Page'
import { SkeletonBlock } from '../ui/Skeleton'
import { useToast } from '../ui/toast'

type Kind = 'ai_agent' | 'ci' | 'bot'

const KINDS: Record<Kind, { label: string; hint: string; icon: typeof Bot }> = {
  ai_agent: { label: 'AI agent', hint: 'A coding agent whose changes Riven verifies.', icon: Cpu },
  ci: {
    label: 'CI system',
    hint: 'A pipeline that submits changes and follows runs.',
    icon: Workflow,
  },
  bot: { label: 'Bot', hint: 'Dependency updaters and other automation.', icon: Bot },
}

const DEFAULT_SCOPES: Record<Kind, Permission[]> = {
  ai_agent: ['changes.submit', 'changes.read', 'runs.read'],
  ci: ['changes.submit', 'changes.read', 'runs.read', 'runs.cancel'],
  bot: ['changes.submit', 'changes.read'],
}

const SCOPE_AREAS: Record<string, string> = {
  changes: 'Changes',
  runs: 'Runs',
  bugs: 'Bugs',
  reviews: 'Reviews',
  locks: 'Regression locks',
  repos: 'Repositories',
  graph: 'Graph',
  members: 'Members',
  api_keys: 'API keys',
  org: 'Organization',
  audit: 'Audit',
}

function errorText(err: unknown): string {
  if (!(err instanceof ApiError)) return 'Something went wrong. Try again.'
  if (err.code.startsWith('cannot_grant:'))
    return `You can't grant ${err.code.slice('cannot_grant:'.length)} because you don't hold it yourself.`
  return err.code
}

type Pending =
  | { kind: 'revoke'; key: ApiKey; account: ServiceAccount }
  | { kind: 'disable'; account: ServiceAccount }
  | null

export function ApiKeys() {
  const { current } = useOrgs()
  const { can } = usePermissions()
  const notify = useToast()
  const [accounts, setAccounts] = useState<ServiceAccount[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [newKeyFor, setNewKeyFor] = useState<ServiceAccount | null>(null)
  const [revealed, setRevealed] = useState<IssuedKey | null>(null)
  const [pending, setPending] = useState<Pending>(null)
  const orgId = current?.id
  const canManage = can('api_keys.manage')

  const load = useCallback(() => {
    if (!orgId) return Promise.resolve()
    return api<ServiceAccount[]>(`/v1/orgs/${orgId}/service-accounts`).then(
      (list) => {
        setError(null)
        setAccounts(list)
      },
      (err: unknown) => setError(errorText(err)),
    )
  }, [orgId])

  useEffect(() => {
    void load()
  }, [load])

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

  if (!current) return null

  return (
    <Page
      title="API keys"
      description="Service accounts let AI agents, CI and bots submit changes. Everything they submit is recorded under their own identity, so a producer can never verify its own work."
      actions={
        canManage && (
          <Button variant="primary" icon={Plus} onClick={() => setCreating(true)}>
            New service account
          </Button>
        )
      }
    >
      {error ? (
        <Alert
          tone="danger"
          title="Couldn't load service accounts"
          actions={
            <Button size="sm" onClick={load}>
              Try again
            </Button>
          }
        >
          {error}
        </Alert>
      ) : !accounts ? (
        <SkeletonBlock lines={4} label="Loading service accounts" />
      ) : accounts.length === 0 ? (
        <div className="table-wrap">
          <EmptyState
            icon={KeyRound}
            title="No service accounts yet"
            action={
              canManage && (
                <Button variant="primary" icon={Plus} onClick={() => setCreating(true)}>
                  New service account
                </Button>
              )
            }
          >
            Create one for each agent or CI system, then give it an API key. Keys are shown once and
            stored hashed.
          </EmptyState>
        </div>
      ) : (
        <div>
          {accounts.map((account) => {
            const kind = KINDS[account.kind as Kind] ?? KINDS.bot
            const Icon = kind.icon
            return (
              <section key={account.id} className="account-group" aria-label={account.name}>
                <div className="account-group__head" style={{ padding: '0 0 12px' }}>
                  <div className="cell-primary">
                    <span className="empty__icon" style={{ width: 34, height: 34, margin: 0 }}>
                      <Icon size={16} strokeWidth={ICON_STROKE} />
                    </span>
                    <span className="cell-stack">
                      <strong className="row" style={{ gap: 8 }}>
                        {account.name}
                        <Badge>{kind.label}</Badge>
                      </strong>
                      <span>
                        {account.agent_model ? (
                          <span className="mono">{account.agent_model} · </span>
                        ) : null}
                        Created {shortDate(account.created_at)}
                      </span>
                    </span>
                  </div>
                  {canManage && (
                    <div className="row">
                      <Button size="sm" icon={Plus} onClick={() => setNewKeyFor(account)}>
                        New key
                      </Button>
                      <Menu
                        trigger={(props) => (
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Ellipsis}
                            aria-label={`Actions for ${account.name}`}
                            {...props}
                          />
                        )}
                        items={[
                          {
                            label: 'Disable account',
                            icon: Trash2,
                            danger: true,
                            onSelect: () => setPending({ kind: 'disable', account }),
                          },
                        ]}
                      />
                    </div>
                  )}
                </div>
                <DataTable
                  label={`${account.name} keys`}
                  rows={account.keys}
                  rowKey={(k) => k.id}
                  compactEmpty
                  empty={{
                    icon: KeyRound,
                    title: 'No active keys',
                    text: 'Issue a key so this account can authenticate.',
                    action: canManage && (
                      <Button size="sm" icon={Plus} onClick={() => setNewKeyFor(account)}>
                        New key
                      </Button>
                    ),
                  }}
                  columns={[
                    {
                      key: 'key',
                      header: 'Key',
                      main: true,
                      render: (k) => <code className="code-inline">{k.prefix}_••••••••</code>,
                    },
                    {
                      key: 'scopes',
                      header: 'Scopes',
                      render: (k) => (
                        <span
                          className="row"
                          style={{ flexWrap: 'wrap', gap: 4 }}
                          title={k.scopes.join(', ')}
                        >
                          {k.scopes.slice(0, 3).map((s) => (
                            <code key={s} className="code-inline">
                              {s}
                            </code>
                          ))}
                          {k.scopes.length > 3 && <Badge>+{k.scopes.length - 3}</Badge>}
                        </span>
                      ),
                    },
                    {
                      key: 'used',
                      header: 'Last used',
                      render: (k) => (
                        <span className="t-sm t-muted">{relativeTime(k.last_used_at)}</span>
                      ),
                    },
                    {
                      key: 'expires',
                      header: 'Expires',
                      render: (k) => (
                        <span className="t-sm t-muted">
                          {k.expires_at ? shortDate(k.expires_at) : 'Never'}
                        </span>
                      ),
                    },
                    {
                      key: 'actions',
                      actions: true,
                      header: '',
                      align: 'right',
                      shrink: true,
                      hideLabelOnMobile: true,
                      render: (k) =>
                        canManage ? (
                          <Menu
                            trigger={(props) => (
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={Ellipsis}
                                aria-label={`Actions for key ${k.prefix}`}
                                {...props}
                              />
                            )}
                            items={[
                              {
                                label: 'Rotate key',
                                icon: RotateCw,
                                onSelect: async () => {
                                  const issued = await run(() =>
                                    api<IssuedKey>(`/v1/orgs/${orgId}/api-keys/${k.id}/rotate`, {
                                      method: 'POST',
                                    }),
                                  )
                                  if (issued) setRevealed(issued)
                                },
                              },
                              {
                                label: 'Revoke key',
                                icon: Trash2,
                                danger: true,
                                onSelect: () => setPending({ kind: 'revoke', key: k, account }),
                              },
                            ]}
                          />
                        ) : null,
                    },
                  ]}
                />
              </section>
            )
          })}
        </div>
      )}

      {creating && (
        <NewAccountDialog
          onClose={() => setCreating(false)}
          onCreate={async (name, kind, model) => {
            await api(`/v1/orgs/${orgId}/service-accounts`, {
              method: 'POST',
              body: JSON.stringify({ name, kind, agent_model: model || null }),
            })
            notify(`Service account ${name} created`)
            await load()
          }}
        />
      )}
      {newKeyFor && (
        <NewKeyDialog
          account={newKeyFor}
          granted={current.permissions}
          onClose={() => setNewKeyFor(null)}
          onCreate={async (scopes, days) => {
            const issued = await api<IssuedKey>(
              `/v1/orgs/${orgId}/service-accounts/${newKeyFor.id}/keys`,
              {
                method: 'POST',
                body: JSON.stringify({ scopes, expires_in_days: days }),
              },
            )
            setNewKeyFor(null)
            setRevealed(issued)
            await load()
          }}
        />
      )}
      {revealed && <RevealKey issued={revealed} onClose={() => setRevealed(null)} />}
      {pending?.kind === 'revoke' && (
        <ConfirmDialog
          title="Revoke this key?"
          confirmLabel="Revoke key"
          onClose={() => setPending(null)}
          onConfirm={() =>
            run(
              () => api(`/v1/orgs/${orgId}/api-keys/${pending.key.id}`, { method: 'DELETE' }),
              'Key revoked',
            )
          }
        >
          Anything using <code className="code-inline">{pending.key.prefix}_…</code> for{' '}
          {pending.account.name} stops working on its next request. This can't be undone.
        </ConfirmDialog>
      )}
      {pending?.kind === 'disable' && (
        <ConfirmDialog
          title={`Disable ${pending.account.name}?`}
          confirmLabel="Disable account"
          onClose={() => setPending(null)}
          onConfirm={() =>
            run(
              () =>
                api(`/v1/orgs/${orgId}/service-accounts/${pending.account.id}`, {
                  method: 'DELETE',
                }),
              `${pending.account.name} disabled and its keys revoked`,
            )
          }
        >
          All of its keys are revoked immediately. Changes it already submitted stay in the history.
        </ConfirmDialog>
      )}
    </Page>
  )
}

function NewAccountDialog({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (name: string, kind: Kind, model: string) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [kind, setKind] = useState<Kind>('ai_agent')
  const [model, setModel] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!/^[A-Za-z0-9._-]{2,100}$/.test(name)) {
      setError('Use 2–100 letters, numbers, dots, dashes or underscores.')
      return
    }
    setBusy(true)
    try {
      await onCreate(name, kind, model)
      onClose()
    } catch (err) {
      setError(errorText(err))
      setBusy(false)
    }
  }

  return (
    <Modal
      title="New service account"
      description="An identity for one agent or system. You'll issue its API key next."
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="account-form" loading={busy}>
            Create account
          </Button>
        </>
      }
    >
      <form id="account-form" className="stack" style={{ gap: 16 }} onSubmit={submit} noValidate>
        <Field
          label="Name"
          error={error}
          help="Shown as the producer of every change it submits, e.g. sa:claude-code."
        >
          {(props) => (
            <Input
              {...props}
              autoFocus
              value={name}
              placeholder="claude-code"
              onChange={(e) => {
                setName(e.target.value)
                setError(null)
              }}
            />
          )}
        </Field>
        <Field label="Type" help={KINDS[kind].hint}>
          {(props) => (
            <Select {...props} value={kind} onChange={(e) => setKind(e.target.value as Kind)}>
              {(Object.keys(KINDS) as Kind[]).map((k) => (
                <option key={k} value={k}>
                  {KINDS[k].label}
                </option>
              ))}
            </Select>
          )}
        </Field>
        {kind === 'ai_agent' && (
          <Field label="Model" optional help="Recorded with its changes so you can compare models.">
            {(props) => (
              <Input
                {...props}
                value={model}
                maxLength={128}
                placeholder="claude-opus-5-5"
                onChange={(e) => setModel(e.target.value)}
              />
            )}
          </Field>
        )}
      </form>
    </Modal>
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
  onCreate: (scopes: Permission[], days: number | null) => Promise<void>
}) {
  const [scopes, setScopes] = useState<Set<Permission>>(
    () => new Set((DEFAULT_SCOPES[account.kind as Kind] ?? []).filter((s) => granted.includes(s))),
  )
  const [days, setDays] = useState('90')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const areas = granted.reduce<Record<string, Permission[]>>((acc, p) => {
    const area = p.split('.')[0]
    ;(acc[area] ??= []).push(p)
    return acc
  }, {})

  const toggle = (p: Permission, on: boolean) =>
    setScopes((cur) => {
      const next = new Set(cur)
      if (on) next.add(p)
      else next.delete(p)
      return next
    })

  return (
    <Modal
      wide
      title={`New key for ${account.name}`}
      description="Choose what the key may do. You can only grant permissions you hold."
      onClose={onClose}
      footer={
        <>
          <span className="t-sm t-muted" style={{ marginRight: 'auto', alignSelf: 'center' }}>
            {scopes.size} scope{scopes.size === 1 ? '' : 's'} selected
          </span>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            loading={busy}
            disabled={scopes.size === 0}
            onClick={async () => {
              setBusy(true)
              try {
                await onCreate([...scopes], days === 'never' ? null : Number(days))
              } catch (err) {
                setError(errorText(err))
                setBusy(false)
              }
            }}
          >
            Create key
          </Button>
        </>
      }
    >
      {error && <Alert tone="danger">{error}</Alert>}
      <div className="scope-groups" role="group" aria-label="Scopes">
        {Object.entries(areas).map(([area, perms]) => (
          <div key={area} className="scope-group">
            <span className="t-overline">{SCOPE_AREAS[area] ?? area}</span>
            {perms.map((p) => (
              <Checkbox key={p} checked={scopes.has(p)} onChange={(on) => toggle(p, on)}>
                <code>{p}</code>
              </Checkbox>
            ))}
          </div>
        ))}
      </div>
      <Field label="Expiry" help="Short-lived keys limit the damage if one leaks.">
        {(props) => (
          <Select
            {...props}
            value={days}
            onChange={(e) => setDays(e.target.value)}
            style={{ maxWidth: 220 }}
          >
            <option value="30">30 days</option>
            <option value="90">90 days</option>
            <option value="365">1 year</option>
            <option value="never">No expiry</option>
          </Select>
        )}
      </Field>
    </Modal>
  )
}

function RevealKey({ issued, onClose }: { issued: IssuedKey; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  return (
    <Modal
      title="Copy your API key"
      onClose={onClose}
      footer={
        <Button variant="primary" onClick={onClose}>
          Done
        </Button>
      }
    >
      <Alert tone="warning" title="This is the only time the key is shown">
        Store it in your agent's or CI's secret store now. Riven keeps only a hash.
      </Alert>
      <div className="secret-box">
        <code data-testid="api-key-secret">{issued.secret}</code>
        <Button
          size="sm"
          icon={copied ? Check : Copy}
          onClick={async () => {
            await navigator.clipboard.writeText(issued.secret).catch(() => undefined)
            setCopied(true)
          }}
        >
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
      <p className="t-sm t-muted">
        Send it as <code className="code-inline">Authorization: Bearer {issued.prefix}_…</code>
      </p>
    </Modal>
  )
}
