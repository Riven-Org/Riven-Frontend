import type { ReactNode } from 'react'

import { CircleAlert, CircleCheck, ICON_STROKE, Info, TriangleAlert } from './icons'

const ICONS = { info: Info, success: CircleCheck, warning: TriangleAlert, danger: CircleAlert }

export function Alert({
  tone = 'info',
  title,
  children,
  actions,
}: {
  tone?: keyof typeof ICONS
  title?: string
  children?: ReactNode
  actions?: ReactNode
}) {
  const Icon = ICONS[tone]
  return (
    <div className={`alert alert--${tone}`} role={tone === 'danger' ? 'alert' : 'status'}>
      <Icon size={16} strokeWidth={ICON_STROKE} />
      <div className="alert__body">
        {title && <span className="alert__title">{title}</span>}
        {children && <span className="t-secondary">{children}</span>}
      </div>
      {actions && <div className="alert__actions">{actions}</div>}
    </div>
  )
}
