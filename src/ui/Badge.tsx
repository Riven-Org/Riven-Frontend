import type { ComponentType, ReactNode } from 'react'

import type { Role } from '../api/types'
import { ICON_STROKE } from './icons'

export type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info'

export function Badge({
  tone = 'neutral',
  icon: Icon,
  dot,
  outline,
  children,
}: {
  tone?: Tone
  icon?: ComponentType<{ size?: number; strokeWidth?: number }>
  dot?: boolean
  outline?: boolean
  children: ReactNode
}) {
  return (
    <span
      className={`badge ${tone !== 'neutral' ? `badge--${tone}` : ''} ${outline ? 'badge--outline' : ''}`}
    >
      {dot && <span className="status-dot" aria-hidden="true" />}
      {Icon && <Icon size={12} strokeWidth={ICON_STROKE + 0.25} />}
      {children}
    </span>
  )
}

const ROLE_TONE: Record<Role, Tone> = {
  owner: 'accent',
  admin: 'info',
  maintainer: 'success',
  reviewer: 'warning',
  viewer: 'neutral',
}

const ROLE_LABEL: Record<Role, string> = {
  owner: 'Owner',
  admin: 'Admin',
  maintainer: 'Maintainer',
  reviewer: 'Reviewer',
  viewer: 'Viewer',
}

export function RoleBadge({ role }: { role: Role | null | undefined }) {
  if (!role) return <Badge>Service account</Badge>
  return <Badge tone={ROLE_TONE[role]}>{ROLE_LABEL[role]}</Badge>
}

// oxlint-disable-next-line react/only-export-components
export const roleLabel = (role: Role) => ROLE_LABEL[role]
