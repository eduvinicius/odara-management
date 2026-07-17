import { ToggleSwitch } from '../../components/shared/ToggleSwitch'
import { useToast } from '../../components/shared/Toast'
import { useToggleFeedbackFeatured } from '../../lib/mutations/feedbacks'
import type { FeedbackListItem } from '../../lib/queries/feedbacks'

/** Feedback shown when an inline featured toggle fails to save. */
const TOGGLE_FEATURED_ERROR_MESSAGE =
  'Não foi possível atualizar o destaque do depoimento. Tente novamente.'

type FeedbackFeaturedToggleProps = {
  /** The feedback row this toggle controls. */
  feedback: Pick<FeedbackListItem, 'id' | 'featured'>
}

/**
 * Inline featured toggle for a single feedback list row (Must 20).
 *
 * Owns its own `useToggleFeedbackFeatured` mutation instance so its pending
 * state is scoped to exactly this row — toggling one feedback's featured
 * status never shows another row as pending (Should 40). `checked` is driven
 * directly by `feedback.featured` from the `useFeedbacks` query cache rather
 * than local state: since this mutation never optimistically updates the
 * cache, a failed toggle simply leaves the query data (and therefore the
 * visible switch) unchanged, and a successful one is reflected once the
 * `['feedbacks']` invalidation refetches.
 */
export function FeedbackFeaturedToggle({ feedback }: FeedbackFeaturedToggleProps) {
  const toast = useToast()
  const { mutate, isPending } = useToggleFeedbackFeatured()

  function handleChange(value: boolean) {
    mutate(
      { id: feedback.id, value },
      {
        onError: () => {
          toast.error(TOGGLE_FEATURED_ERROR_MESSAGE)
        },
      },
    )
  }

  return (
    <ToggleSwitch
      checked={feedback.featured}
      onChange={handleChange}
      label="Destacado"
      hideLabel
      isPending={isPending}
    />
  )
}
