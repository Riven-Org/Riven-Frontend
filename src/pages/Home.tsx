import { motion } from 'motion/react'
import { useEffect, useState } from 'react'

import { api } from '../api/client'
import type { Change, Me, Member, Security, ServiceAccount } from '../api/types'
import { useOrgs, usePermissions } from '../org/context'
import { navigate } from '../router'
import {
  Activity,
  ArrowRight,
  Fingerprint,
  GitCommitHorizontal,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users,
} from '../ui/icons'
import { AnimatedNumber, Stagger } from '../ui/motion'
import { fadeUp } from '../ui/variants'
import { Producer } from '../ui/Producer'

type Stats = {
  members: number | null
  changes: Change[] | null
  keys: number | null
  security: Security | null
}

function greeting(): string {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

function ago(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)}h ago`
  return `${Math.round(minutes / 1440)}d ago`
}

export function Home() {
  const { current } = useOrgs()
  const { can } = usePermissions()
  const [me, setMe] = useState<Me | null>(null)
  const [stats, setStats] = useState<Stats>({
    members: null,
    changes: null,
    keys: null,
    security: null,
  })
  const orgId = current?.id

  useEffect(() => {
    api<Me>('/v1/me').then(setMe, () => undefined)
    api<Security>('/v1/me/security').then(
      (security) => setStats((s) => ({ ...s, security })),
      () => undefined,
    )
  }, [])

  useEffect(() => {
    if (!orgId) return
    if (can('members.read'))
      api<Member[]>(`/v1/orgs/${orgId}/members`).then(
        (m) => setStats((s) => ({ ...s, members: m.length })),
        () => undefined,
      )
    if (can('changes.read'))
      api<Change[]>(`/v1/orgs/${orgId}/changes`).then(
        (changes) => setStats((s) => ({ ...s, changes })),
        () => undefined,
      )
    if (can('api_keys.read'))
      api<ServiceAccount[]>(`/v1/orgs/${orgId}/service-accounts`).then(
        (a) => setStats((s) => ({ ...s, keys: a.reduce((n, x) => n + x.keys.length, 0) })),
        () => undefined,
      )
  }, [orgId, can])

  const first = me?.name.split(' ')[0] || me?.email || ''
  const agentChanges = stats.changes?.filter((c) => c.producer.kind === 'ai_agent').length ?? null
  const mfa = stats.security?.mfa_enrolled

  const tiles = [
    {
      label: 'Members',
      icon: Users,
      value: stats.members,
      foot: 'People in this organization',
      to: '/members',
      show: can('members.read'),
    },
    {
      label: 'Changes captured',
      icon: GitCommitHorizontal,
      value: stats.changes?.length ?? null,
      foot: agentChanges === null ? '…' : `${agentChanges} by AI agents`,
      to: '/changes',
      show: can('changes.read'),
    },
    {
      label: 'Active API keys',
      icon: KeyRound,
      value: stats.keys,
      foot: 'For agents, CI and bots',
      to: '/api-keys',
      show: can('api_keys.read'),
    },
  ].filter((t) => t.show)

  return (
    <Stagger className="page">
      <motion.section className="hero" variants={fadeUp}>
        <span className="pill" style={{ background: 'rgba(255,255,255,.16)', color: '#fff' }}>
          <Sparkles size={13} /> {current?.name} · {current?.role}
        </span>
        <h1 style={{ marginTop: 14 }}>
          {greeting()}
          {first ? `, ${first}` : ''} 👋
        </h1>
        <p>
          Riven independently verifies every change, remembers every confirmed bug and never lets a
          producer approve its own work.
        </p>
        <div className="actions">
          {can('changes.read') && (
            <button className="btn btn-light" onClick={() => navigate('/changes')}>
              Review changes <ArrowRight size={16} />
            </button>
          )}
          {can('api_keys.manage') && (
            <button className="btn" onClick={() => navigate('/api-keys')}>
              <KeyRound size={16} /> Connect an agent
            </button>
          )}
        </div>
      </motion.section>

      <div className="stats">
        {tiles.map((t) => {
          const Icon = t.icon
          return (
            <motion.button
              key={t.label}
              className="card card-glow stat"
              variants={fadeUp}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(t.to)}
            >
              <span className="stat-top">
                {t.label}
                <span className="stat-icon">
                  <Icon size={17} />
                </span>
              </span>
              <span className="stat-value">
                <AnimatedNumber value={t.value} />
              </span>
              <span className="stat-foot">{t.foot}</span>
            </motion.button>
          )
        })}
        <motion.button
          className="card card-glow stat"
          variants={fadeUp}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/security')}
        >
          <span className="stat-top">
            Two-factor
            <span className="stat-icon">
              {mfa ? <ShieldCheck size={17} /> : <ShieldAlert size={17} />}
            </span>
          </span>
          <span className="stat-value" style={{ fontSize: 24 }}>
            {mfa === undefined ? <span className="num-skeleton" /> : mfa ? 'Enabled' : 'Not set up'}
          </span>
          <span className="stat-foot">
            {current?.require_mfa ? 'Required by your organization' : 'Recommended for everyone'}
          </span>
        </motion.button>
      </div>

      <div className="two-col">
        <motion.article className="card" variants={fadeUp}>
          <h2 className="card-title">
            <Activity size={15} /> Recent activity
          </h2>
          {!can('changes.read') ? (
            <p className="muted">You can't see changes in this organization.</p>
          ) : stats.changes === null ? (
            <div className="skeleton-lines">
              <span />
              <span />
              <span />
            </div>
          ) : stats.changes.length === 0 ? (
            <div className="empty">
              <span className="empty-icon">
                <GitCommitHorizontal size={24} />
              </span>
              <strong>No changes yet</strong>
              <span className="muted small">Agents and CI submit changes with an API key.</span>
            </div>
          ) : (
            <ul className="activity">
              {stats.changes.slice(0, 6).map((c, i) => (
                <motion.li
                  key={c.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.07 }}
                >
                  <span className="row-main">
                    <strong>{c.title || c.commit_sha}</strong>
                    <span className="muted small">
                      <code>{c.repository}</code> · {ago(c.captured_at)}
                    </span>
                  </span>
                  <Producer kind={c.producer.kind} identity={c.producer.identity} />
                </motion.li>
              ))}
            </ul>
          )}
        </motion.article>

        <motion.article className="card" variants={fadeUp}>
          <h2 className="card-title">
            <Fingerprint size={15} /> Your identity
          </h2>
          {me ? (
            <dl className="facts">
              <dt>Name</dt>
              <dd>{me.name || '—'}</dd>
              <dt>Email</dt>
              <dd>{me.email}</dd>
              <dt>Role</dt>
              <dd>
                <span className={`role role-${current?.role}`}>{current?.role}</span>
              </dd>
              <dt>Access</dt>
              <dd>{current?.permissions.length} permissions</dd>
            </dl>
          ) : (
            <div className="skeleton-lines">
              <span />
              <span />
              <span />
            </div>
          )}
          {current && (
            <ul className="perm-list">
              {current.permissions.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}
        </motion.article>
      </div>
    </Stagger>
  )
}
