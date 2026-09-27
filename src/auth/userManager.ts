import { UserManager, WebStorageStateStore } from 'oidc-client-ts'

import { oidcConfig } from '../config'

// Authorization code + PKCE (S256) against Keycloak (S03.1.3). Tokens live in localStorage so
// a session survives a page reload; refresh tokens renew the access token silently before it
// expires. Logout removes everything and ends the Keycloak session.
export const userManager = new UserManager({
  authority: oidcConfig.authority,
  client_id: oidcConfig.clientId,
  redirect_uri: `${window.location.origin}/auth/callback`,
  post_logout_redirect_uri: `${window.location.origin}/`,
  response_type: 'code',
  scope: 'openid profile email',
  automaticSilentRenew: true,
  userStore: new WebStorageStateStore({ store: window.localStorage }),
})

let callback: Promise<string> | null = null

/** Finish the redirect from Keycloak once (StrictMode runs effects twice). */
export function completeSignIn(): Promise<string> {
  callback ??= userManager.signinRedirectCallback().then((user) => {
    const state = user.state as { returnTo?: string } | undefined
    return state?.returnTo ?? '/'
  })
  return callback
}
