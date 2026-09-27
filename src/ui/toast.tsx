import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

type Tone = 'ok' | 'bad'
type Toast = { id: number; text: string; tone: Tone }
type Notify = (text: string, tone?: Tone) => void

const ToastContext = createContext<Notify>(() => {})

// eslint-disable-next-line react/only-export-components
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
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.tone} pop`}>
            {t.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
