import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { supabase } from '../supabase'

export type Category = {
  id: string
  label: string
  ord: number
}

async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('Categories')
    .select('id, label, ord')
    .order('ord', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}

/**
 * Fetches all categories ordered by `ord` ascending.
 *
 * Reused by the product list's category filter, the product form's
 * category selector, and empty-categories gating.
 */
export function useCategories(): UseQueryResult<Category[], Error> {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  })
}

/** A category together with how many `Products` rows currently reference it. */
export type CategoryWithProductCount = Category & {
  productCount: number
}

async function fetchCategoriesWithProductCounts(): Promise<CategoryWithProductCount[]> {
  // `ord` is the primary sort key (Must 2); `id` is a stable secondary
  // tie-break (Should 28) so categories that happen to share an `ord` value
  // never appear to shuffle order between loads.
  const [categoriesResult, productsResult] = await Promise.all([
    supabase
      .from('Categories')
      .select('id, label, ord')
      .order('ord', { ascending: true })
      .order('id', { ascending: true }),
    supabase.from('Products').select('category_id'),
  ])

  if (categoriesResult.error) {
    throw new Error(categoriesResult.error.message)
  }

  if (productsResult.error) {
    throw new Error(productsResult.error.message)
  }

  const productCountByCategoryId = new Map<string, number>()
  for (const product of productsResult.data ?? []) {
    const current = productCountByCategoryId.get(product.category_id) ?? 0
    productCountByCategoryId.set(product.category_id, current + 1)
  }

  return (categoriesResult.data ?? []).map((category) => ({
    ...category,
    productCount: productCountByCategoryId.get(category.id) ?? 0,
  }))
}

/**
 * Fetches all categories ordered by `ord` ascending (with `id` as a stable
 * secondary tie-break), together with the number of `Products` rows
 * currently referencing each one.
 *
 * Consumed by the category list page (product count column and the
 * zero-products visual distinction), the row delete-eligibility gating
 * (Must 14/15), and — via its `ord` values — the create form's next-`ord`
 * computation.
 *
 * Shares the `['categories', ...]` query key prefix with `useCategories` so
 * a single `queryClient.invalidateQueries({ queryKey: ['categories'] })`
 * after any category mutation refreshes both.
 */
export function useCategoriesWithProductCounts(): UseQueryResult<CategoryWithProductCount[], Error> {
  return useQuery({
    queryKey: ['categories', 'withProductCounts'],
    queryFn: fetchCategoriesWithProductCounts,
  })
}
