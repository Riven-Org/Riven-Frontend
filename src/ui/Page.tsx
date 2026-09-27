import { motion } from 'motion/react'
import type { ReactNode } from 'react'

/** Every signed-in page: a title block with description and actions, then the body. */
export function Page({
  title,
  description,
  actions,
  children,
}: {
  title: string
  description?: ReactNode
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <motion.div
      className="page"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <header className="page__header">
        <div className="page__title">
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </div>
        {actions && <div className="page__actions">{actions}</div>}
      </header>
      <div className="page__body">{children}</div>
    </motion.div>
  )
}

/** A titled section sitting directly on the page — no card unless the content needs one. */
export function Section({
  title,
  description,
  actions,
  children,
}: {
  title: string
  description?: ReactNode
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="section" aria-label={title}>
      <div className="section__header">
        <div className="section__title">
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {actions && <div className="page__actions">{actions}</div>}
      </div>
      {children}
    </section>
  )
}
