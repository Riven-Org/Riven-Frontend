import { AnimatePresence, motion } from 'motion/react'
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

import { CircleCheck, TriangleAlert } from './icons'

type Tone = 'ok' | 'bad'
type Toast = { id: number; text: string; tone: Tone }
type Notify = (text: string, tone?: Tone) => void

const ToastContext = createContext<Notify>(() => {})

// oxlint-disable-next-line react/only-export-components
export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const notify = useCallback<Notify>((text, tone = 'ok') => {
    const id = Date.now() + Math.random()
    setToasts((list) => [...list, { id, text, tone }])
    window.setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 3500)
  }, [])

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
              className={`toast toast-${t.tone}`}
              initial={{ opacity: 0, x: 60, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.95, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            >
              {t.tone === 'ok' ? <CircleCheck size={18} /> : <TriangleAlert size={18} />}
              {t.text}
              <span className="toast-progress" aria-hidden="true" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
