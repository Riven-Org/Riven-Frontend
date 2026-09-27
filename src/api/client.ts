import { userManager } from '../auth/userManager'

/** An HTTP error from the API; `code` is the `detail` string when the API sends one. */
export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string) {
    super(`${status} ${code}`)
    this.status = status
    this.code = code
  }
}

async function token(): Promise<string | null> {
  let user = await userManager.getUser()
  if (user?.expired) user = await userManager.signinSilent().catch(() => null)
  return user?.access_token ?? null
}

/** Call the Riven API (relative `/api/...`, proxied in dev) as the signed-in user. */
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const send = async (bearer: string | null) => {
    const headers = new Headers(init.headers)
    if (bearer) headers.set('Authorization', `Bearer ${bearer}`)
    if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
    return fetch(`/api${path}`, { ...init, headers })
  }

  let response = await send(await token())
  if (response.status === 401) {
    // The access token was revoked or expired early: try one silent renewal, then give up.
    const renewed = await userManager.signinSilent().catch(() => null)
    if (renewed) response = await send(renewed.access_token)
    if (response.status === 401) await userManager.removeUser()
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    const detail = typeof body.detail === 'string' ? body.detail : response.statusText
    throw new ApiError(response.status, detail)
  }
  return (response.status === 204 ? undefined : await response.json()) as T
}
