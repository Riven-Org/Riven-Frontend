import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { useEffect, type ReactNode } from 'react'

import { ease, fadeUp, stagger } from './variants'

/** A block that fades and rises into place; children with `variants` inherit the stagger. */
export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={stagger} initial="hidden" animate="show">
      {children}
    </motion.div>
  )
}

export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={fadeUp}>
      {children}
    </motion.div>
  )
}

/** Counts up from 0 to `value` once it is known. */
export function AnimatedNumber({ value }: { value: number | null }) {
  const reduce = useReducedMotion()
  const count = useMotionValue(0)
  const text = useTransform(count, (v) => Math.round(v).toLocaleString())

  useEffect(() => {
    if (value === null) return
    if (reduce) {
      count.set(value)
      return
    }
    const controls = animate(count, value, { duration: 1.1, ease })
    return () => controls.stop()
  }, [value, reduce, count])

  if (value === null) return <span className="num-skeleton" aria-busy="true" />
  return <motion.span>{text}</motion.span>
}
