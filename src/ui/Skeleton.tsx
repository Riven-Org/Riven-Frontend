import type { CSSProperties } from 'react'

export function Skeleton({
  width = '100%',
  height = 12,
  style,
}: {
  width?: number | string
  height?: number
  style?: CSSProperties
}) {
  return <span className="skeleton" style={{ width, height, ...style }} aria-hidden="true" />
}

/** Placeholder lines with a screen-reader label, for any block that is loading. */
export function SkeletonBlock({
  lines = 3,
  label = 'Loading',
}: {
  lines?: number
  label?: string
}) {
  const widths = ['100%', '82%', '64%', '90%', '48%']
  return (
    <div className="stack" role="status" aria-label={label}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} width={widths[i % widths.length]} />
      ))}
    </div>
  )
}
