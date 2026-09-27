import type { ReactElement } from 'react'

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
import { SignIn } from './pages/SignIn'
import { usePath } from './router'
import { Spinner } from './ui/Spinner'
import { ToastProvider } from './ui/toast'

function Workspace() {
  const path = usePath()
  const { current, loading } = useOrgs()

  if (path === '/invite') return <AcceptInvite />
  if (loading) return <Spinner label="Loading your organizations…" />
  if (!current) return <CreateOrg first />
  if (path === '/orgs/new') return <CreateOrg />
  const pages: Record<string, () => ReactElement> = {
    '/members': () => <Members />,
    '/changes': () => <Changes />,
    '/api-keys': () => <ApiKeys />,
  }
  return <AppShell>{(pages[path] ?? (() => <Home />))()}</AppShell>
}

function App() {
  const path = usePath()
  const { user, ready } = useAuth()

  if (path === '/auth/callback') return <AuthCallback />
  if (!ready) return <Spinner label="Loading…" />
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
