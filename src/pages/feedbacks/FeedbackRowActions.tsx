import { Link } from 'react-router-dom'
import { Pencil, Trash2 } from 'lucide-react'
import type { FeedbackListItem } from '../../lib/queries/feedbacks'

type FeedbackRowActionsProps = {
  /** The feedback row these actions apply to. */
  feedback: FeedbackListItem
  /** Called when the admin clicks delete, requesting the confirmation dialog for this feedback. */
  onDeleteRequest: (feedback: FeedbackListItem) => void
}

/**
 * Edit and delete actions for a single feedback list row. Delete never
 * removes anything itself — it only asks the parent list page to open the
 * shared `FeedbackDeleteDialog` for this feedback, keeping exactly one
 * delete confirmation open across the whole list at a time.
 */
export function FeedbackRowActions({ feedback, onDeleteRequest }: FeedbackRowActionsProps) {
  function handleDeleteClick() {
    onDeleteRequest(feedback)
  }

  return (
    <div className="flex items-center gap-4">
      <Link
        to={`/feedbacks/${feedback.id}/edit`}
        className="inline-flex items-center gap-1 text-sm font-medium"
        style={{ color: 'var(--text-gold)' }}
      >
        <Pencil aria-hidden="true" className="h-4 w-4" />
        Editar
      </Link>

      <button
        type="button"
        onClick={handleDeleteClick}
        aria-label={`Excluir depoimento de ${feedback.name}`}
        className="inline-flex cursor-pointer items-center gap-1 text-sm font-medium"
        style={{ color: 'var(--rose-400)' }}
      >
        <Trash2 aria-hidden="true" className="h-4 w-4" />
        Excluir
      </button>
    </div>
  )
}
