import { createContext, useContext } from 'react'
import type { User } from 'oidc-client-ts'

export type SignInOptions = {
  /** Skip Keycloak's chooser and go straight to GitHub or Google. */
  provider?: 'github' | 'google'
  /** Open the registration form instead of the sign-in form. */
  register?: boolean
}

export type KeycloakAction = 'CONFIGURE_TOTP' | 'CONFIGURE_RECOVERY_AUTHN_CODES'

export type AuthState = {
  user: User | null
  ready: boolean
  signIn: (options?: SignInOptions) => Promise<void>
  signOut: () => Promise<void>
  /** Run a Keycloak required action (e.g. CONFIGURE_TOTP), then come back here. */
  startAction: (action: KeycloakAction) => Promise<void>
  accessToken: () => Promise<string | null>
}

export const AuthContext = createContext<AuthState | null>(null)

export function useAuth(): AuthState {
  const auth = useContext(AuthContext)
  if (!auth) throw new Error('useAuth must be used inside <AuthProvider>')
  return auth
}
