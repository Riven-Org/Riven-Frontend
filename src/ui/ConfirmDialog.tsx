import { useState, type ReactNode } from 'react'

import { Button } from './Button'
import { Modal } from './Modal'

/** Confirmation for destructive actions: says exactly what will happen, danger button last. */
export function ConfirmDialog({
  title,
  children,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  title: string
  children: ReactNode
  confirmLabel: string
  onConfirm: () => Promise<unknown>
  onClose: () => void
}) {
  const [busy, setBusy] = useState(false)
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={busy}
            onClick={async () => {
              setBusy(true)
              try {
                await onConfirm()
              } finally {
                setBusy(false)
                onClose()
              }
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="t-secondary">{children}</p>
    </Modal>
  )
}
