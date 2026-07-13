import type { DataTableProps } from './dataTable.types'

/**
 * Generic table for admin list views (products, categories, feedbacks…).
 *
 * Renders a real `<table>` from md breakpoint upward, and a stacked card
 * list of label/value pairs below it, so no list ever requires horizontal
 * scrolling on narrow (375px) viewports. Empty-state, no-results, and
 * error-state messaging are the consuming page's responsibility — this
 * component only renders whatever `rows` it is given.
 */
export function DataTable<TRow>({ columns, rows, getRowId, caption }: DataTableProps<TRow>) {
  const mobileColumns = columns.filter((column) => !column.hideOnMobile)

  return (
    <div>
      <table className="hidden w-full border-collapse text-left md:table">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-soft)' }}>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`px-4 py-3 text-xs font-medium tracking-wide uppercase ${column.headerClassName ?? ''}`}
                style={{ color: 'var(--ink-500)' }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getRowId(row)} style={{ borderBottom: '1px solid var(--border-soft)' }}>
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`px-4 py-3 text-sm ${column.cellClassName ?? ''}`}
                  style={{ color: 'var(--ink-700)' }}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="flex flex-col gap-3 md:hidden">
        {rows.map((row) => (
          <li
            key={getRowId(row)}
            className="flex flex-col gap-2 rounded-md border p-4"
            style={{
              borderColor: 'var(--border-soft)',
              background: 'var(--surface-card)',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            {mobileColumns.map((column) => (
              <div key={column.key} className="flex items-center justify-between gap-3">
                <span
                  className={`text-xs font-medium tracking-wide uppercase ${column.headerClassName ?? ''}`}
                  style={{ color: 'var(--ink-500)' }}
                >
                  {column.header}
                </span>
                <span
                  className={`text-sm ${column.cellClassName ?? ''}`}
                  style={{ color: 'var(--ink-700)' }}
                >
                  {column.render(row)}
                </span>
              </div>
            ))}
          </li>
        ))}
      </ul>
    </div>
  )
}
