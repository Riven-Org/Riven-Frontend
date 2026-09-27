// Identity provider settings (Keycloak realm `riven`, client `riven-web`). Override per
// environment with VITE_OIDC_AUTHORITY / VITE_OIDC_CLIENT_ID.
export const oidcConfig = {
  authority: import.meta.env.VITE_OIDC_AUTHORITY ?? 'http://localhost:8081/realms/riven',
  clientId: import.meta.env.VITE_OIDC_CLIENT_ID ?? 'riven-web',
}
