import type { ButtonHTMLAttributes, ComponentType, ReactNode } from 'react'

import { ICON_STROKE } from './icons'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-ghost'
type Icon = ComponentType<{ size?: number; strokeWidth?: number }>

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: 'md' | 'sm'
  icon?: Icon
  trailingIcon?: Icon
  loading?: boolean
  block?: boolean
  children?: ReactNode
}

/** The only button in the app. Primary for the one main action per view, secondary for the
 * rest, ghost for toolbar and inline actions, danger for destructive confirmations. */
export function Button({
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  trailingIcon: Trailing,
  loading = false,
  block = false,
  className = '',
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  const iconOnly = !children
  const classes = [
    'btn',
    `btn--${variant}`,
    size === 'sm' && 'btn--sm',
    iconOnly && 'btn--icon',
    block && 'btn--block',
    className,
  ]
    .filter(Boolean)
    .join(' ')
  const iconSize = size === 'sm' ? 14 : 16
  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <span className="btn-spinner" aria-hidden="true" />
      ) : (
        Icon && <Icon size={iconSize} strokeWidth={ICON_STROKE} />
      )}
      {children}
      {Trailing && <Trailing size={iconSize} strokeWidth={ICON_STROKE} />}
    </button>
  )
}
