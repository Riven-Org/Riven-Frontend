import { motion } from 'motion/react'
import { useEffect, useRef, type ReactNode } from 'react'

/** Accessible dialog on the native <dialog> element (focus trap, Esc) with a spring entrance. */
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    dialog?.showModal()
    return () => dialog?.close()
  }, [])

  return (
    <dialog ref={ref} className="modal" aria-label={title} onCancel={onClose}>
      <motion.div
        className="modal-body"
        initial={{ opacity: 0, y: 24, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      >
        <h2>{title}</h2>
        {children}
      </motion.div>
    </dialog>
  )
}
