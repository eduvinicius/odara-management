import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { FEEDBACK_COLUMNS, type Feedback } from '../queries/feedbacks'
import { deleteFeedbackImage, uploadFeedbackImage } from '../storage/feedbackImages'

/**
 * Input for `useCreateFeedback`. Deliberately typed with already-parsed,
 * ready-to-persist values rather than the raw feedback form values shape.
 *
 * Design decision: parsing/trimming `name`/`description` and resolving the
 * selected product into `product_id` is the CALLER's responsibility (Task
 * 12's feedback creation page), not this mutation's — the form already
 * validates these fields (see Task 2's form validation), so re-deriving them
 * here would duplicate that logic. This mutation only concerns itself with
 * I/O: uploading the optional image and persisting a row.
 */
export type CreateFeedbackInput = {
  name: string
  description: string
  product_id: string
  /** New image to upload, or `null` to create the feedback without one. */
  imageFile: File | null
}

async function createFeedback(input: CreateFeedbackInput): Promise<Feedback> {
  // The upload happens before the insert and is never wrapped in a try/catch
  // that swallows failures: if `uploadFeedbackImage` rejects, this function
  // rejects too and the `insert` below never runs, so no partial feedback row
  // is ever created (Must Not 47).
  const imageUrl = input.imageFile ? await uploadFeedbackImage(input.imageFile) : null

  const { data, error } = await supabase
    .from('Feedbacks')
    .insert({
      name: input.name,
      description: input.description,
      product_id: input.product_id,
      image_url: imageUrl,
      featured: false,
    })
    .select(FEEDBACK_COLUMNS)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

/**
 * Uploads the optional image (Must 9), then creates a new `Feedbacks` row
 * with the resulting public URL (Must 5). Aborts without inserting a row if
 * the image upload fails (Must Not 47) — see `createFeedback` above. New
 * feedbacks always start unfeatured; the admin toggles `featured` afterward
 * from the list (Must 20).
 *
 * On success, invalidates every `['feedbacks', ...]`-keyed query so the list
 * reflects the new feedback immediately.
 *
 * Consumed by the feedback creation page (Task 12), which is responsible for
 * parsing/validating the form values into a `CreateFeedbackInput` and for
 * showing a toast on success/error — this hook only exposes pending/error
 * state, it does not notify the admin itself.
 */
export function useCreateFeedback(): UseMutationResult<Feedback, Error, CreateFeedbackInput> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createFeedback,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedbacks'] })
    },
  })
}

/**
 * Input for `useUpdateFeedback`. Like `CreateFeedbackInput`, this is typed
 * with already-parsed, ready-to-persist values — parsing/trimming the raw
 * form values is the CALLER's responsibility (Task 13's feedback edit page).
 *
 * Image slot (mutually exclusive in intent, but `imageFile` always wins when
 * both are set):
 * - `imageFile` set -> upload it and replace the image (Must 13).
 * - `imageFile` null and `removeImage` true -> clear the image (Must 14).
 * - `imageFile` null and `removeImage` false -> keep `existingImageUrl`
 *   unchanged.
 */
export type UpdateFeedbackInput = {
  id: string
  name: string
  description: string
  product_id: string
  /** New image to upload, replacing the existing one. `null` = keep existing (unless `removeImage` is set). */
  imageFile: File | null
  /** `true` when the admin explicitly cleared the image with no replacement. Ignored when `imageFile` is set. */
  removeImage: boolean
  /** The feedback's image URL before this update, if any. Used to know what to delete from storage after a successful save. */
  existingImageUrl: string | null
}

/**
 * Result of `updateFeedback`/`useUpdateFeedback`. The DB write is what the
 * admin's edit actually consists of, so its success is the only thing this
 * mutation ever rejects over. The post-write storage cleanup (deleting a
 * now-orphaned replaced/removed image) is best-effort: if it fails, the
 * update still resolves successfully with `imageCleanupFailed: true` so the
 * caller can show a softer, distinct message instead of a hard failure toast
 * — the admin's edit was NOT lost.
 */
export type UpdateFeedbackResult = {
  feedback: Feedback
  /** `true` when the DB update succeeded but deleting the now-orphaned old image from storage afterward failed. The update itself did NOT fail. */
  imageCleanupFailed: boolean
}

async function updateFeedback(input: UpdateFeedbackInput): Promise<UpdateFeedbackResult> {
  // The upload happens before the update and is never wrapped in a try/catch
  // that swallows failures: if `uploadFeedbackImage` rejects, this function
  // rejects too and neither the DB update below nor any storage deletion of
  // the still-valid existing image ever runs (Must Not 47) — the old image
  // remains intact until a new save fully succeeds.
  const newImageUrl = input.imageFile ? await uploadFeedbackImage(input.imageFile) : null

  const finalImageUrl = newImageUrl ?? (input.removeImage ? null : input.existingImageUrl)

  const { data, error } = await supabase
    .from('Feedbacks')
    .update({
      name: input.name,
      description: input.description,
      product_id: input.product_id,
      image_url: finalImageUrl,
    })
    .eq('id', input.id)
    .select(FEEDBACK_COLUMNS)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  // Only reached after the DB update has committed, so a failed update never
  // leaves the row pointing at a file that was already deleted (Must Not
  // 47's counterpart on the delete side).
  const imageWasReplacedOrRemoved = newImageUrl !== null || input.removeImage

  // Storage cleanup is best-effort and intentionally isolated from the DB
  // write above: the update has already committed by this point, so a
  // cleanup failure here must NOT reject this function. If it did, the
  // caller's `catch` would show a hard "failed" error toast for an edit that
  // actually succeeded, and `onSuccess` would never invalidate the
  // `['feedbacks']` cache — leaving the admin looking at stale data and
  // possibly retrying an update that already went through.
  let imageCleanupFailed = false

  if (input.existingImageUrl !== null && imageWasReplacedOrRemoved) {
    try {
      await deleteFeedbackImage(input.existingImageUrl)
    } catch (cleanupError) {
      console.error('Failed to delete orphaned feedback image after update:', cleanupError)
      imageCleanupFailed = true
    }
  }

  return { feedback: data, imageCleanupFailed }
}

/**
 * Updates a feedback's `name` (Must 10), `description` (Must 11), and
 * `product_id` (Must 12), optionally uploading a replacement image (Must 13)
 * or clearing an existing one (Must 14).
 *
 * Order of operations (Must Not 47): the upload happens first and aborts the
 * whole operation on failure with nothing changed; the DB row is updated
 * next; only after that update succeeds is the now-orphaned old image
 * deleted from storage — see `updateFeedback` above.
 *
 * On success, invalidates every `['feedbacks', ...]`-keyed query so the list
 * and the specific `['feedbacks', id]` entry reflect the change immediately.
 *
 * Resolves with `imageCleanupFailed: true` (instead of rejecting) when the DB
 * update itself succeeded but the subsequent best-effort storage cleanup
 * failed, so a cleanup failure never masks a successful edit as a hard
 * failure — see the cleanup step in `updateFeedback` above.
 *
 * Consumed by the feedback edit page (Task 13), which is responsible for
 * parsing/validating the form values into an `UpdateFeedbackInput` and for
 * showing a toast on success/error — this hook only exposes pending/error
 * state, it does not notify the admin itself.
 */
export function useUpdateFeedback(): UseMutationResult<
  UpdateFeedbackResult,
  Error,
  UpdateFeedbackInput
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateFeedback,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['feedbacks'] })
      queryClient.invalidateQueries({ queryKey: ['feedbacks', result.feedback.id] })
    },
  })
}

/**
 * Input for `useDeleteFeedback`. Carries the feedback's `id` plus its
 * current `image_url`, so this mutation knows exactly which storage file to
 * clean up without needing a separate fetch (the caller — the delete
 * confirmation dialog, Task 9 — already has the full `Feedback`/
 * `FeedbackListItem` row loaded from the list).
 */
export type DeleteFeedbackInput = Pick<Feedback, 'id' | 'image_url'>

/**
 * Result of `deleteFeedback`/`useDeleteFeedback`. The DB row delete is what
 * Must 15 (permanent row removal) actually requires, so its success is the
 * only thing this mutation ever rejects over. The post-delete storage
 * cleanup (Must 19, removing the now-unreferenced image) is best-effort: if
 * it fails, the delete still resolves successfully with
 * `imageCleanupFailed: true` instead of rejecting (Must Not 46), so the
 * caller can show a softer, distinct message (Should 39) instead of a hard
 * failure toast — the row was NOT left in place.
 */
export type DeleteFeedbackResult = {
  /** `true` when the DB delete succeeded but removing its image from storage afterward failed. The delete itself did NOT fail. */
  imageCleanupFailed: boolean
}

async function deleteFeedback(input: DeleteFeedbackInput): Promise<DeleteFeedbackResult> {
  // Order of operations: the DB row is deleted FIRST, storage cleanup
  // SECOND. This is the opposite order from `updateFeedback` above, and is
  // deliberate:
  //
  // - Must Not 46 is the strongest safety constraint on *delete*
  //   specifically: a successful row deletion must never be blocked or
  //   reversed because image cleanup fails. Deleting the row first means: if
  //   the row delete itself fails, nothing has happened yet (safe,
  //   retryable) — no files were touched, and this function rejects so the
  //   caller shows a hard failure and the feedback stays in the list.
  // - Deleting storage first would risk the reverse: the file gone, but the
  //   feedback row still exists and still references it if the DB delete
  //   then fails — a worse, more visible admin-facing failure (a broken
  //   image on a feedback that's supposedly still there).
  const { error } = await supabase.from('Feedbacks').delete().eq('id', input.id)

  if (error) {
    throw new Error(error.message)
  }

  // Storage cleanup is best-effort and intentionally isolated from the DB
  // delete above: the row is already gone by this point (Must 15 is
  // satisfied), so a cleanup failure here must NOT reject this function. If
  // it did, the caller's `catch` would show a hard "failed" error toast for a
  // delete that actually succeeded, `onSuccess` would never invalidate the
  // `['feedbacks']` cache, and the admin could re-attempt a delete on a
  // feedback that's already gone (Must Not 46). The only downside of
  // swallowing this error is a temporarily orphaned file in storage, which is
  // a lesser failure than misleading the admin about whether their deletion
  // worked.
  let imageCleanupFailed = false

  if (input.image_url !== null) {
    try {
      await deleteFeedbackImage(input.image_url)
    } catch (cleanupError) {
      console.error('Failed to delete feedback image after row delete:', cleanupError)
      imageCleanupFailed = true
    }
  }

  return { imageCleanupFailed }
}

/**
 * Permanently deletes a feedback row from the `Feedbacks` table by `id`
 * (Must 15), then removes its associated image, if any, from the
 * "Feedbacks" storage bucket (Must 19). See `deleteFeedback` above for the
 * DB-row-first ordering rationale that satisfies Must Not 46.
 *
 * On success, invalidates every `['feedbacks', ...]`-keyed query so the list
 * stops showing the deleted feedback immediately — this happens whenever the
 * DB row delete succeeded, even if the follow-up storage cleanup failed (see
 * `deleteFeedback` above: that resolves with `imageCleanupFailed: true`
 * rather than rejecting).
 *
 * Consumed by the feedback delete confirmation dialog (Task 9), which shows
 * a `<ConfirmDialog>` before calling this mutation and picks between a full
 * success toast, a softer "deleted but image cleanup failed" toast (Should
 * 39, keyed off `imageCleanupFailed`), or a hard error toast (when this
 * mutation rejects) — this hook only exposes pending/error state and the
 * resolved `imageCleanupFailed` flag, it does not notify the admin itself.
 */
export function useDeleteFeedback(): UseMutationResult<
  DeleteFeedbackResult,
  Error,
  DeleteFeedbackInput
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteFeedback,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['feedbacks'] })
      queryClient.invalidateQueries({ queryKey: ['feedbacks', variables.id] })
    },
  })
}

/** Input for `useToggleFeedbackFeatured`. */
export type ToggleFeedbackFeaturedInput = {
  id: string
  value: boolean
}

async function toggleFeedbackFeatured(input: ToggleFeedbackFeaturedInput): Promise<void> {
  const { error } = await supabase
    .from('Feedbacks')
    .update({ featured: input.value })
    .eq('id', input.id)

  if (error) {
    throw new Error(error.message)
  }
}

/**
 * Flips the `featured` flag on a single feedback by `id` (Must 20), updating
 * only that column instead of the full feedback row.
 *
 * On success, invalidates every `['feedbacks', ...]`-keyed query so the list
 * reflects the new featured state immediately.
 *
 * Consumed by the feedback list's inline featured toggle (Task 8), which
 * scopes this mutation's pending/error state to the single row being
 * toggled (Should 40) and shows an error message on failure — this hook only
 * exposes pending/error state, it does not notify the admin itself.
 */
export function useToggleFeedbackFeatured(): UseMutationResult<
  void,
  Error,
  ToggleFeedbackFeaturedInput
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: toggleFeedbackFeatured,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedbacks'] })
    },
  })
}
