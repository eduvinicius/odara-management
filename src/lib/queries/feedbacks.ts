import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { supabase } from '../supabase'

export type Feedback = {
  id: string
  /** Nullable at the database level, even though this admin flow always requires it (spec Data Shape). */
  product_id: string | null
  name: string
  description: string
  image_url: string | null
  featured: boolean
  created_at: string
}

/** Number of feedbacks shown per page in the feedback list (Must 38). */
export const FEEDBACKS_PAGE_SIZE = 20

/**
 * Exported so `lib/mutations/feedbacks.ts` can request the exact same column
 * shape back from `insert(...).select(FEEDBACK_COLUMNS)` /
 * `update(...).select(FEEDBACK_COLUMNS)`, keeping the row returned by a
 * create/update mutation identical to what `useFeedback` fetches.
 */
export const FEEDBACK_COLUMNS = 'id, product_id, name, description, image_url, featured, created_at'

/** The linked product's display fields, embedded via the `product_id` foreign key. */
export type FeedbackListProduct = {
  id: string
  name: string
}

/**
 * A feedback row as shown in the list view, with its linked product name
 * embedded (Must 2). `product` is `null` when `product_id` is unset or no
 * longer resolves to an existing product row.
 */
export type FeedbackListItem = Feedback & {
  product: FeedbackListProduct | null
}

export type UseFeedbacksParams = {
  /** 1-based page number. Defaults to 1. */
  page?: number
  /** Matches `featured` exactly. Omit to include both featured and non-featured feedbacks. */
  featured?: boolean
}

export type UseFeedbacksResult = {
  data: FeedbackListItem[]
  totalCount: number
  totalPages: number
  isLoading: boolean
  isFetching: boolean
  isError: boolean
  error: Error | null
  refetch: UseQueryResult<FetchFeedbacksResult, Error>['refetch']
}

type ResolvedParams = {
  page: number
  featured?: boolean
}

type FetchFeedbacksResult = {
  feedbacks: FeedbackListItem[]
  totalCount: number
}

/**
 * Shape returned by the `product:Products(id, name)` embed. `Feedbacks` is
 * the "many" side of the `product_id` foreign key (many feedbacks per
 * product), so PostgREST embeds `Products` as a single object (or `null`
 * when `product_id` is unset or no longer resolves), not an array — arrays
 * are only returned when the "one" side embeds the "many" side.
 */
type RawFeedbackListRow = Feedback & {
  product: FeedbackListProduct | null
}

async function fetchFeedbacks(params: ResolvedParams): Promise<FetchFeedbacksResult> {
  const { page, featured } = params
  const from = (page - 1) * FEEDBACKS_PAGE_SIZE
  const to = from + FEEDBACKS_PAGE_SIZE - 1

  let query = supabase
    .from('Feedbacks')
    .select(`${FEEDBACK_COLUMNS}, product:Products(id, name)`, { count: 'exact' })

  if (featured !== undefined) {
    query = query.eq('featured', featured)
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to)
    .returns<RawFeedbackListRow[]>()

  if (error) {
    throw new Error(error.message)
  }

  return {
    feedbacks: (data ?? []).map((row) => ({
      ...row,
      product: row.product ?? null,
    })),
    totalCount: count ?? 0,
  }
}

/**
 * Fetches a page of feedbacks sorted newest-first (Must 4), with each row's
 * linked product name embedded (Must 2) and an optional exact-match filter
 * on `featured` (Must 3).
 *
 * Consumed by the feedback list page (Task 10) to render 20 feedbacks per
 * page (Must 1, Must 38) along with the total count needed to compute total
 * pages for the shared Pagination component.
 */
export function useFeedbacks(params: UseFeedbacksParams = {}): UseFeedbacksResult {
  const { page = 1, featured } = params

  const query = useQuery({
    queryKey: ['feedbacks', { page, featured }],
    queryFn: () => fetchFeedbacks({ page, featured }),
  })

  const totalCount = query.data?.totalCount ?? 0

  return {
    data: query.data?.feedbacks ?? [],
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / FEEDBACKS_PAGE_SIZE)),
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}

export type UseFeedbackResult = {
  data: Feedback | null
  isLoading: boolean
  isFetching: boolean
  isError: boolean
  error: Error | null
  refetch: UseQueryResult<Feedback, Error>['refetch']
}

async function fetchFeedback(id: string): Promise<Feedback> {
  const { data, error } = await supabase
    .from('Feedbacks')
    .select(FEEDBACK_COLUMNS)
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

/**
 * Fetches a single feedback's full current data by `id`, without the
 * `product` embed used by the list (the edit form only needs the raw
 * `product_id` to preselect an option in its own product selector, sourced
 * separately from `lib/queries/products.ts`'s product options hook).
 *
 * Consumed by the feedback edit page to pre-fill the edit form with the
 * feedback's current values before the form is initialized.
 */
export function useFeedback(id: string): UseFeedbackResult {
  const query = useQuery({
    queryKey: ['feedbacks', id],
    queryFn: () => fetchFeedback(id),
    enabled: id !== '',
  })

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}
