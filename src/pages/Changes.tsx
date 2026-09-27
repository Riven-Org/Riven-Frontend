import { useCallback, useEffect, useState } from 'react'

import { api } from '../api/client'
import type { Change, ProducerKind } from '../api/types'
import { useOrgs, usePermissions } from '../org/context'
import { navigate } from '../router'
import { Button } from '../ui/Button'
import { DataTable } from '../ui/DataTable'
import { Select } from '../ui/Field'
import { dateTime, relativeTime } from '../ui/format'
import { FileCode, GitBranch, GitCommitHorizontal, ICON_STROKE, KeyRound } from '../ui/icons'
import { Modal } from '../ui/Modal'
import { Page } from '../ui/Page'
import { Producer, ProducerKindBadge } from '../ui/Producer'

export function Changes() {
  const { current } = useOrgs()
  const { can } = usePermissions()
  const [changes, setChanges] = useState<Change[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [kind, setKind] = useState<ProducerKind | 'all'>('all')
  const [open, setOpen] = useState<Change | null>(null)
  const orgId = current?.id

  const load = useCallback(() => {
    if (!orgId) return
    api<Change[]>(`/v1/orgs/${orgId}/changes`).then(
      (list) => {
        setError(null)
        setChanges(list)
      },
      (err: Error) => setError(err.message),
    )
  }, [orgId])

  useEffect(() => {
    load()
  }, [load])

  const rows =
    changes && (kind === 'all' ? changes : changes.filter((c) => c.producer.kind === kind))

  return (
    <Page
      title="Changes"
      description="Every captured change, with the authenticated identity that produced it. Riven never lets a producer verify its own work."
    >
      <DataTable
        label="changes"
        rows={rows}
        rowKey={(c) => c.id}
        error={error}
        onRetry={load}
        onRowClick={setOpen}
        searchText={(c) =>
          `${c.title} ${c.commit_sha} ${c.repository} ${c.branch ?? ''} ${c.producer.identity}`
        }
        searchPlaceholder="Search title, commit, repository…"
        filters={
          <Select
            size="sm"
            aria-label="Filter by producer"
            value={kind}
            onChange={(e) => setKind(e.target.value as ProducerKind | 'all')}
            style={{ width: 160 }}
          >
            <option value="all">All producers</option>
            <option value="human">Humans</option>
            <option value="ai_agent">AI agents</option>
            <option value="bot">Bots</option>
          </Select>
        }
        empty={{
          icon: GitCommitHorizontal,
          title: 'No changes captured yet',
          text: 'AI agents and CI submit changes with an API key. Each one is recorded with the identity that produced it.',
          action: can('api_keys.manage') && (
            <Button variant="primary" icon={KeyRound} onClick={() => navigate('/api-keys')}>
              Create an API key
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
                <strong className="truncate">{c.title || 'Untitled change'}</strong>
                <span className="mono">
                  {c.commit_sha.slice(0, 8)}
                  {c.branch ? ` · ${c.branch}` : ''}
                </span>
              </span>
            ),
          },
          {
            key: 'repository',
            header: 'Repository',
            sortValue: (c) => c.repository,
            render: (c) => <span className="mono t-secondary">{c.repository}</span>,
          },
          {
            key: 'producer',
            header: 'Producer',
            sortValue: (c) => c.producer.kind,
            render: (c) => (
              <Producer
                kind={c.producer.kind}
                identity={c.producer.identity}
                model={c.producer.agent_model}
              />
            ),
          },
          {
            key: 'captured',
            header: 'Captured',
            align: 'right',
            shrink: true,
            sortValue: (c) => c.captured_at,
            render: (c) => (
              <span className="t-sm t-muted" title={dateTime(c.captured_at)}>
                {relativeTime(c.captured_at)}
              </span>
            ),
          },
        ]}
      />

      {open && (
        <Modal
          wide
          title={open.title || 'Untitled change'}
          description={<span className="mono">{open.repository}</span>}
          onClose={() => setOpen(null)}
          footer={<Button onClick={() => setOpen(null)}>Close</Button>}
        >
          <dl className="kv">
            <dt>Commit</dt>
            <dd className="mono">{open.commit_sha}</dd>
            <dt>Branch</dt>
            <dd>
              {open.branch ? (
                <span className="row">
                  <GitBranch size={14} strokeWidth={ICON_STROKE} />
                  <span className="mono">{open.branch}</span>
                </span>
              ) : (
                '—'
              )}
            </dd>
            <dt>Pull request</dt>
            <dd>{open.pr_number ? `#${open.pr_number}` : '—'}</dd>
            <dt>Captured</dt>
            <dd>{dateTime(open.captured_at)}</dd>
            <dt>Produced by</dt>
            <dd className="row" style={{ flexWrap: 'wrap' }}>
              <ProducerKindBadge kind={open.producer.kind} />
              <span>{open.producer.identity}</span>
              {open.producer.agent_model && (
                <span className="code-inline mono">{open.producer.agent_model}</span>
              )}
            </dd>
          </dl>
          <div className="stack" style={{ gap: 8 }}>
            <span className="t-overline">Files changed · {open.files_changed.length}</span>
            {open.files_changed.length === 0 ? (
              <p className="t-sm t-muted">No file list was submitted with this change.</p>
            ) : (
              <ul className="file-list">
                {open.files_changed.map((f) => (
                  <li key={f}>
                    <FileCode size={14} strokeWidth={ICON_STROKE} />
                    <span className="mono">{f}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Modal>
      )}
    </Page>
  )
}
