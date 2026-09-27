import { createContext, useContext } from 'react'

import type { Org, Permission } from '../api/types'

export type OrgState = {
  orgs: Org[]
  current: Org | null
  loading: boolean
  select: (orgId: string) => void
  reload: () => Promise<Org[]>
}

export const OrgContext = createContext<OrgState | null>(null)

export function useOrgs(): OrgState {
  const state = useContext(OrgContext)
  if (!state) throw new Error('useOrgs must be used inside <OrgProvider>')
  return state
}

/**
 * What the signed-in user may do in the current org (S03.3.3). Mirrors the API's matrix
 * from the org response; the API still enforces every call.
 */
export function usePermissions(): { can: (permission: Permission) => boolean } {
  const { current } = useOrgs()
  const granted = new Set(current?.permissions ?? [])
  return { can: (permission) => granted.has(permission) }
}
