import { useSyncExternalStore } from 'react'

// Minimal History-API navigation for the few E03 pages; replaced if a router ticket lands.
const listeners = new Set<() => void>()

window.addEventListener('popstate', () => listeners.forEach((notify) => notify()))

export function navigate(to: string, { replace = false } = {}) {
  if (replace) window.history.replaceState(null, '', to)
  else window.history.pushState(null, '', to)
  listeners.forEach((notify) => notify())
}

export function usePath(): string {
  return useSyncExternalStore(
    (notify) => {
      listeners.add(notify)
      return () => listeners.delete(notify)
    },
    () => window.location.pathname,
  )
}
