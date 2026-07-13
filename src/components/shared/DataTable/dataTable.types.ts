import type { ReactNode } from 'react'

/** A single column definition for `DataTable`. */
export type DataTableColumn<TRow> = {
  /** Unique key for the column; used as the React key and mobile label. */
  key: string
  /** Header text shown in the desktop table header row and as the mobile label. */
  header: string
  /** Renders this column's cell content for a given row. */
  render: (row: TRow) => ReactNode
  /** Optional extra classes applied to the desktop `<th>` and mobile label. */
  headerClassName?: string
  /** Optional extra classes applied to the desktop `<td>` and mobile value. */
  cellClassName?: string
  /** Omits this column from the stacked mobile layout (still shown in the desktop table). */
  hideOnMobile?: boolean
}

/** Public props for `DataTable`. */
export type DataTableProps<TRow> = {
  /** Column definitions, rendered left-to-right in the desktop table. */
  columns: Array<DataTableColumn<TRow>>
  /** Rows to render. */
  rows: TRow[]
  /** Returns a stable, unique identifier for a row; used as the React key. */
  getRowId: (row: TRow) => string
  /** Visually hidden table caption read by assistive technology. */
  caption: string
}
