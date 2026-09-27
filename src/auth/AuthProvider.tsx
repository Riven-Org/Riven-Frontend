import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User } from 'oidc-client-ts'

import { AuthContext, type AuthState, type SignInOptions } from './context'
import { userManager } from './userManager'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true
    userManager.getUser().then((stored) => {
      if (!active) return
      setUser(stored && !stored.expired ? stored : null)
      setReady(true)
    })
    const loaded = (next: User) => setUser(next)
    const gone = () => setUser(null)
    userManager.events.addUserLoaded(loaded)
    userManager.events.addUserUnloaded(gone)
    userManager.events.addUserSignedOut(gone)
    userManager.events.addSilentRenewError(gone)
    return () => {
      active = false
      userManager.events.removeUserLoaded(loaded)
      userManager.events.removeUserUnloaded(gone)
      userManager.events.removeUserSignedOut(gone)
      userManager.events.removeSilentRenewError(gone)
    }
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      user,
      ready,
      signIn: async ({ provider, register }: SignInOptions = {}) => {
        const extraQueryParams: Record<string, string> = {}
        if (provider) extraQueryParams.kc_idp_hint = provider
        await userManager.signinRedirect({
          state: { returnTo: window.location.pathname + window.location.search },
          prompt: register ? 'create' : undefined,
          extraQueryParams,
        })
      },
      startAction: async (action) => {
        await userManager.signinRedirect({
          state: { returnTo: window.location.pathname },
          extraQueryParams: { kc_action: action },
        })
      },
      signOut: async () => {
        const idToken = (await userManager.getUser())?.id_token
        await userManager.removeUser()
        await userManager.signoutRedirect({ id_token_hint: idToken })
      },
      accessToken: async () => {
        let current = await userManager.getUser()
        if (current?.expired) {
          current = await userManager.signinSilent().catch(() => null)
        }
        return current?.access_token ?? null
      },
    }),
    [user, ready],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
