import { AnimatePresence, motion } from 'motion/react'
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

import { Button } from './Button'
import { CircleAlert, CircleCheck, ICON_STROKE, X } from './icons'

type Tone = 'ok' | 'bad'
type Toast = { id: number; text: string; tone: Tone }
type Notify = (text: string, tone?: Tone) => void

const ToastContext = createContext<Notify>(() => {})

// oxlint-disable-next-line react/only-export-components
export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const dismiss = useCallback(
    (id: number) => setToasts((list) => list.filter((t) => t.id !== id)),
    [],
  )

  const notify = useCallback<Notify>(
    (text, tone = 'ok') => {
      const id = Date.now() + Math.random()
      setToasts((list) => [...list.slice(-3), { id, text, tone }])
      window.setTimeout(() => dismiss(id), tone === 'bad' ? 6000 : 3500)
    },
    [dismiss],
  )

  const value = useMemo(() => notify, [notify])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              className={`toast ${t.tone === 'ok' ? 'toast--success' : 'toast--error'}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 16, transition: { duration: 0.14 } }}
              transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
            >
              {t.tone === 'ok' ? (
                <CircleCheck size={16} strokeWidth={ICON_STROKE} />
              ) : (
                <CircleAlert size={16} strokeWidth={ICON_STROKE} />
              )}
              <span className="toast__text">{t.text}</span>
              <Button
                variant="ghost"
                size="sm"
                icon={X}
                aria-label="Dismiss"
                className="toast__close"
                onClick={() => dismiss(t.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
