import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query'
import { supabase } from '../supabase'

/** Boolean product columns that can be flipped independently of a full edit. */
export type ToggleableProductField = 'active' | 'featured'

export type ToggleProductFieldInput = {
  id: string
  field: ToggleableProductField
  value: boolean
}

async function toggleProductField({ id, field, value }: ToggleProductFieldInput): Promise<void> {
  const patch = field === 'active' ? { active: value } : { featured: value }

  const { error } = await supabase.from('Products').update(patch).eq('id', id)

  if (error) {
    throw new Error(error.message)
  }
}

/**
 * Flips a single boolean field (`active` or `featured`) on a product by
 * `id`, updating only that column instead of the full product row.
 *
 * Consumed by the product list's inline active/featured toggles so the
 * admin can change either status directly from the list without opening
 * the full edit form.
 */
export function useToggleProductField(): UseMutationResult<
  void,
  Error,
  ToggleProductFieldInput
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: toggleProductField,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
