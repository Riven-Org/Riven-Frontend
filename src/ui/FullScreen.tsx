import { motion } from 'motion/react'
import type { ReactNode } from 'react'

import { Logo } from './Logo'

/** Loading screen for auth transitions and first load. */
export function LoadingScreen({ label }: { label: string }) {
  return (
    <div className="fullscreen" role="status" aria-live="polite">
      <motion.div
        className="fullscreen__card fullscreen__card--center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.2 }}
      >
        <span className="spinner" aria-hidden="true" />
        <span className="t-sm t-muted">{label}</span>
      </motion.div>
    </div>
  )
}

/** Centred, single-purpose screens outside the app shell (onboarding, errors, 2FA). */
export function FullScreen({
  title,
  description,
  children,
  center = false,
}: {
  title: string
  description?: ReactNode
  children?: ReactNode
  center?: boolean
}) {
  return (
    <div className="fullscreen">
      <motion.div
        className={`fullscreen__card ${center ? 'fullscreen__card--center' : ''}`}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <span className="brand">
          <Logo size={24} />
          Riven
        </span>
        <div className="fullscreen__head">
          <h1 className="t-display">{title}</h1>
          {description && <p>{description}</p>}
        </div>
        {children}
      </motion.div>
    </div>
  )
}
