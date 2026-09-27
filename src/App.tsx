import { AppShell } from './AppShell'
import { useAuth } from './auth/context'
import { AuthCallback } from './pages/AuthCallback'
import { Home } from './pages/Home'
import { SignIn } from './pages/SignIn'
import { usePath } from './router'
import { Spinner } from './ui/Spinner'

function App() {
  const path = usePath()
  const { user, ready } = useAuth()

  if (path === '/auth/callback') return <AuthCallback />
  if (!ready) return <Spinner label="Loading…" />
  if (!user) return <SignIn />
  return (
    <AppShell>
      <Home />
    </AppShell>
  )
}

export default App
