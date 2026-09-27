import { motion } from 'motion/react'
import { useEffect, useId, useRef, type ReactNode } from 'react'

import { Button } from './Button'
import { X } from './icons'

/** Dialog on the native <dialog> (focus trap, Escape, backdrop). Header, scrollable body and
 * a footer for actions — primary action last. */
export function Modal({
  title,
  description,
  onClose,
  footer,
  wide,
  children,
}: {
  title: string
  description?: ReactNode
  onClose: () => void
  footer?: ReactNode
  wide?: boolean
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    dialog?.showModal()
    return () => dialog?.close()
  }, [])

  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? 'modal--wide' : ''}`}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className="modal__card"
        initial={{ opacity: 0, scale: 0.98, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <div className="modal__header">
          <div>
            <h2 id={titleId}>{title}</h2>
            {description && <p>{description}</p>}
          </div>
          <Button variant="ghost" size="sm" icon={X} aria-label="Close" onClick={onClose} />
        </div>
        <div className="modal__body">{children}</div>
        {footer && <div className="modal__footer">{footer}</div>}
      </motion.div>
    </dialog>
  )
}
