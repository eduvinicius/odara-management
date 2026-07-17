/** Public props for `Pagination`. */
export type PaginationProps = {
  /** Current page number, 1-indexed. */
  page: number
  /** Number of items shown per page. */
  pageSize: number
  /** Total number of items across all pages. */
  totalItems: number
  /** Called with the target page number when the admin navigates to it. */
  onPageChange: (page: number) => void
}
