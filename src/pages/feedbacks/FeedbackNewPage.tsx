import { useNavigate } from 'react-router-dom'
import { useToast } from '../../components/shared/Toast'
import { createEmptyFeedbackFormValues } from '../../lib/forms/feedbackForm'
import type { FeedbackFormValues } from '../../lib/forms/feedbackForm'
import { useCreateFeedback } from '../../lib/mutations/feedbacks'
import type { CreateFeedbackInput } from '../../lib/mutations/feedbacks'
import { FeedbackForm } from './FeedbackForm'

/** Shown when creating a feedback fails, regardless of the underlying cause. */
const CREATE_ERROR_MESSAGE = 'Não foi possível criar o depoimento. Tente novamente.'

/**
 * Parses the form's UI-only shape into the mutation's typed input.
 * `existingImageUrl`/`removeExistingImage` are irrelevant in create mode —
 * there is no existing image yet — so only `imageFile` is carried over.
 */
function toCreateFeedbackInput(values: FeedbackFormValues): CreateFeedbackInput {
  return {
    name: values.name,
    description: values.description,
    product_id: values.product_id,
    imageFile: values.imageFile,
  }
}

/**
 * Feedback creation page (Task 12). Renders `FeedbackForm` in create mode,
 * seeded from `createEmptyFeedbackFormValues()` (Must 5), and wires its
 * `onSubmit` to `useCreateFeedback`.
 *
 * On success: shows a success toast and redirects back to the feedback list
 * (Must 25).
 *
 * On failure: shows an error toast (Must 28) and stays on this page with the
 * form's entered values intact, so the admin can fix the issue and retry
 * (Must 29) — no partial feedback is ever left behind, since
 * `useCreateFeedback` uploads the image before inserting and aborts the
 * whole operation if the upload fails.
 */
export function FeedbackNewPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const createMutation = useCreateFeedback()

  async function handleSubmit(values: FeedbackFormValues): Promise<void> {
    try {
      await createMutation.mutateAsync(toCreateFeedbackInput(values))
      toast.success('Depoimento criado com sucesso.')
      navigate('/feedbacks')
    } catch {
      toast.error(CREATE_ERROR_MESSAGE)
    }
  }

  return (
    <FeedbackForm
      title="Novo Depoimento"
      initialValues={createEmptyFeedbackFormValues()}
      onSubmit={handleSubmit}
      isSubmitting={createMutation.isPending}
      submitLabel="Criar depoimento"
    />
  )
}
