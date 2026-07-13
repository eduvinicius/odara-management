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
