import { useEffect, useRef, type ReactNode } from 'react'

/** Accessible dialog on top of the native <dialog> element (focus trap, Esc to close). */
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
      <div className="modal-body pop">
        <h2>{title}</h2>
        {children}
      </div>
    </dialog>
  )
}
