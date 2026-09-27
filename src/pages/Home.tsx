import { useCallback, useEffect, useState } from 'react'

import { api } from '../api/client'
import type { Change, Invitation, Member, Security, ServiceAccount } from '../api/types'
import { useOrgs, usePermissions } from '../org/context'
import { navigate } from '../router'
import { RoleBadge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { DataTable } from '../ui/DataTable'
import { relativeTime } from '../ui/format'
import {
  ArrowRight,
  CircleCheck,
  GitCommitHorizontal,
  ICON_STROKE,
  KeyRound,
  Mail,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  Users,
} from '../ui/icons'
import { Page, Section } from '../ui/Page'
import { Producer } from '../ui/Producer'
import { Skeleton } from '../ui/Skeleton'

type Data = {
  changes: Change[] | null
  members: Member[] | null
  invitations: Invitation[] | null
  keys: number | null
  security: Security | null
}

const EMPTY: Data = { changes: null, members: null, invitations: null, keys: null, security: null }

function Metric({
  label,
  value,
  foot,
  icon: Icon,
  onClick,
}: {
  label: string
  value: string | number | null
  foot: string
  icon: typeof Users
  onClick: () => void
}) {
  return (
    <button className="metric" onClick={onClick}>
      <span className="metric__label">
        <Icon size={14} strokeWidth={ICON_STROKE} />
        {label}
      </span>
      <span className="metric__value">
        {value === null ? <Skeleton width={48} height={24} /> : value}
      </span>
      <span className="metric__foot">{foot}</span>
    </button>
  )
}

export function Home() {
  const { current } = useOrgs()
  const { can } = usePermissions()
  const [data, setData] = useState<Data>(EMPTY)
  const [changesError, setChangesError] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)
  const orgId = current?.id

  const loadChanges = useCallback(() => {
    if (!orgId || !can('changes.read')) return
    api<Change[]>(`/v1/orgs/${orgId}/changes`).then(
      (changes) => {
        setChangesError(null)
        setData((d) => ({ ...d, changes }))
      },
      (err: Error) => setChangesError(err.message),
    )
  }, [orgId, can])

  useEffect(() => {
    api<Security>('/v1/me/security').then(
      (security) => setData((d) => ({ ...d, security })),
      () => undefined,
    )
  }, [])

  useEffect(() => {
    if (!orgId) return
    loadChanges()
    if (can('members.read'))
      api<Member[]>(`/v1/orgs/${orgId}/members`).then(
        (members) => setData((d) => ({ ...d, members })),
        () => undefined,
      )
    if (can('members.invite'))
      api<Invitation[]>(`/v1/orgs/${orgId}/invitations`).then(
        (invitations) => setData((d) => ({ ...d, invitations })),
        () => undefined,
      )
    if (can('api_keys.read'))
      api<ServiceAccount[]>(`/v1/orgs/${orgId}/service-accounts`).then(
        (a) => setData((d) => ({ ...d, keys: a.reduce((n, x) => n + x.keys.length, 0) })),
        () => undefined,
      )
  }, [orgId, can, loadChanges])

  if (!current) return null
  const agentChanges = data.changes?.filter((c) => c.producer.kind === 'ai_agent').length
  const mfa = data.security?.mfa_enrolled

  const attention: {
    tone: 'warning' | 'neutral'
    icon: typeof Users
    title: string
    text: string
    action: string
    to: string
  }[] = []
  if (mfa === false)
    attention.push({
      tone: 'warning',
      icon: ShieldAlert,
      title: 'Turn on two-factor authentication',
      text: 'Your account signs in with a password only.',
      action: 'Set up',
      to: '/security',
    })
  if (can('org.security') && !current.require_mfa)
    attention.push({
      tone: 'neutral',
      icon: ShieldCheck,
      title: 'Require two-factor for everyone',
      text: `Members of ${current.name} can sign in without a second factor.`,
      action: 'Review',
      to: '/security',
    })
  if (can('api_keys.manage') && data.keys === 0)
    attention.push({
      tone: 'neutral',
      icon: KeyRound,
      title: 'Connect your first agent',
      text: 'Give an AI agent or CI system an API key so its changes are verified.',
      action: 'Create key',
      to: '/api-keys',
    })
  if (data.invitations && data.invitations.length > 0)
    attention.push({
      tone: 'neutral',
      icon: Mail,
      title: `${data.invitations.length} pending invitation${data.invitations.length === 1 ? '' : 's'}`,
      text: 'Waiting for people to accept.',
      action: 'View',
      to: '/members',
    })

  return (
    <Page
      title="Overview"
      description={`What is happening in ${current.name}.`}
      actions={
        <>
          {can('members.invite') && (
            <Button icon={UserPlus} onClick={() => navigate('/members?invite=1')}>
              Invite
            </Button>
          )}
          {can('api_keys.manage') && (
            <Button variant="primary" icon={KeyRound} onClick={() => navigate('/api-keys')}>
              Connect an agent
            </Button>
          )}
        </>
      }
    >
      <div className="metrics">
        {can('changes.read') && (
          <Metric
            label="Changes"
            icon={GitCommitHorizontal}
            value={data.changes?.length ?? null}
            foot={agentChanges === undefined ? 'Loading…' : `${agentChanges} from AI agents`}
            onClick={() => navigate('/changes')}
          />
        )}
        {can('members.read') && (
          <Metric
            label="Members"
            icon={Users}
            value={data.members?.length ?? null}
            foot={
              data.invitations?.length
                ? `${data.invitations.length} invited`
                : 'In this organization'
            }
            onClick={() => navigate('/members')}
          />
        )}
        {can('api_keys.read') && (
          <Metric
            label="Active API keys"
            icon={KeyRound}
            value={data.keys}
            foot="Agents, CI and bots"
            onClick={() => navigate('/api-keys')}
          />
        )}
        <Metric
          label="Two-factor"
          icon={mfa ? ShieldCheck : ShieldAlert}
          value={mfa === undefined ? null : mfa ? 'On' : 'Off'}
          foot={current.require_mfa ? 'Required by organization' : 'Optional in this organization'}
          onClick={() => navigate('/security')}
        />
      </div>

      <div className="overview-grid">
        <Section
          title="Recent changes"
          description="The latest captured changes and who produced them."
          actions={
            can('changes.read') && (
              <Button
                variant="ghost"
                size="sm"
                trailingIcon={ArrowRight}
                onClick={() => navigate('/changes')}
              >
                View all
              </Button>
            )
          }
        >
          {can('changes.read') ? (
            <DataTable
              label="recent changes"
              rows={data.changes?.slice(0, 6) ?? null}
              rowKey={(c) => c.id}
              error={changesError}
              onRetry={loadChanges}
              onRowClick={() => navigate('/changes')}
              empty={{
                icon: GitCommitHorizontal,
                title: 'No changes yet',
                text: 'Changes appear here as soon as an agent, CI system or teammate submits one.',
                action: can('api_keys.manage') && (
                  <Button variant="primary" icon={KeyRound} onClick={() => navigate('/api-keys')}>
                    Connect an agent
                  </Button>
                ),
              }}
              columns={[
                {
                  key: 'change',
                  header: 'Change',
                  main: true,
                  render: (c) => (
                    <span className="cell-stack">
                      <strong className="truncate">{c.title || c.commit_sha.slice(0, 8)}</strong>
                      <span className="mono truncate">{c.repository}</span>
                    </span>
                  ),
                },
                {
                  key: 'producer',
                  header: 'Producer',
                  render: (c) => <Producer kind={c.producer.kind} identity={c.producer.identity} />,
                },
                {
                  key: 'when',
                  header: 'Captured',
                  align: 'right',
                  shrink: true,
                  render: (c) => (
                    <span className="t-sm t-muted">{relativeTime(c.captured_at)}</span>
                  ),
                },
              ]}
            />
          ) : (
            <p className="t-sm t-muted">Your role can't see changes in this organization.</p>
          )}
        </Section>

        <aside>
          <div className="aside-block">
            <h2>Needs attention</h2>
            {attention.length === 0 ? (
              <ul className="attention">
                <li>
                  <span className="attention__icon attention__icon--success">
                    <CircleCheck size={15} strokeWidth={ICON_STROKE} />
                  </span>
                  <span className="attention__text">
                    <strong>All set</strong>
                    <span>Nothing needs your attention right now.</span>
                  </span>
                </li>
              </ul>
            ) : (
              <ul className="attention">
                {attention.map((a) => {
                  const Icon = a.icon
                  return (
                    <li key={a.title}>
                      <span
                        className={`attention__icon ${a.tone === 'warning' ? 'attention__icon--warning' : ''}`}
                      >
                        <Icon size={15} strokeWidth={ICON_STROKE} />
                      </span>
                      <span className="attention__text">
                        <strong>{a.title}</strong>
                        <span>{a.text}</span>
                      </span>
                      <Button size="sm" onClick={() => navigate(a.to)}>
                        {a.action}
                      </Button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
          <div className="aside-block">
            <h2>Your access</h2>
            <div className="row">
              <RoleBadge role={current.role} />
              <span className="t-sm t-muted">{current.permissions.length} permissions</span>
            </div>
            <div className="permission-cloud">
              {(showAll ? current.permissions : current.permissions.slice(0, 6)).map((p) => (
                <code key={p} className="code-inline">
                  {p}
                </code>
              ))}
            </div>
            {current.permissions.length > 6 && (
              <div>
                <Button variant="ghost" size="sm" onClick={() => setShowAll((v) => !v)}>
                  {showAll ? 'Show fewer' : `Show all ${current.permissions.length}`}
                </Button>
              </div>
            )}
          </div>
        </aside>
      </div>
    </Page>
  )
}
