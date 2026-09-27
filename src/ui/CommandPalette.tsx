import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState, type ComponentType } from 'react'

import { useAuth } from '../auth/context'
import { NAV } from '../nav'
import { useOrgs, usePermissions } from '../org/context'
import { navigate } from '../router'
import { ArrowRight, Building2, LogOut, Monitor, Moon, Plus, Search, Sun } from './icons'
import { useTheme } from './theme'

type Command = {
  id: string
  group: string
  label: string
  hint?: string
  icon: ComponentType<{ size?: number }>
  run: () => void
}

/** ⌘K / Ctrl+K: jump to any page, switch org, change theme or sign out from the keyboard. */
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
        group: 'Go to',
        label: n.label,
        hint: n.hint,
        icon: n.icon,
        run: () => navigate(n.to),
      })),
      ...orgs
        .filter((o) => o.id !== current?.id)
        .map((o) => ({
          id: `org:${o.id}`,
          group: 'Switch organization',
          label: o.name,
          hint: o.role ?? '',
          icon: Building2,
          run: () => select(o.id),
        })),
      {
        id: 'org:new',
        group: 'Organization',
        label: 'Create organization',
        icon: Plus,
        run: () => navigate('/orgs/new'),
      },
      {
        id: 'theme:light',
        group: 'Theme',
        label: 'Light theme',
        icon: Sun,
        run: () => setMode('light'),
      },
      {
        id: 'theme:dark',
        group: 'Theme',
        label: 'Dark theme',
        icon: Moon,
        run: () => setMode('dark'),
      },
      {
        id: 'theme:system',
        group: 'Theme',
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
      className="palette-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className="palette"
        role="dialog"
        aria-label="Command palette"
        initial={{ opacity: 0, y: -16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 460, damping: 34 }}
        onKeyDown={onKey}
      >
        <div className="palette-input">
          <Search size={18} />
          <input
            autoFocus
            value={query}
            placeholder="Search pages, organizations and actions…"
            aria-label="Search commands"
            onChange={(e) => {
              setQuery(e.target.value)
              setActive(0)
            }}
          />
          <span className="kbd">esc</span>
        </div>
        <ul className="palette-list" role="listbox">
          {shown.length === 0 && <li className="palette-group">No results</li>}
          {shown.map((c, i) => {
            const header = c.group !== lastGroup
            lastGroup = c.group
            const Icon = c.icon
            return (
              <li key={c.id}>
                {header && <div className="palette-group">{c.group}</div>}
                <button
                  className="palette-item"
                  role="option"
                  aria-selected={i === active}
                  onMouseMove={() => setActive(i)}
                  onClick={() => run(c)}
                >
                  {i === active && (
                    <motion.span
                      layoutId="palette-highlight"
                      className="palette-highlight"
                      transition={{ type: 'spring', stiffness: 600, damping: 40 }}
                    />
                  )}
                  <Icon size={17} />
                  <span>{c.label}</span>
                  {c.hint && <span className="hint">{c.hint}</span>}
                  {i === active && <ArrowRight size={15} />}
                </button>
              </li>
            )
          })}
        </ul>
        <div className="palette-foot">
          <span>
            <span className="kbd">↑</span> <span className="kbd">↓</span> navigate
          </span>
          <span>
            <span className="kbd">↵</span> open
          </span>
        </div>
      </motion.div>
    </motion.div>
  )
}
