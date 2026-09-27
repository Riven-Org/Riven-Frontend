import { useEffect, useRef, useState, type ReactNode } from 'react'

import type { Permission } from './api/types'
import { useAuth } from './auth/context'
import { useOrgs, usePermissions } from './org/context'
import { navigate, usePath } from './router'
import { Logo } from './ui/Logo'

type NavItem = { to: string; label: string; needs?: Permission }

const NAV: NavItem[] = [
  { to: '/', label: 'Overview' },
  { to: '/changes', label: 'Changes', needs: 'changes.read' },
  { to: '/members', label: 'Members', needs: 'members.read' },
  { to: '/api-keys', label: 'API keys', needs: 'api_keys.read' },
  { to: '/security', label: 'Security' },
]

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

export function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth()
  const { orgs, current, select } = useOrgs()
  const { can } = usePermissions()
  const path = usePath()
  const [menu, setMenu] = useState<'org' | 'user' | null>(null)
  const close = () => setMenu(null)
  const orgRef = useDismiss(menu === 'org', close)
  const userRef = useDismiss(menu === 'user', close)
  const name = user?.profile.name ?? user?.profile.email ?? 'You'

  return (
    <div className="app">
      <header className="topbar">
        <a
          className="brand"
          href="/"
          onClick={(e) => {
            e.preventDefault()
            navigate('/')
          }}
        >
          <Logo size={26} />
          <span>Riven</span>
        </a>

        {current && (
          <div className="menu" ref={orgRef}>
            <button
              className="org-switch"
              aria-haspopup="menu"
              aria-expanded={menu === 'org'}
              onClick={() => setMenu(menu === 'org' ? null : 'org')}
            >
              <span className="org-dot" aria-hidden="true">
                {current.name.slice(0, 1).toUpperCase()}
              </span>
              <span>{current.name}</span>
              <span className="chev" aria-hidden="true">
                ▾
              </span>
            </button>
            {menu === 'org' && (
              <div className="menu-popover menu-left pop" role="menu">
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
                    <span className={`role role-${o.role}`}>{o.role}</span>
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
                  + New organization
                </button>
              </div>
            )}
          </div>
        )}

        <nav className="tabs" aria-label="Sections">
          {NAV.filter((item) => !item.needs || can(item.needs)).map((item) => (
            <a
              key={item.to}
              href={item.to}
              className={`tab ${path === item.to ? 'tab-active' : ''}`}
              aria-current={path === item.to ? 'page' : undefined}
              onClick={(e) => {
                e.preventDefault()
                navigate(item.to)
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="topbar-spacer" />

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
          {menu === 'user' && (
            <div className="menu-popover pop" role="menu">
              <div className="menu-head">
                <strong>{name}</strong>
                <span className="muted">{user?.profile.email}</span>
              </div>
              <button role="menuitem" className="menu-item" onClick={() => signOut()}>
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>
      <main className="content" key={`${current?.id}:${path}`}>
        {children}
      </main>
    </div>
  )
}
