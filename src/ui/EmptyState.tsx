import type { ComponentType, ReactNode } from 'react'

import { ICON_STROKE } from './icons'

export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
}: {
  icon: ComponentType<{ size?: number; strokeWidth?: number }>
  title: string
  children?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="empty">
      <span className="empty__icon" aria-hidden="true">
        <Icon size={18} strokeWidth={ICON_STROKE} />
      </span>
      <span className="empty__title">{title}</span>
      {children && <span className="empty__text">{children}</span>}
      {action && <div className="empty__action">{action}</div>}
    </div>
  )
}
