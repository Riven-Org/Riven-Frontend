import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState, type ComponentType } from 'react'

import { useAuth } from '../auth/context'
import { NAV } from '../nav'
import { useOrgs, usePermissions } from '../org/context'
import { navigate } from '../router'
import {
  Building2,
  CornerDownLeft,
  ICON_STROKE,
  LogOut,
  Monitor,
  Moon,
  Plus,
  Search,
  Sun,
} from './icons'
import { useTheme } from './theme'

type Command = {
  id: string
  group: string
  label: string
  hint?: string
  icon: ComponentType<{ size?: number; strokeWidth?: number }>
  run: () => void
}

/** ⌘K / Ctrl+K: jump to any page, switch organization, change theme or sign out. */
export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>{open && <PaletteBody key="palette" onClose={onClose} />}</AnimatePresence>
  )
}

function PaletteBody({ onClose }: { onClose: () => void }) {
  const { can } = usePermissions()
  const { orgs, current, select } = useOrgs()
  const { setMode } = useTheme()
  const { signOut } = useAuth()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)

  const commands = useMemo<Command[]>(
    () => [
      ...NAV.filter((n) => !n.needs || can(n.needs)).map((n) => ({
        id: `go:${n.to}`,
        group: 'Pages',
        label: n.label,
        hint: n.hint,
        icon: n.icon,
        run: () => navigate(n.to),
      })),
      ...orgs
        .filter((o) => o.id !== current?.id)
        .map((o) => ({
          id: `org:${o.id}`,
          group: 'Organizations',
          label: `Switch to ${o.name}`,
          icon: Building2,
          run: () => select(o.id),
        })),
      {
        id: 'org:new',
        group: 'Organizations',
        label: 'Create organization',
        icon: Plus,
        run: () => navigate('/orgs/new'),
      },
      {
        id: 'theme:light',
        group: 'Preferences',
        label: 'Use light theme',
        icon: Sun,
        run: () => setMode('light'),
      },
      {
        id: 'theme:dark',
        group: 'Preferences',
        label: 'Use dark theme',
        icon: Moon,
        run: () => setMode('dark'),
      },
      {
        id: 'theme:system',
        group: 'Preferences',
        label: 'Match system theme',
        icon: Monitor,
        run: () => setMode('system'),
      },
      {
        id: 'signout',
        group: 'Account',
        label: 'Sign out',
        icon: LogOut,
        run: () => void signOut(),
      },
    ],
    [can, orgs, current?.id, select, setMode, signOut],
  )

  const shown = commands.filter((c) =>
    `${c.group} ${c.label} ${c.hint ?? ''}`.toLowerCase().includes(query.trim().toLowerCase()),
  )

  function run(command: Command | undefined) {
    if (!command) return
    onClose()
    command.run()
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, shown.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      run(shown[active])
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  let lastGroup = ''
  return (
    <motion.div
      className="palette-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12 }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className="palette"
        role="dialog"
        aria-modal="true"
        aria-label="Command menu"
        initial={{ opacity: 0, scale: 0.98, y: -6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.16, ease: [0.2, 0.8, 0.2, 1] }}
        onKeyDown={onKey}
      >
        <div className="palette__input">
          <Search size={16} strokeWidth={ICON_STROKE} />
          <input
            autoFocus
            value={query}
            placeholder="Type a command or search…"
            aria-label="Search commands"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            onChange={(e) => {
              setQuery(e.target.value)
              setActive(0)
            }}
          />
          <span className="kbd">Esc</span>
        </div>
        <ul className="palette__list" id="palette-list" role="listbox">
          {shown.length === 0 && (
            <li className="empty" style={{ padding: '28px 16px' }}>
              <span className="empty__text">No commands match “{query}”.</span>
            </li>
          )}
          {shown.map((c, i) => {
            const header = c.group !== lastGroup
            lastGroup = c.group
            const Icon = c.icon
            return (
              <li key={c.id}>
                {header && <div className="palette__group">{c.group}</div>}
                <button
                  className="palette__item"
                  role="option"
                  aria-selected={i === active}
                  onMouseMove={() => setActive(i)}
                  onClick={() => run(c)}
                >
                  <Icon size={15} strokeWidth={ICON_STROKE} />
                  {c.label}
                  {c.hint && <span className="palette__hint">{c.hint}</span>}
                </button>
              </li>
            )
          })}
        </ul>
        <div className="palette__footer">
          <span className="row" style={{ gap: 4 }}>
            <span className="kbd">↑</span>
            <span className="kbd">↓</span> to move
          </span>
          <span className="row" style={{ gap: 4 }}>
            <span className="kbd">
              <CornerDownLeft size={11} />
            </span>
            to select
          </span>
        </div>
      </motion.div>
    </motion.div>
  )
}
