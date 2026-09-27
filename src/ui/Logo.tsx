/** The Riven mark: an R cut by a verification check. Solid, single colour. */
export function Logo({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="var(--text)" />
      <path
        d="M11 23V9h6.3a4.2 4.2 0 0 1 1 8.3L22 23M11 17h6"
        fill="none"
        stroke="var(--canvas)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
