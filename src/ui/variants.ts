import type { Variants } from 'motion/react'

// Shared animation timings and variants (respect reduced motion via <MotionConfig>).
export const ease = [0.22, 1, 0.36, 1] as const

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14, filter: 'blur(4px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.5, ease } },
}

export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
}

export const listItem: Variants = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0, transition: { duration: 0.35, ease } },
  exit: {
    opacity: 0,
    x: 20,
    height: 0,
    marginTop: 0,
    paddingTop: 0,
    paddingBottom: 0,
    transition: { duration: 0.25 },
  },
}
