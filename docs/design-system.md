# Riven design system

Calm, precise, trustworthy. Quality comes from type, spacing and consistency — not from
gradients, glow or decoration. Every screen is built from the pieces below; if something new is
needed, add it here and in `src/ui/`, never as a page-specific style.

Files: tokens `src/styles/tokens.css` → base `src/styles/base.css` → components
`src/styles/components.css` → layout `src/styles/layout.css`. React components in `src/ui/`.

## Foundations

**Type** — Instrument Sans (UI) and JetBrains Mono (code, ids, hashes), both self-hosted (OFL).
Weights 400 / 500 / 600 only.

| Role | Token | Use |
|---|---|---|
| Display | `--text-display` 26/32 · 600 | One per full-screen view (sign-in, onboarding) |
| Page title | `--text-h1` 20/28 · 600 | `<Page title>` |
| Section | `--text-h2` 15/22 · 600 | `<Section title>`, dialog titles |
| Body | `--text-body` 14/21 | Default text |
| Small | `--text-sm` 13/19 | Descriptions, table secondary text |
| Label | `--text-label` 13 · 500 | Buttons, form labels, nav |
| Caption | `--text-caption` 12/16 | Metadata, help text |
| Overline | `--text-overline` 11 · 600 · uppercase | Group labels only (nav, scopes) |
| Mono | `--text-mono` 12.5 | Commits, keys, permissions, repositories |

Sentence case everywhere. No uppercase headings except overlines.

**Spacing** — 4px grid: `--space-1…16`. Page padding `--page-x`/`--page-y` (40/32 desktop,
28/24 tablet, 16/20 mobile). Sections are `--section-gap` apart. Card padding 20.

**Shape** — radii 4 / 6 / 8 / 12; controls 36px (30px small). Elevation: `--shadow-xs` on
controls and surfaces, `--shadow-pop` only for menus, dialogs, toasts and the command palette.

**Colour roles** (light and dark are separate palettes, not an inversion):
canvas → sidebar → surface → surface-sunken → surface-hover → surface-selected; border,
border-strong, border-focus; text, text-secondary, text-muted, text-faint; accent (+ hover,
active, text, subtle); success / warning / danger / info each with a `-subtle` background.
Accent is for the single primary action per view, links, focus and selection — nothing else.

**Motion** — 120 / 180 / 260 ms, decelerating (`--ease-out`), no bounce. Used for: menus,
dialogs, toasts, tab indicator, active nav item, page fade, theme cross-fade, skeletons.
`<MotionConfig reducedMotion="user">` and a CSS media query honour reduced motion.

**Icons** — lucide only, stroke 1.75 (`ICON_STROKE`), 16px in controls, 14–15px in dense UI.

## Components (`src/ui/`)

| Component | Notes |
|---|---|
| `Button` | `primary` (one per view) · `secondary` · `ghost` · `danger` · `danger-ghost`; `sm`; `icon`, `loading` |
| `Field` + `Input` / `Select` / `Textarea` / `SearchInput` | Label, help, error, optional; ids and aria wired by `Field` |
| `Checkbox`, `Switch` | Switch for instant settings; checkbox for selections |
| `Badge`, `RoleBadge` | Tones: neutral, accent, success, warning, danger, info |
| `Avatar` | Initials, stable per-person hue, square for organizations |
| `Tabs` | Underline with sliding indicator; arrow keys |
| `Menu` | Dropdown with headings, separators, danger items; Esc / outside click / arrows |
| `Tooltip` | Hover and focus, 300 ms delay |
| `Modal` | Header, scrollable body, footer (primary action last) |
| `ConfirmDialog` | Every destructive action; says exactly what happens |
| `DataTable` | Search, filters, sorting, pagination, loading / error / empty / no-results; stacked cards under 720px; `compactEmpty` for nested tables |
| `Alert` | info / success / warning / danger, optional actions |
| `EmptyState`, `Skeleton`, `SkeletonBlock` | Every data view has loading, empty and error states |
| `Page`, `Section` | Page header (title, description, actions) and plain sections — use a card only when content needs a boundary |
| `FullScreen`, `LoadingScreen` | Screens outside the shell: onboarding, invitation, 2FA required, auth callback |
| `Producer`, `ProducerKindBadge` | Who produced a change — shown wherever a change appears |
| `CommandPalette` | ⌘K / Ctrl+K |
| `toast` | `useToast()(text, 'ok' | 'bad')` |

## Layout

Sidebar (workspace switcher, grouped navigation from `src/nav.ts`, account menu with theme) +
content column (sticky top bar with breadcrumbs and search, then the page). Under 900px the
sidebar becomes a drawer opened from the top bar. Content max width 1120px.
