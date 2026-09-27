import { motion } from 'motion/react'
import { useId } from 'react'

export type TabItem<K extends string> = { key: K; label: string; count?: number | null }

/** Underlined tabs; the indicator slides between tabs. Arrow keys move focus. */
export function Tabs<K extends string>({
  items,
  value,
  onChange,
  label,
}: {
  items: TabItem<K>[]
  value: K
  onChange: (key: K) => void
  label: string
}) {
  const group = useId()
  return (
    <div
      className="tabs"
      role="tablist"
      aria-label={label}
      onKeyDown={(e) => {
        const i = items.findIndex((t) => t.key === value)
        if (e.key === 'ArrowRight') onChange(items[(i + 1) % items.length].key)
        if (e.key === 'ArrowLeft') onChange(items[(i - 1 + items.length) % items.length].key)
      }}
    >
      {items.map((t) => (
        <button
          key={t.key}
          role="tab"
          className="tab"
          aria-selected={t.key === value}
          tabIndex={t.key === value ? 0 : -1}
          onClick={() => onChange(t.key)}
        >
          {t.label}
          {t.count !== undefined && t.count !== null && (
            <span className="tab__count">{t.count}</span>
          )}
          {t.key === value && (
            <motion.span
              layoutId={`tab-indicator-${group}`}
              className="tab__indicator"
              transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
            />
          )}
        </button>
      ))}
    </div>
  )
}
