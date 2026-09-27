import { motion } from 'motion/react'

import { Logo } from './Logo'

export function Spinner({ label }: { label: string }) {
  return (
    <div className="center-screen" role="status" aria-live="polite">
      <motion.span
        className="loader-logo"
        animate={{ rotate: [0, 0, 180, 180, 360], scale: [1, 0.9, 0.9, 1, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Logo size={44} />
      </motion.span>
      <motion.span
        className="muted"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {label}
      </motion.span>
    </div>
  )
}
