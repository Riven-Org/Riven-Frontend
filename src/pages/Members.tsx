import { useCallback, useEffect, useState, type FormEvent } from 'react'

import { api, ApiError } from '../api/client'
import { ROLES, type Invitation, type Member, type Role } from '../api/types'
import { useAuth } from '../auth/context'
import { useOrgs, usePermissions } from '../org/context'
import { Avatar } from '../ui/Avatar'
import { Badge, RoleBadge, roleLabel } from '../ui/Badge'
import { Button } from '../ui/Button'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { DataTable } from '../ui/DataTable'
import { Field, Input, Select } from '../ui/Field'
import { relativeTime, shortDate } from '../ui/format'
import { Ellipsis, Mail, Trash2, UserPlus, Users } from '../ui/icons'
import { Menu } from '../ui/Menu'
import { Modal } from '../ui/Modal'
import { Page } from '../ui/Page'
import { Tabs } from '../ui/Tabs'
import { useToast } from '../ui/toast'

const ROLE_HELP: Record<Role, string> = {
  owner: 'Everything, including deleting the organization.',
  admin: 'Manage members, API keys and security policy.',
  maintainer: 'Submit changes, manage repositories, create regression locks.',
  reviewer: 'Confirm bugs and approve reviews.',
  viewer: 'Read-only access.',
}

function errorText(err: unknown): string {
  if (!(err instanceof ApiError)) return 'Something went wrong. Try again.'
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
  const [invitations, setInvitations] = useState<Invitation[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<'members' | 'invitations'>('members')
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all')
  const [inviting, setInviting] = useState(() =>
    new URLSearchParams(window.location.search).has('invite'),
  )
  const [removing, setRemoving] = useState<Member | null>(null)
  const orgId = current?.id
  const canInvite = can('members.invite')
  const canChangeRoles = can('members.update_role')
  const canRemove = can('members.remove')

  const load = useCallback(() => {
    if (!orgId) return Promise.resolve()
    return Promise.all([
      api<Member[]>(`/v1/orgs/${orgId}/members`),
      canInvite ? api<Invitation[]>(`/v1/orgs/${orgId}/invitations`) : Promise.resolve([]),
    ]).then(
      ([memberList, invitationList]) => {
        setError(null)
        setMembers(memberList)
        setInvitations(invitationList)
      },
      (err: unknown) => setError(errorText(err)),
    )
  }, [orgId, canInvite])

  useEffect(() => {
    void load()
  }, [load])

  async function run(action: () => Promise<unknown>, success: string) {
    try {
      await action()
      notify(success)
      await Promise.all([load(), reload()])
    } catch (err) {
      notify(errorText(err), 'bad')
    }
  }

  if (!current) return null
  const rows =
    members && (roleFilter === 'all' ? members : members.filter((m) => m.role === roleFilter))

  return (
    <Page
      title="Members"
      description={`People in ${current.name} and what their role lets them do.`}
      actions={
        canInvite && (
          <Button variant="primary" icon={UserPlus} onClick={() => setInviting(true)}>
            Invite member
          </Button>
        )
      }
    >
      <div className="stack" style={{ gap: 20 }}>
        {canInvite && (
          <Tabs
            label="Members and invitations"
            value={tab}
            onChange={setTab}
            items={[
              { key: 'members', label: 'Members', count: members?.length ?? null },
              {
                key: 'invitations',
                label: 'Pending invitations',
                count: invitations?.length ?? null,
              },
            ]}
          />
        )}

        {tab === 'members' ? (
          <DataTable
            label="members"
            rows={rows}
            rowKey={(m) => m.user_id}
            error={error}
            onRetry={load}
            searchText={(m) => `${m.name} ${m.email}`}
            searchPlaceholder="Search by name or email"
            filters={
              <Select
                size="sm"
                aria-label="Filter by role"
                value={roleFilter}
                style={{ width: 150 }}
                onChange={(e) => setRoleFilter(e.target.value as Role | 'all')}
              >
                <option value="all">All roles</option>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {roleLabel(r)}
                  </option>
                ))}
              </Select>
            }
            empty={{
              icon: Users,
              title: 'No members',
              text: 'Invite people to collaborate in this organization.',
            }}
            columns={[
              {
                key: 'member',
                header: 'Member',
                main: true,
                sortValue: (m) => (m.name || m.email).toLowerCase(),
                render: (m) => {
                  const isMe = m.email === user?.profile.email
                  return (
                    <span className="cell-primary">
                      <Avatar name={m.name || m.email} />
                      <span className="cell-stack">
                        <strong className="row" style={{ gap: 6 }}>
                          <span className="truncate">{m.name || m.email}</span>
                          {isMe && <Badge outline>You</Badge>}
                        </strong>
                        <span className="truncate">{m.email}</span>
                      </span>
                    </span>
                  )
                },
              },
              {
                key: 'role',
                header: 'Role',
                sortValue: (m) => ROLES.indexOf(m.role),
                render: (m) =>
                  canChangeRoles ? (
                    <Select
                      size="sm"
                      aria-label={`Role of ${m.email}`}
                      value={m.role}
                      style={{ width: 140 }}
                      onChange={(e) =>
                        run(
                          () =>
                            api(`/v1/orgs/${orgId}/members/${m.user_id}`, {
                              method: 'PATCH',
                              body: JSON.stringify({ role: e.target.value }),
                            }),
                          `${m.name || m.email} is now ${roleLabel(e.target.value as Role).toLowerCase()}`,
                        )
                      }
                    >
                      {ROLES.map((r) => (
                        <option
                          key={r}
                          value={r}
                          disabled={r === 'owner' && current.role !== 'owner'}
                        >
                          {roleLabel(r)}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <RoleBadge role={m.role} />
                  ),
              },
              {
                key: 'joined',
                header: 'Joined',
                sortValue: (m) => m.joined_at,
                render: (m) => (
                  <span className="t-sm t-muted" title={shortDate(m.joined_at)}>
                    {relativeTime(m.joined_at)}
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
                render: (m) =>
                  canRemove && m.email !== user?.profile.email ? (
                    <Menu
                      trigger={(props) => (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Ellipsis}
                          aria-label={`Actions for ${m.email}`}
                          {...props}
                        />
                      )}
                      items={[
                        {
                          label: 'Remove from organization',
                          icon: Trash2,
                          danger: true,
                          onSelect: () => setRemoving(m),
                        },
                      ]}
                    />
                  ) : null,
              },
            ]}
          />
        ) : (
          <DataTable
            label="invitations"
            rows={invitations}
            rowKey={(i) => i.id}
            error={error}
            onRetry={load}
            empty={{
              icon: Mail,
              title: 'No pending invitations',
              text: 'Invitations you send appear here until they are accepted.',
              action: (
                <Button icon={UserPlus} onClick={() => setInviting(true)}>
                  Invite member
                </Button>
              ),
            }}
            columns={[
              {
                key: 'email',
                header: 'Email',
                main: true,
                render: (i) => (
                  <span className="cell-primary">
                    <Avatar name={i.email} />
                    <strong className="truncate" style={{ fontWeight: 500 }}>
                      {i.email}
                    </strong>
                  </span>
                ),
              },
              { key: 'role', header: 'Role', render: (i) => <RoleBadge role={i.role} /> },
              {
                key: 'expires',
                header: 'Expires',
                render: (i) => <span className="t-sm t-muted">{relativeTime(i.expires_at)}</span>,
              },
              {
                key: 'actions',
                actions: true,
                header: '',
                align: 'right',
                shrink: true,
                hideLabelOnMobile: true,
                render: (i) => (
                  <Button
                    variant="danger-ghost"
                    size="sm"
                    onClick={() =>
                      run(
                        () => api(`/v1/orgs/${orgId}/invitations/${i.id}`, { method: 'DELETE' }),
                        `Invitation to ${i.email} revoked`,
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
      </div>

      {inviting && (
        <InviteDialog
          ownerCanInviteOwners={current.role === 'owner'}
          orgName={current.name}
          onClose={() => {
            setInviting(false)
            if (window.location.search) window.history.replaceState(null, '', '/members')
          }}
          onInvite={async (email, role) => {
            await api(`/v1/orgs/${orgId}/invitations`, {
              method: 'POST',
              body: JSON.stringify({ email, role }),
            })
            notify(`Invitation sent to ${email}`)
            setTab('invitations')
            await load()
          }}
        />
      )}

      {removing && (
        <ConfirmDialog
          title={`Remove ${removing.name || removing.email}?`}
          confirmLabel="Remove member"
          onClose={() => setRemoving(null)}
          onConfirm={() =>
            run(
              () => api(`/v1/orgs/${orgId}/members/${removing.user_id}`, { method: 'DELETE' }),
              `${removing.email} was removed`,
            )
          }
        >
          They lose access to {current.name} immediately. You can invite them again later.
        </ConfirmDialog>
      )}
    </Page>
  )
}

function InviteDialog({
  orgName,
  ownerCanInviteOwners,
  onClose,
  onInvite,
}: {
  orgName: string
  ownerCanInviteOwners: boolean
  onClose: () => void
  onInvite: (email: string, role: Role) => Promise<void>
}) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('viewer')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const assignable = ownerCanInviteOwners ? ROLES : ROLES.filter((r) => r !== 'owner')

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await onInvite(email.trim(), role)
      onClose()
    } catch (err) {
      setError(errorText(err))
      setBusy(false)
    }
  }

  return (
    <Modal
      title="Invite a member"
      description={`They'll get an email with a link to join ${orgName}. It expires in 7 days.`}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="invite-form" loading={busy}>
            Send invitation
          </Button>
        </>
      }
    >
      <form id="invite-form" className="stack" style={{ gap: 16 }} onSubmit={submit} noValidate>
        <Field label="Email address" error={error}>
          {(props) => (
            <Input
              {...props}
              type="email"
              autoFocus
              value={email}
              placeholder="name@company.com"
              onChange={(e) => {
                setEmail(e.target.value)
                setError(null)
              }}
            />
          )}
        </Field>
        <Field label="Role" help={ROLE_HELP[role]}>
          {(props) => (
            <Select {...props} value={role} onChange={(e) => setRole(e.target.value as Role)}>
              {assignable.map((r) => (
                <option key={r} value={r}>
                  {roleLabel(r)}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </form>
    </Modal>
  )
}
