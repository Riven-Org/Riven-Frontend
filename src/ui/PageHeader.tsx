import { motion } from 'motion/react'
import type { ComponentType, ReactNode } from 'react'

import { fadeUp } from './variants'

type Icon = ComponentType<{ size?: number; strokeWidth?: number }>

export function PageHeader({
  icon: IconComponent,
  title,
  subtitle,
  actions,
}: {
  icon: Icon
  title: string
  subtitle?: ReactNode
  actions?: ReactNode
}) {
  return (
    <motion.header className="page-head" variants={fadeUp}>
      <div className="page-head-text">
        <h1>
          <span className="page-icon" aria-hidden="true">
            <IconComponent size={20} strokeWidth={2.2} />
          </span>
          {title}
        </h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {actions && <div className="actions">{actions}</div>}
    </motion.header>
  )
}
