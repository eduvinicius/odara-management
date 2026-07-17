import type { ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { useToast } from '../../components/shared/Toast'
import { Spinner } from '../../components/ui/Spinner'
import { toFeedbackFormValues } from '../../lib/forms/feedbackForm'
import type { FeedbackFormValues } from '../../lib/forms/feedbackForm'
import { useUpdateFeedback } from '../../lib/mutations/feedbacks'
import type { UpdateFeedbackInput } from '../../lib/mutations/feedbacks'
import { useFeedback } from '../../lib/queries/feedbacks'
import { FEEDBACK_FORM_PAGE_PADDING_CLASS, FeedbackForm } from './FeedbackForm'

/** Shown when updating a feedback fails, regardless of the underlying cause (Must 28). */
const UPDATE_ERROR_MESSAGE = 'Não foi possível salvar as alterações do depoimento. Tente novamente.'

/** Shown when the feedback itself saved successfully (Must 26). */
const UPDATE_SUCCESS_MESSAGE = 'Depoimento atualizado com sucesso.'

/**
 * Shown when the feedback saved successfully but the best-effort cleanup of
 * the now-orphaned old image in storage failed afterward — the edit was NOT
 * lost, so this is a softer, non-blocking notice rather than an error.
 */
const UPDATE_SUCCESS_CLEANUP_FAILED_MESSAGE =
  'Depoimento atualizado, mas houve uma falha ao limpar a imagem antiga.'

/**
 * Maps the form's UI-only shape back into `useUpdateFeedback`'s typed input.
 * `removeImage`/`existingImageUrl` translate directly from the form's image
 * slot fields (`removeExistingImage`/`existingImageUrl`), which
 * `FeedbackForm`/`FeedbackImageField` keep mutually exclusive with
 * `imageFile` (Must 13, Must 14).
 */
function toUpdateFeedbackInput(id: string, values: FeedbackFormValues): UpdateFeedbackInput {
  return {
    id,
    name: values.name,
    description: values.description,
    product_id: values.product_id,
    imageFile: values.imageFile,
    removeImage: values.removeExistingImage,
    existingImageUrl: values.existingImageUrl,
  }
}

function PageHeading() {
  return (
    <h1
      className="mb-6"
      style={{
        fontFamily: 'var(--font-cormorant)',
        color: 'var(--ink-900)',
        fontSize: '1.75rem',
      }}
    >
      Editar Depoimento
    </h1>
  )
}

type FeedbackLoadStatusProps = {
  message: string
  children?: ReactNode
}

/** Shared centered panel for the loading and error/not-found states of the feedback fetch, styled consistently with `ProductEditPage`'s/`CategoryEditPage`'s equivalent states. */
function FeedbackLoadStatus({ message, children }: FeedbackLoadStatusProps) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 rounded-md px-6 py-16 text-center"
      style={{ background: 'var(--surface-card)', boxShadow: 'var(--shadow-xs)' }}
    >
      {children}
      <p className="text-sm" style={{ color: 'var(--ink-700)' }}>
        {message}
      </p>
      <Link
        to="/feedbacks"
        className="inline-flex items-center gap-2 rounded-pill px-5 text-sm font-medium"
        style={{
          height: 'var(--control-h-sm)',
          border: '1px solid var(--border-soft)',
          color: 'var(--ink-700)',
          background: 'var(--surface-raised)',
          transition: 'opacity var(--dur-fast) var(--ease-out)',
        }}
      >
        Voltar para depoimentos
      </Link>
    </div>
  )
}

/**
 * Feedback edit page (Task 13). Loads the feedback identified by the `:id`
 * route param via `useFeedback` (Task 4), waits for it to resolve before
 * mounting `FeedbackForm` (TanStack Form only reads `defaultValues` on
 * mount), and wires the form's `onSubmit` to `useUpdateFeedback` (Task 5).
 *
 * Pre-fills the form with the feedback's current name, description, product
 * association, and image (Must 10, Must 11, Must 12, Must 13, Must 14) via
 * `toFeedbackFormValues`.
 *
 * On success: shows a success toast (Must 26) and redirects back to the
 * feedback list. If the DB write succeeded but the mutation's best-effort
 * image cleanup failed, a softer success toast is shown instead — the edit
 * itself is never presented as a failure just because leftover storage
 * cleanup didn't run.
 *
 * On failure: shows an error toast (Must 28) and stays on this page with the
 * form's entered values intact — no navigation happens (Must 29), since
 * `useUpdateFeedback` uploads a replacement image and only updates the
 * database row after the upload succeeds, aborting before any write if the
 * upload fails.
 */
export function FeedbackEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const feedbackQuery = useFeedback(id ?? '')
  const updateMutation = useUpdateFeedback()

  async function handleSubmit(values: FeedbackFormValues): Promise<void> {
    if (!id) return

    try {
      const result = await updateMutation.mutateAsync(toUpdateFeedbackInput(id, values))
      toast.success(
        result.imageCleanupFailed ? UPDATE_SUCCESS_CLEANUP_FAILED_MESSAGE : UPDATE_SUCCESS_MESSAGE,
      )
      navigate('/feedbacks')
    } catch {
      toast.error(UPDATE_ERROR_MESSAGE)
    }
  }

  if (!id) {
    return (
      <div className={FEEDBACK_FORM_PAGE_PADDING_CLASS}>
        <PageHeading />
        <FeedbackLoadStatus message="Depoimento não encontrado.">
          <AlertTriangle aria-hidden="true" className="h-8 w-8" style={{ color: 'var(--rose-400)' }} />
        </FeedbackLoadStatus>
      </div>
    )
  }

  if (feedbackQuery.isLoading) {
    return (
      <div className={FEEDBACK_FORM_PAGE_PADDING_CLASS}>
        <PageHeading />
        <FeedbackLoadStatus message="Carregando depoimento…">
          <Spinner className="h-6 w-6" />
        </FeedbackLoadStatus>
      </div>
    )
  }

  if (feedbackQuery.isError || feedbackQuery.data === null) {
    return (
      <div className={FEEDBACK_FORM_PAGE_PADDING_CLASS}>
        <PageHeading />
        <FeedbackLoadStatus
          message={
            feedbackQuery.isError
              ? 'Não foi possível carregar o depoimento. Tente novamente.'
              : 'Depoimento não encontrado.'
          }
        >
          <AlertTriangle aria-hidden="true" className="h-8 w-8" style={{ color: 'var(--rose-400)' }} />
        </FeedbackLoadStatus>
      </div>
    )
  }

  return (
    <FeedbackForm
      title="Editar Depoimento"
      initialValues={toFeedbackFormValues(feedbackQuery.data)}
      onSubmit={handleSubmit}
      isSubmitting={updateMutation.isPending}
      submitLabel="Salvar alterações"
    />
  )
}
