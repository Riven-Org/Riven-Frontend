import { useCallback, useEffect, useState, type FormEvent } from 'react'

import { api, ApiError } from '../api/client'
import { ROLES, type Invitation, type Member, type Role } from '../api/types'
import { useAuth } from '../auth/context'
import { useOrgs, usePermissions } from '../org/context'
import { useToast } from '../ui/toast'

function errorText(err: unknown): string {
  if (!(err instanceof ApiError)) return 'Something went wrong'
  return (
    {
      last_owner: 'An organization must keep at least one owner.',
      only_owners_manage_owners: 'Only owners can change or remove owners.',
      only_owners_invite_owners: 'Only owners can invite owners.',
      already_a_member: 'That person is already a member.',
    }[err.code] ?? err.code
  )
}

export function Members() {
  const { current, reload } = useOrgs()
  const { can } = usePermissions()
  const { user } = useAuth()
  const notify = useToast()
  const [members, setMembers] = useState<Member[] | null>(null)
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('viewer')
  const orgId = current?.id
  const canInvite = can('members.invite')
  const canChangeRoles = can('members.update_role')
  const canRemove = can('members.remove')

  const load = useCallback(() => {
    if (!orgId) return Promise.resolve()
    return Promise.all([
      api<Member[]>(`/v1/orgs/${orgId}/members`),
      canInvite ? api<Invitation[]>(`/v1/orgs/${orgId}/invitations`) : Promise.resolve([]),
    ]).then(([memberList, invitationList]) => {
      setMembers(memberList)
      setInvitations(invitationList)
    })
  }, [orgId, canInvite])

  useEffect(() => {
    load().catch((err) => notify(errorText(err), 'bad'))
  }, [load, notify])

  async function run(action: () => Promise<unknown>, success: string) {
    try {
      await action()
      notify(success)
      await Promise.all([load(), reload()])
    } catch (err) {
      notify(errorText(err), 'bad')
    }
  }

  async function invite(event: FormEvent) {
    event.preventDefault()
    await run(
      () =>
        api(`/v1/orgs/${orgId}/invitations`, {
          method: 'POST',
          body: JSON.stringify({ email, role }),
        }),
      `Invitation sent to ${email}`,
    )
    setEmail('')
  }

  if (!current) return null
  const assignable = current.role === 'owner' ? ROLES : ROLES.filter((r) => r !== 'owner')

  return (
    <section className="page">
      <header className="page-head rise">
        <h1>Members</h1>
        <p className="muted">
          People in {current.name} and what they can do.{' '}
          You are <span className={`role role-${current.role}`}>{current.role}</span>
        </p>
      </header>

      {canInvite && (
        <form className="card invite rise" onSubmit={invite} style={{ animationDelay: '60ms' }}>
          <h2 className="card-title">Invite someone</h2>
          <div className="invite-row">
            <label className="field grow">
              <span>Email</span>
              <input
                type="email"
                required
                value={email}
                placeholder="teammate@company.com"
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="field">
              <span>Role</span>
              <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
                {assignable.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            <button className="btn btn-primary" disabled={!email}>
              Send invite
            </button>
          </div>
        </form>
      )}

      <div className="card rise" style={{ animationDelay: '120ms' }}>
        <h2 className="card-title">Members {members && <span className="count">{members.length}</span>}</h2>
        {!members ? (
          <div className="skeleton-lines" aria-busy="true">
            <span />
            <span />
            <span />
          </div>
        ) : (
          <ul className="rows">
            {members.map((m) => {
              const isMe = m.email === user?.profile.email
              return (
                <li key={m.user_id} className="row">
                  <span className="avatar avatar-sm" aria-hidden="true">
                    {(m.name || m.email).slice(0, 1).toUpperCase()}
                  </span>
                  <span className="row-main">
                    <strong>
                      {m.name || m.email} {isMe && <span className="muted">(you)</span>}
                    </strong>
                    <span className="muted">{m.email}</span>
                  </span>
                  {canChangeRoles ? (
                    <select
                      aria-label={`Role of ${m.email}`}
                      value={m.role}
                      onChange={(e) =>
                        run(
                          () =>
                            api(`/v1/orgs/${orgId}/members/${m.user_id}`, {
                              method: 'PATCH',
                              body: JSON.stringify({ role: e.target.value }),
                            }),
                          `${m.email} is now ${e.target.value}`,
                        )
                      }
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r} disabled={r === 'owner' && current.role !== 'owner'}>
                          {r}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className={`role role-${m.role}`}>{m.role}</span>
                  )}
                  {canRemove && !isMe && (
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() =>
                        run(
                          () => api(`/v1/orgs/${orgId}/members/${m.user_id}`, { method: 'DELETE' }),
                          `${m.email} was removed`,
                        )
                      }
                    >
                      Remove
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {canInvite && invitations.length > 0 && (
        <div className="card rise" style={{ animationDelay: '180ms' }}>
          <h2 className="card-title">Pending invitations</h2>
          <ul className="rows">
            {invitations.map((i) => (
              <li key={i.id} className="row">
                <span className="row-main">
                  <strong>{i.email}</strong>
                  <span className="muted">
                    Expires {new Date(i.expires_at).toLocaleDateString()}
                  </span>
                </span>
                <span className={`role role-${i.role}`}>{i.role}</span>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() =>
                    run(
                      () => api(`/v1/orgs/${orgId}/invitations/${i.id}`, { method: 'DELETE' }),
                      `Invitation to ${i.email} revoked`,
                    )
                  }
                >
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
