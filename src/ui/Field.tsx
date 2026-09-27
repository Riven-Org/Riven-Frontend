import {
  useId,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'

import { CircleAlert, ICON_STROKE, Search } from './icons'

/** Label, control, help and error in one consistent block. The control gets the ids wired
 * for accessibility through the render prop. */
export function Field({
  label,
  help,
  error,
  optional,
  children,
}: {
  label: string
  help?: ReactNode
  error?: string | null
  optional?: boolean
  children: (props: {
    id: string
    'aria-describedby'?: string
    'aria-invalid'?: boolean
  }) => ReactElement
}) {
  const id = useId()
  const helpId = `${id}-help`
  const errorId = `${id}-error`
  const describedBy = [error ? errorId : null, help ? helpId : null].filter(Boolean).join(' ')
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
        {optional && <span className="optional">Optional</span>}
      </label>
      {children({
        id,
        'aria-describedby': describedBy || undefined,
        'aria-invalid': error ? true : undefined,
      })}
      {error ? (
        <span className="field__error" id={errorId} role="alert">
          <CircleAlert size={13} strokeWidth={ICON_STROKE} />
          {error}
        </span>
      ) : (
        help && (
          <span className="field__help" id={helpId}>
            {help}
          </span>
        )
      )}
    </div>
  )
}

export function Input({
  className = '',
  size,
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & { size?: 'sm' }) {
  return <input className={`input ${size === 'sm' ? 'input--sm' : ''} ${className}`} {...rest} />
}

export function Select({
  className = '',
  size,
  ...rest
}: Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> & { size?: 'sm' }) {
  return <select className={`select ${size === 'sm' ? 'select--sm' : ''} ${className}`} {...rest} />
}

export function Textarea({ className = '', ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`textarea ${className}`} {...rest} />
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search',
  label,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label: string
}) {
  return (
    <div className="search">
      <Search size={15} strokeWidth={ICON_STROKE} />
      <input
        className="input input--sm"
        type="search"
        value={value}
        placeholder={placeholder}
        aria-label={label}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

export function Checkbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  children: ReactNode
}) {
  return (
    <label className="checkbox">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {children}
    </label>
  )
}

export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  disabled?: boolean
}) {
  return (
    <span className="switch">
      <input
        type="checkbox"
        role="switch"
        aria-label={label}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="switch__track" aria-hidden="true" />
    </span>
  )
}
