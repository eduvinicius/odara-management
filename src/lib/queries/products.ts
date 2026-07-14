import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { supabase } from '../supabase'

export type BadgeTone = 'sale' | 'new' | 'gold' | 'neutral'

export type Product = {
  id: string
  name: string
  category_id: string
  price: number
  original_price: number | null
  image_url: string | null
  images: string[] | null
  featured: boolean
  badge_tone: BadgeTone | null
  badge_label: string | null
  active: boolean
  description: string | null
}

/** Number of products shown per page in the product list. */
export const PRODUCTS_PAGE_SIZE = 20

const PRODUCT_COLUMNS =
  'id, name, category_id, price, original_price, image_url, images, featured, badge_tone, badge_label, active, description'

export type UseProductsParams = {
  /** 1-based page number. Defaults to 1. */
  page?: number
  /** Case-insensitive partial match against `name`. Defaults to no filter. */
  search?: string
  /** Matches `category_id` exactly. Omit to include every category. */
  categoryId?: string
  /** Matches `active` exactly. Omit to include both active and inactive products. */
  active?: boolean
}

export type UseProductsResult = {
  data: Product[]
  totalCount: number
  totalPages: number
  isLoading: boolean
  isFetching: boolean
  isError: boolean
  error: Error | null
  refetch: UseQueryResult<FetchProductsResult, Error>['refetch']
}

type ResolvedParams = {
  page: number
  search: string
  categoryId?: string
  active?: boolean
}

type FetchProductsResult = {
  products: Product[]
  totalCount: number
}

async function fetchProducts(params: ResolvedParams): Promise<FetchProductsResult> {
  const { page, search, categoryId, active } = params
  const from = (page - 1) * PRODUCTS_PAGE_SIZE
  const to = from + PRODUCTS_PAGE_SIZE - 1

  let query = supabase.from('Products').select(PRODUCT_COLUMNS, { count: 'exact' })

  if (search.trim() !== '') {
    query = query.ilike('name', `%${search.trim()}%`)
  }

  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  if (active !== undefined) {
    query = query.eq('active', active)
  }

  // The `Products` table has no `created_at` column (confirmed against the
  // live schema), so "newest first" is approximated by sorting on `id`
  // descending — the closest available proxy for insertion order.
  const { data, error, count } = await query.order('id', { ascending: false }).range(from, to)

  if (error) {
    throw new Error(error.message)
  }

  return {
    products: data ?? [],
    totalCount: count ?? 0,
  }
}

/**
 * Fetches a page of products sorted newest-first, with optional name
 * search, category filter, and active-status filter.
 *
 * Consumed by the product list table (search/filter/pagination wiring) to
 * render 20 products per page along with the total count needed to
 * compute total pages for the shared Pagination component.
 */
export function useProducts(params: UseProductsParams = {}): UseProductsResult {
  const { page = 1, search = '', categoryId, active } = params

  const query = useQuery({
    queryKey: ['products', { page, search, categoryId, active }],
    queryFn: () => fetchProducts({ page, search, categoryId, active }),
  })

  const totalCount = query.data?.totalCount ?? 0

  return {
    data: query.data?.products ?? [],
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / PRODUCTS_PAGE_SIZE)),
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}

export type UseProductResult = {
  data: Product | null
  isLoading: boolean
  isFetching: boolean
  isError: boolean
  error: Error | null
  refetch: UseQueryResult<Product, Error>['refetch']
}

async function fetchProduct(id: string): Promise<Product> {
  const { data, error } = await supabase
    .from('Products')
    .select(PRODUCT_COLUMNS)
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

/**
 * Fetches a single product's full current data by `id`.
 *
 * Consumed by the product edit page to pre-fill the edit form with the
 * product's current values before the form is initialized.
 */
export function useProduct(id: string): UseProductResult {
  const query = useQuery({
    queryKey: ['products', id],
    queryFn: () => fetchProduct(id),
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
