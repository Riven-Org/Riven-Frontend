import type { ReactNode } from 'react'

/** Small label shown on hover or keyboard focus after a short delay. */
export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="tooltip" data-tip={label}>
      {children}
    </span>
  )
}
