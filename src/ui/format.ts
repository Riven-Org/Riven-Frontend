// Formatting helpers shared by every page, so dates and names read the same everywhere.

export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return 'Never'
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000)
  const future = seconds < 0
  const s = Math.abs(seconds)
  const unit =
    s < 45
      ? null
      : s < 3600
        ? [Math.round(s / 60), 'min']
        : s < 86400
          ? [Math.round(s / 3600), 'h']
          : s < 86400 * 30
            ? [Math.round(s / 86400), 'd']
            : null
  if (s < 45) return 'Just now'
  if (!unit) return shortDate(iso)
  return future ? `in ${unit[0]} ${unit[1]}` : `${unit[0]} ${unit[1]} ago`
}

export function shortDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function dateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function initials(nameOrEmail: string): string {
  const parts = nameOrEmail.split(/[\s@._-]+/).filter(Boolean)
  return ((parts[0]?.[0] ?? '?') + (parts[1]?.[0] ?? '')).toUpperCase()
}

/** A stable hue per person so lists are easy to scan (tinted in CSS per theme). */
export function avatarHue(seed: string): number {
  const hues = [232, 262, 190, 150, 28, 336]
  let h = 0
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) % 997
  return hues[h % hues.length]
}
