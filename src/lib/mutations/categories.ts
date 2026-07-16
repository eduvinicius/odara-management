import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query'
import { supabase } from '../supabase'
import type { Category } from '../queries/categories'

/** Postgres unique-violation error code, used to detect an `id` collision on create. */
const UNIQUE_VIOLATION_CODE = '23505'

/**
 * Input for `useCreateCategory`. `id` and `ord` are already computed by the
 * caller (see `lib/forms/categoryForm.ts`) — this mutation only persists
 * whatever it is given, it does not derive either value itself.
 */
export type CreateCategoryInput = {
  id: string
  label: string
  ord: number
}

async function createCategory(input: CreateCategoryInput): Promise<Category> {
  const { data, error } = await supabase
    .from('Categories')
    .insert({ id: input.id, label: input.label, ord: input.ord })
    .select('id, label, ord')
    .single()

  if (error) {
    // The form already checks for a slug collision against the categories
    // loaded at the time it was opened (Must 9), but that check can go stale
    // if another category was created concurrently. This surfaces the same
    // clear, conflict-naming message in that race-condition fallback case
    // instead of a raw Postgres constraint message.
    if (error.code === UNIQUE_VIOLATION_CODE) {
      throw new Error(`Já existe uma categoria com o identificador "${input.id}".`)
    }
    throw new Error(error.message)
  }

  return data
}

/**
 * Creates a new `Categories` row with a caller-supplied `id`, `label`, and
 * `ord` (Must 8, Must 10). Surfaces a clear, conflict-naming error (Must 9)
 * when the `id` already matches an existing category, whether caught by the
 * form's own pre-submit check or — as a fallback — by the database's unique
 * constraint on `id`.
 *
 * On success, invalidates the `['categories']` query cache so the category
 * list and every other `['categories', ...]`-keyed query (product count
 * list, product form's category selector, product list's category filter)
 * reflect the new category immediately.
 *
 * Consumed by the category creation page (Task 12), which is responsible for
 * showing a toast on success/error — this hook only exposes pending/error
 * state, it does not notify the admin itself.
 */
export function useCreateCategory(): UseMutationResult<Category, Error, CreateCategoryInput> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}
