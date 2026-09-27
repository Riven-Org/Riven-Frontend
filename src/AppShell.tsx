import { useState, type ReactNode } from 'react'

import { useAuth } from './auth/context'
import { Logo } from './ui/Logo'

function initials(name: string): string {
  const parts = name.split(/[\s@.]+/).filter(Boolean)
  return (parts[0]?.[0] ?? '?').toUpperCase() + (parts[1]?.[0] ?? '').toUpperCase()
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const name = user?.profile.name ?? user?.profile.email ?? 'You'

  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="/">
          <Logo size={26} />
          <span>Riven</span>
        </a>
        <div className="topbar-spacer" />
        <div className="menu">
          <button
            className="avatar"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label={`Account menu for ${name}`}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {initials(name)}
          </button>
          {menuOpen && (
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
      <main className="content">{children}</main>
    </div>
  )
}
