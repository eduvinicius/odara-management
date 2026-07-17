import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { supabase } from '../supabase'

/** A minimal product shape for use in selectors, independent of active status. */
export type ProductOption = {
  id: string
  name: string
}

async function fetchProductOptions(): Promise<ProductOption[]> {
  const { data, error } = await supabase
    .from('Products')
    .select('id, name')
    .order('name', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}

/**
 * Fetches every product's `id` and `name`, ordered alphabetically, with no
 * filter on `active` — both active and inactive products are included
 * (Must 37) and this hook must never be narrowed to active-only (Must Not 48).
 *
 * Consumed by the feedback create/edit form's product selector, since an
 * admin may want to attach a testimonial to a product that has since been
 * deactivated.
 */
export function useProductOptions(): UseQueryResult<ProductOption[], Error> {
  return useQuery({
    queryKey: ['products', 'options'],
    queryFn: fetchProductOptions,
  })
}
