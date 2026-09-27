import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

import { useAuth } from './auth/context'
import { NAV } from './nav'
import { useOrgs, usePermissions } from './org/context'
import { navigate, usePath } from './router'
import { CommandPalette } from './ui/CommandPalette'
import {
  Check,
  ChevronDown,
  Command,
  LogOut,
  Monitor,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  ShieldCheck,
  Sun,
} from './ui/icons'
import { Logo } from './ui/Logo'
import { useTheme, type ThemeMode } from './ui/theme'

function initials(name: string): string {
  const parts = name.split(/[\s@.]+/).filter(Boolean)
  return (parts[0]?.[0] ?? '?').toUpperCase() + (parts[1]?.[0] ?? '').toUpperCase()
}

function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) close()
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, close])
  return ref
}

const popover = {
  initial: { opacity: 0, y: -6, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -6, scale: 0.97, transition: { duration: 0.12 } },
  transition: { type: 'spring' as const, stiffness: 500, damping: 34 },
}

const THEMES: { mode: ThemeMode; icon: typeof Sun; label: string }[] = [
  { mode: 'light', icon: Sun, label: 'Light theme' },
  { mode: 'system', icon: Monitor, label: 'Match system theme' },
  { mode: 'dark', icon: Moon, label: 'Dark theme' },
]

function ThemeToggle() {
  const { mode, setMode } = useTheme()
  return (
    <div className="theme-toggle" role="group" aria-label="Theme">
      {THEMES.map(({ mode: m, icon: Icon, label }) => (
        <button
          key={m}
          aria-pressed={mode === m}
          aria-label={label}
          title={label}
          onClick={() => setMode(m)}
        >
          {mode === m && (
            <motion.span
              layoutId="theme-thumb"
              className="thumb"
              transition={{ type: 'spring', stiffness: 500, damping: 34 }}
            />
          )}
          <Icon size={15} />
        </button>
      ))}
    </div>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth()
  const { orgs, current, select } = useOrgs()
  const { can } = usePermissions()
  const path = usePath()
  const [menu, setMenu] = useState<'org' | 'user' | null>(null)
  const [palette, setPalette] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const close = useCallback(() => setMenu(null), [])
  const orgRef = useDismiss(menu === 'org', close)
  const userRef = useDismiss(menu === 'user', close)
  const name = user?.profile.name ?? user?.profile.email ?? 'You'
  const items = NAV.filter((item) => !item.needs || can(item.needs))
  const here = NAV.find((n) => n.to === path)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPalette((open) => !open)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const go = (to: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    navigate(to)
  }

  return (
    <div className={`app ${collapsed ? 'collapsed' : ''}`}>
      <aside className="sidebar" aria-label="Main navigation">
        <a className="brand" href="/" onClick={go('/')}>
          <Logo size={30} />
          <span>Riven</span>
        </a>

        {current && (
          <div className="menu" ref={orgRef}>
            <button
              className="org-switch"
              aria-haspopup="menu"
              aria-expanded={menu === 'org'}
              title={current.name}
              onClick={() => setMenu(menu === 'org' ? null : 'org')}
            >
              <span className="org-dot" aria-hidden="true">
                {current.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="org-meta">
                <strong>{current.name}</strong>
                <span>{current.role}</span>
              </span>
              <ChevronDown size={16} className="chev" />
            </button>
            <AnimatePresence>
              {menu === 'org' && (
                <motion.div className="menu-popover menu-left" role="menu" {...popover}>
                  {orgs.map((o) => (
                    <button
                      key={o.id}
                      role="menuitemradio"
                      aria-checked={o.id === current.id}
                      className="menu-item org-item"
                      onClick={() => {
                        select(o.id)
                        close()
                      }}
                    >
                      <span>{o.name}</span>
                      {o.id === current.id ? (
                        <Check size={16} />
                      ) : (
                        <span className={`role role-${o.role}`}>{o.role}</span>
                      )}
                    </button>
                  ))}
                  <button
                    role="menuitem"
                    className="menu-item accent"
                    onClick={() => {
                      close()
                      navigate('/orgs/new')
                    }}
                  >
                    <Plus size={16} /> New organization
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <nav className="nav" aria-label="Sections">
          <div className="nav-label">Workspace</div>
          {items.map((item) => {
            const active = path === item.to
            const Icon = item.icon
            return (
              <a
                key={item.to}
                href={item.to}
                className={`nav-item ${active ? 'active' : ''}`}
                aria-current={active ? 'page' : undefined}
                title={item.label}
                onClick={go(item.to)}
              >
                {active && (
                  <>
                    <motion.span
                      layoutId="nav-bg"
                      className="nav-active-bg"
                      transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                    />
                    <motion.span
                      layoutId="nav-bar"
                      className="nav-active-bar"
                      transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                    />
                  </>
                )}
                <Icon size={18} strokeWidth={2.1} />
                <span>{item.label}</span>
              </a>
            )
          })}
        </nav>

        <div className="sidebar-spacer" />
        {current && !current.require_mfa && can('org.security') && (
          <div className="sidebar-card">
            <strong>
              <ShieldCheck size={15} /> Tip
            </strong>
            <span className="muted">Require two-factor sign-in for everyone in Security.</span>
          </div>
        )}
        <button
          className="btn btn-ghost btn-sm"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={() => setCollapsed((c) => !c)}
        >
          {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
        </button>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="crumbs">
            <span>{current?.name}</span>
            <span aria-hidden="true">/</span>
            <strong>{here?.label ?? 'Riven'}</strong>
          </div>
          <div className="topbar-spacer" />
          <button
            className="search-trigger"
            onClick={() => setPalette(true)}
            aria-label="Open command palette"
          >
            <Search size={16} />
            <span className="label">Search or jump to…</span>
            <span className="kbd">
              <Command size={11} />K
            </span>
          </button>
          <ThemeToggle />
          <div className="menu" ref={userRef}>
            <button
              className="avatar"
              aria-haspopup="menu"
              aria-expanded={menu === 'user'}
              aria-label={`Account menu for ${name}`}
              onClick={() => setMenu(menu === 'user' ? null : 'user')}
            >
              {initials(name)}
            </button>
            <AnimatePresence>
              {menu === 'user' && (
                <motion.div className="menu-popover" role="menu" {...popover}>
                  <div className="menu-head">
                    <strong>{name}</strong>
                    <span className="muted">{user?.profile.email}</span>
                  </div>
                  <button
                    role="menuitem"
                    className="menu-item"
                    onClick={() => {
                      close()
                      navigate('/security')
                    }}
                  >
                    <ShieldCheck size={16} /> Security
                  </button>
                  <button role="menuitem" className="menu-item" onClick={() => signOut()}>
                    <LogOut size={16} /> Sign out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.main
            key={`${current?.id}:${path}`}
            className="content"
            initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(4px)', transition: { duration: 0.15 } }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>

      <CommandPalette open={palette} onClose={() => setPalette(false)} />
    </div>
  )
}
