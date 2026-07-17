import { ConfirmDialog } from '../../components/shared/ConfirmDialog'
import { useToast } from '../../components/shared/Toast'
import { useDeleteFeedback } from '../../lib/mutations/feedbacks'
import type { Feedback } from '../../lib/queries/feedbacks'

/** Shown when the feedback row delete itself fails, regardless of the underlying cause. */
const DELETE_ERROR_MESSAGE = 'Não foi possível excluir o depoimento. Tente novamente.'

/**
 * Builds the success toast message for a completed delete. When the DB row
 * delete succeeded but the mutation's best-effort image cleanup failed
 * afterward, a softer variant is shown instead — the feedback IS gone either
 * way (Must Not 46), so this is never presented as a hard failure (Should 39).
 */
function buildDeleteSuccessMessage(feedbackName: string, imageCleanupFailed: boolean): string {
  return imageCleanupFailed
    ? `O depoimento de "${feedbackName}" foi excluído, mas houve uma falha ao remover sua imagem do armazenamento.`
    : `O depoimento de "${feedbackName}" foi excluído com sucesso.`
}

type FeedbackDeleteDialogProps = {
  /** The feedback pending deletion, or `null` when no delete is in progress (dialog closed). */
  feedback: Feedback | null
  /** Called once the dialog should close — after a successful delete, a failed delete, or a cancel. */
  onClose: () => void
}

/**
 * Confirmation dialog for the feedback list's per-row delete action.
 *
 * Owns its own `useDeleteFeedback` mutation instance so exactly one delete
 * can be in flight at a time (the list only ever renders one `feedback`,
 * tracked by the parent list page). Since `useDeleteFeedback` only
 * invalidates the `['feedbacks']` cache on success (the row delete itself
 * succeeding), a failed row delete leaves the list — and the feedback being
 * deleted — untouched; the dialog closes either way so the admin always sees
 * the resulting toast.
 */
export function FeedbackDeleteDialog({ feedback, onClose }: FeedbackDeleteDialogProps) {
  const toast = useToast()
  const { mutate, isPending } = useDeleteFeedback()

  function handleConfirm() {
    if (!feedback) return

    mutate(
      { id: feedback.id, image_url: feedback.image_url },
      {
        onSuccess: (result) => {
          onClose()
          toast.success(buildDeleteSuccessMessage(feedback.name, result.imageCleanupFailed))
        },
        onError: () => {
          onClose()
          toast.error(DELETE_ERROR_MESSAGE)
        },
      },
    )
  }

  return (
    <ConfirmDialog
      isOpen={feedback !== null}
      title={`Excluir depoimento de "${feedback?.name ?? ''}"?`}
      message="Esta ação é permanente e não pode ser desfeita: o depoimento e sua imagem (se houver) serão removidos definitivamente do armazenamento."
      confirmLabel="Excluir"
      isConfirming={isPending}
      onConfirm={handleConfirm}
      onCancel={onClose}
    />
  )
}
