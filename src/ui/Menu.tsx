import { AnimatePresence, motion } from 'motion/react'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type ReactElement,
  type ReactNode,
} from 'react'

import { ICON_STROKE } from './icons'

export type MenuEntry =
  | {
      label: string
      icon?: ComponentType<{ size?: number; strokeWidth?: number }>
      onSelect: () => void
      danger?: boolean
      trail?: ReactNode
    }
  | { separator: true }
  | { heading: string }

/** Dropdown menu: opens from a trigger, closes on outside click / Escape, arrow-key navigable. */
export function Menu({
  trigger,
  items,
  align = 'end',
  side = 'down',
  children,
  width,
}: {
  trigger: (props: {
    onClick: () => void
    'aria-expanded': boolean
    'aria-haspopup': 'menu'
  }) => ReactElement
  items?: MenuEntry[]
  align?: 'start' | 'end'
  side?: 'down' | 'up'
  children?: ReactNode
  width?: number
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) close()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    const first = ref.current?.querySelector<HTMLElement>('.menu__item')
    first?.focus()
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, close])

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    const entries = Array.from(ref.current?.querySelectorAll<HTMLElement>('.menu__item') ?? [])
    const i = entries.indexOf(document.activeElement as HTMLElement)
    const next =
      e.key === 'ArrowDown' ? (i + 1) % entries.length : (i - 1 + entries.length) % entries.length
    entries[next]?.focus()
  }

  return (
    <div className="menu-anchor" ref={ref}>
      {trigger({
        onClick: () => setOpen((o) => !o),
        'aria-expanded': open,
        'aria-haspopup': 'menu',
      })}
      <AnimatePresence>
        {open && (
          <motion.div
            className={`menu menu--${side} ${align === 'end' ? 'menu--end' : ''}`}
            role="menu"
            style={width ? { width } : undefined}
            initial={{ opacity: 0, scale: 0.98, y: side === 'down' ? -4 : 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.1 } }}
            transition={{ duration: 0.14, ease: [0.2, 0.8, 0.2, 1] }}
            onKeyDown={onKeyDown}
            onClick={(e) => {
              if ((e.target as HTMLElement).closest('.menu__item')) close()
            }}
          >
            {children}
            {items?.map((item, i) => {
              if ('separator' in item)
                return <div key={`sep-${i}`} className="menu__sep" role="separator" />
              if ('heading' in item)
                return (
                  <div key={`h-${i}`} className="menu__label">
                    {item.heading}
                  </div>
                )
              const Icon = item.icon
              return (
                <button
                  key={item.label}
                  role="menuitem"
                  className={`menu__item ${item.danger ? 'menu__item--danger' : ''}`}
                  onClick={item.onSelect}
                >
                  {Icon && <Icon size={15} strokeWidth={ICON_STROKE} />}
                  {item.label}
                  {item.trail && <span className="menu__trail">{item.trail}</span>}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
