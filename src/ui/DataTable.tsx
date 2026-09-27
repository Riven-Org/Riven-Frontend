import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState, type ReactNode } from 'react'

import { Button } from './Button'
import { EmptyState } from './EmptyState'
import { SearchInput } from './Field'
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  ICON_STROKE,
  Search,
} from './icons'
import { Skeleton } from './Skeleton'

export type Column<T> = {
  key: string
  header: string
  render: (row: T) => ReactNode
  /** Makes the column sortable. */
  sortValue?: (row: T) => string | number
  align?: 'left' | 'right'
  shrink?: boolean
  /** The main cell shown without a label on narrow screens. */
  main?: boolean
  hideLabelOnMobile?: boolean
  /** Row actions: pinned to the card's top-right corner on narrow screens. */
  actions?: boolean
}

type Empty = {
  icon: Parameters<typeof EmptyState>[0]['icon']
  title: string
  text?: ReactNode
  action?: ReactNode
}

/**
 * The app's one data table: toolbar (search + filters), sortable headers, hover rows, row
 * click, pagination, and built-in loading / error / empty / no-results states. On narrow
 * screens rows become stacked label–value cards.
 */
export function DataTable<T>({
  label,
  rows,
  columns,
  rowKey,
  loading = false,
  error,
  onRetry,
  empty,
  searchText,
  searchPlaceholder = 'Search',
  filters,
  pageSize = 10,
  onRowClick,
  toolbarEnd,
  compactEmpty = false,
}: {
  label: string
  rows: T[] | null
  columns: Column<T>[]
  rowKey: (row: T) => string
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  empty: Empty
  searchText?: (row: T) => string
  searchPlaceholder?: string
  filters?: ReactNode
  pageSize?: number
  onRowClick?: (row: T) => void
  toolbarEnd?: ReactNode
  /** One-line empty state, for tables nested inside a larger section. */
  compactEmpty?: boolean
}) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null)

  const filtered = useMemo(() => {
    if (!rows) return []
    const q = query.trim().toLowerCase()
    let out = q && searchText ? rows.filter((r) => searchText(r).toLowerCase().includes(q)) : rows
    const column = sort && columns.find((c) => c.key === sort.key)
    if (sort && column?.sortValue) {
      const value = column.sortValue
      out = [...out].sort(
        (a, b) => (value(a) > value(b) ? 1 : value(a) < value(b) ? -1 : 0) * sort.dir,
      )
    }
    return out
  }, [rows, query, searchText, sort, columns])

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const current = Math.min(page, pages - 1)
  const visible = filtered.slice(current * pageSize, current * pageSize + pageSize)
  const hasToolbar = Boolean(searchText || filters || toolbarEnd)
  const isEmpty = !loading && !error && rows !== null && rows.length === 0
  const noResults = !loading && !error && rows !== null && rows.length > 0 && filtered.length === 0

  function toggleSort(key: string) {
    setSort((s) => (s?.key !== key ? { key, dir: 1 } : s.dir === 1 ? { key, dir: -1 } : null))
  }

  return (
    <div className="stack">
      {hasToolbar && !isEmpty && (
        <div className="table-toolbar">
          {searchText && (
            <SearchInput
              value={query}
              onChange={(v) => {
                setQuery(v)
                setPage(0)
              }}
              placeholder={searchPlaceholder}
              label={`Search ${label}`}
            />
          )}
          {filters}
          <span style={{ flex: 1 }} />
          {toolbarEnd}
        </div>
      )}
      <div className="table-wrap">
        {error ? (
          <EmptyState
            icon={CircleAlert}
            title={`Couldn't load ${label}`}
            action={onRetry && <Button onClick={onRetry}>Try again</Button>}
          >
            {error}
          </EmptyState>
        ) : isEmpty && compactEmpty ? (
          <div className="table-empty-inline">
            <span>
              {empty.title}
              {empty.text ? <> · {empty.text}</> : null}
            </span>
            {empty.action}
          </div>
        ) : isEmpty ? (
          <EmptyState icon={empty.icon} title={empty.title} action={empty.action}>
            {empty.text}
          </EmptyState>
        ) : (
          <>
            <div className="table-scroll">
              <table
                className="table table--responsive"
                aria-label={label}
                aria-busy={loading || undefined}
              >
                <thead>
                  <tr>
                    {columns.map((c) => (
                      <th
                        key={c.key}
                        scope="col"
                        className={`${c.align === 'right' ? 'align-right' : ''} ${c.shrink ? 'shrink' : ''}`}
                        aria-sort={
                          sort?.key === c.key
                            ? sort.dir === 1
                              ? 'ascending'
                              : 'descending'
                            : undefined
                        }
                      >
                        {c.sortValue ? (
                          <button
                            className="btn btn--ghost btn--sm"
                            style={{ marginLeft: -8 }}
                            onClick={() => toggleSort(c.key)}
                          >
                            {c.header}
                            {sort?.key === c.key &&
                              (sort.dir === 1 ? (
                                <ArrowUp size={12} strokeWidth={ICON_STROKE} />
                              ) : (
                                <ArrowDown size={12} strokeWidth={ICON_STROKE} />
                              ))}
                          </button>
                        ) : (
                          c.header
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading || rows === null
                    ? Array.from({ length: 4 }, (_, i) => (
                        <tr key={`sk-${i}`}>
                          {columns.map((c, j) => (
                            <td key={c.key}>
                              <Skeleton width={j === 0 ? '70%' : '50%'} />
                            </td>
                          ))}
                        </tr>
                      ))
                    : null}
                  <AnimatePresence initial={false}>
                    {!loading &&
                      visible.map((row) => (
                        <motion.tr
                          key={rowKey(row)}
                          className={onRowClick ? 'is-clickable' : undefined}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0, transition: { duration: 0.12 } }}
                          transition={{ duration: 0.16 }}
                          onClick={onRowClick ? () => onRowClick(row) : undefined}
                        >
                          {columns.map((c) => (
                            <td
                              key={c.key}
                              data-label={
                                c.main || c.hideLabelOnMobile || c.actions ? undefined : c.header
                              }
                              className={`${c.main ? 'cell-main' : ''} ${c.actions ? 'cell-actions' : ''} ${c.align === 'right' ? 'align-right' : ''} ${c.shrink ? 'shrink' : ''}`}
                            >
                              {c.render(row)}
                            </td>
                          ))}
                        </motion.tr>
                      ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
            {noResults && (
              <EmptyState icon={Search} title="No matches">
                Nothing matches “{query}”. Try another search or clear the filters.
              </EmptyState>
            )}
            {filtered.length > pageSize && (
              <div className="pagination">
                <span>
                  {current * pageSize + 1}–{Math.min(filtered.length, (current + 1) * pageSize)} of{' '}
                  {filtered.length}
                </span>
                <div className="row">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={ChevronLeft}
                    aria-label="Previous page"
                    disabled={current === 0}
                    onClick={() => setPage(current - 1)}
                  />
                  <span>
                    Page {current + 1} of {pages}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={ChevronRight}
                    aria-label="Next page"
                    disabled={current >= pages - 1}
                    onClick={() => setPage(current + 1)}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
