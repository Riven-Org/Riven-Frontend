import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import { api } from '../api/client'
import type { Org } from '../api/types'
import { OrgContext, type OrgState } from './context'

const STORAGE_KEY = 'riven.currentOrg'

function remembered(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function OrgProvider({ children }: { children: ReactNode }) {
  const [orgs, setOrgs] = useState<Org[]>([])
  const [currentId, setCurrentId] = useState<string | null>(remembered)
  const [loading, setLoading] = useState(true)

  const fetchOrgs = useCallback(
    () =>
      api<Org[]>('/v1/orgs').then(
        (list) => {
          setOrgs(list)
          setLoading(false)
          return list
        },
        (err: unknown) => {
          setLoading(false)
          throw err
        },
      ),
    [],
  )

  useEffect(() => {
    fetchOrgs().catch(() => undefined)
  }, [fetchOrgs])

  const reload = fetchOrgs

  const select = useCallback((orgId: string) => {
    setCurrentId(orgId)
    try {
      window.localStorage.setItem(STORAGE_KEY, orgId)
    } catch {
      // Storage may be unavailable (private mode); the choice then lasts for this tab only.
    }
  }, [])

  const value = useMemo<OrgState>(() => {
    const current = orgs.find((o) => o.id === currentId) ?? orgs[0] ?? null
    return { orgs, current, loading, select, reload }
  }, [orgs, currentId, loading, select, reload])

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>
}
