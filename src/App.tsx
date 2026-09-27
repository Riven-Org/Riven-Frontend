import { useEffect, useState, type ReactElement } from 'react'

import { api, MFA_REQUIRED_EVENT } from './api/client'

import { AppShell } from './AppShell'
import { useAuth } from './auth/context'
import { OrgProvider } from './org/OrgProvider'
import { useOrgs } from './org/context'
import { AcceptInvite } from './pages/AcceptInvite'
import { ApiKeys } from './pages/ApiKeys'
import { AuthCallback } from './pages/AuthCallback'
import { Changes } from './pages/Changes'
import { CreateOrg } from './pages/CreateOrg'
import { Home } from './pages/Home'
import { Members } from './pages/Members'
import { MfaRequired } from './pages/MfaRequired'
import { Security } from './pages/Security'
import { SignIn } from './pages/SignIn'
import { usePath } from './router'
import { LoadingScreen } from './ui/FullScreen'
import { ToastProvider } from './ui/toast'

function useMfaBlocked(): boolean {
  const { current } = useOrgs()
  const [blockedOrg, setBlockedOrg] = useState<string | null>(null)

  useEffect(() => {
    const onBlocked = () => setBlockedOrg(current?.id ?? null)
    window.addEventListener(MFA_REQUIRED_EVENT, onBlocked)
    // When the org requires 2FA, ask the API up front instead of waiting for a page to hit it.
    if (current?.require_mfa) api(`/v1/orgs/${current.id}`).catch(() => undefined)
    return () => window.removeEventListener(MFA_REQUIRED_EVENT, onBlocked)
  }, [current?.id, current?.require_mfa])

  return blockedOrg !== null && blockedOrg === current?.id
}

function Workspace() {
  const path = usePath()
  const { current, loading } = useOrgs()
  const mfaBlocked = useMfaBlocked()

  if (path === '/invite') return <AcceptInvite />
  if (loading) return <LoadingScreen label="Loading your workspace…" />
  if (!current) return <CreateOrg first />
  if (mfaBlocked && path !== '/security') return <MfaRequired />
  if (path === '/orgs/new') return <CreateOrg />
  const pages: Record<string, () => ReactElement> = {
    '/members': () => <Members />,
    '/changes': () => <Changes />,
    '/api-keys': () => <ApiKeys />,
    '/security': () => <Security />,
  }
  return <AppShell>{(pages[path] ?? (() => <Home />))()}</AppShell>
}

function App() {
  const path = usePath()
  const { user, ready } = useAuth()

  if (path === '/auth/callback') return <AuthCallback />
  if (!ready) return <LoadingScreen label="Loading…" />
  if (!user) return <SignIn />
  return (
    <ToastProvider>
      <OrgProvider>
        <Workspace />
      </OrgProvider>
    </ToastProvider>
  )
}

export default App
