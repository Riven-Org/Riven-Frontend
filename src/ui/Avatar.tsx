import type { CSSProperties } from 'react'

import { avatarHue, initials } from './format'

export function Avatar({
  name,
  size = 'md',
  square = false,
}: {
  name: string
  size?: 'sm' | 'md' | 'lg'
  square?: boolean
}) {
  const style = { '--avatar-hue': avatarHue(name) } as CSSProperties
  return (
    <span
      className={`avatar ${size !== 'md' ? `avatar--${size}` : ''} ${square ? 'avatar--square' : ''}`}
      style={style}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  )
}
