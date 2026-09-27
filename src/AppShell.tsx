import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState, type ReactNode } from 'react'

import { useAuth } from './auth/context'
import { NAV, NAV_GROUPS } from './nav'
import { useOrgs, usePermissions } from './org/context'
import { navigate, usePath } from './router'
import { Avatar } from './ui/Avatar'
import { RoleBadge } from './ui/Badge'
import { Button } from './ui/Button'
import { CommandPalette } from './ui/CommandPalette'
import {
  Check,
  ChevronsUpDown,
  Command,
  ICON_STROKE,
  LogOut,
  Menu as MenuIcon,
  Monitor,
  Moon,
  Plus,
  Search,
  ShieldCheck,
  Sun,
} from './ui/icons'
import { Logo } from './ui/Logo'
import { Menu } from './ui/Menu'
import { useTheme, type ThemeMode } from './ui/theme'

const THEMES: { mode: ThemeMode; icon: typeof Sun; label: string }[] = [
  { mode: 'light', icon: Sun, label: 'Light' },
  { mode: 'dark', icon: Moon, label: 'Dark' },
  { mode: 'system', icon: Monitor, label: 'Auto' },
]

function ThemeChoice() {
  const { mode, setMode } = useTheme()
  return (
    <div className="theme-choice" role="group" aria-label="Theme">
      {THEMES.map(({ mode: m, icon: Icon, label }) => (
        <button key={m} aria-pressed={mode === m} onClick={() => setMode(m)}>
          <Icon size={13} strokeWidth={ICON_STROKE} />
          {label}
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
  const [palette, setPalette] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const name = user?.profile.name ?? user?.profile.email ?? 'You'
  const email = user?.profile.email ?? ''
  const here = NAV.find((n) => n.to === path)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPalette((open) => !open)
      }
    }
    const onScroll = () => setScrolled(window.scrollY > 4)
    window.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  const go = (to: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    setNavOpen(false)
    navigate(to)
  }

  return (
    <div className={`shell ${navOpen ? 'nav-open' : ''}`}>
      {navOpen && <div className="scrim" onClick={() => setNavOpen(false)} />}
      <aside className="sidebar" aria-label="Main navigation">
        <div className="sidebar__top">
          {current && (
            <Menu
              align="start"
              width={260}
              trigger={(props) => (
                <button
                  className="workspace"
                  {...props}
                  aria-label={`Organization: ${current.name}`}
                >
                  <Avatar name={current.name} square />
                  <span className="workspace__name">
                    <strong className="truncate">{current.name}</strong>
                    <span>{current.role ?? 'Service account'}</span>
                  </span>
                  <ChevronsUpDown
                    size={15}
                    strokeWidth={ICON_STROKE}
                    className="workspace__chevron"
                  />
                </button>
              )}
              items={[
                { heading: 'Organizations' },
                ...orgs.map((o) => ({
                  label: o.name,
                  icon: o.id === current.id ? Check : undefined,
                  trail: o.role ? <RoleBadge role={o.role} /> : undefined,
                  onSelect: () => select(o.id),
                })),
                { separator: true as const },
                { label: 'Create organization', icon: Plus, onSelect: () => navigate('/orgs/new') },
              ]}
            />
          )}
        </div>

        {NAV_GROUPS.map((group) => {
          const items = group.items.filter((item) => !item.needs || can(item.needs))
          if (items.length === 0) return null
          return (
            <nav className="nav" key={group.label} aria-label={group.label}>
              <div className="nav__label">{group.label}</div>
              {items.map((item) => {
                const active = path === item.to
                const Icon = item.icon
                return (
                  <a
                    key={item.to}
                    href={item.to}
                    className="nav__item"
                    aria-current={active ? 'page' : undefined}
                    onClick={go(item.to)}
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-active"
                        className="nav__active"
                        transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
                      />
                    )}
                    <Icon size={16} strokeWidth={ICON_STROKE} />
                    <span>{item.label}</span>
                  </a>
                )
              })}
            </nav>
          )
        })}

        <div className="sidebar__spacer" />

        <Menu
          side="up"
          align="start"
          width={244}
          trigger={(props) => (
            <button className="account" {...props} aria-label={`Account menu for ${name}`}>
              <Avatar name={name} />
              <span className="account__text">
                <strong className="truncate">{name}</strong>
                <span className="truncate">{email}</span>
              </span>
              <ChevronsUpDown size={15} strokeWidth={ICON_STROKE} className="workspace__chevron" />
            </button>
          )}
          items={[
            { label: 'Security', icon: ShieldCheck, onSelect: () => navigate('/security') },
            {
              label: 'Command menu',
              icon: Command,
              trail: <span className="kbd">⌘K</span>,
              onSelect: () => setPalette(true),
            },
            { separator: true },
            { label: 'Sign out', icon: LogOut, onSelect: () => void signOut() },
          ]}
        >
          <div className="menu__label">Theme</div>
          <ThemeChoice />
          <div className="menu__sep" />
        </Menu>
      </aside>

      <div className="main">
        <header className={`topbar ${scrolled ? 'is-scrolled' : ''}`}>
          <Button
            variant="ghost"
            icon={MenuIcon}
            className="menu-toggle"
            aria-label="Open navigation"
            onClick={() => setNavOpen(true)}
          />
          <nav className="crumbs" aria-label="Breadcrumb">
            <ol>
              <li className="truncate">
                <span className="brand" style={{ gap: 6 }}>
                  <Logo size={18} />
                </span>
                {current?.name}
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page">{here?.label ?? 'Riven'}</li>
            </ol>
          </nav>
          <div className="topbar__spacer" />
          <button
            className="search-button"
            onClick={() => setPalette(true)}
            aria-label="Search and commands"
          >
            <Search size={14} strokeWidth={ICON_STROKE} />
            <span className="search-button__label">Search…</span>
            <span className="kbd">⌘K</span>
          </button>
        </header>

        <AnimatePresence mode="wait">
          <motion.main
            key={`${current?.id}:${path}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.08 } }}
            transition={{ duration: 0.14 }}
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>

      <CommandPalette open={palette} onClose={() => setPalette(false)} />
    </div>
  )
}
