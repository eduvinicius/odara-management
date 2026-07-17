import { useState } from 'react'
import { RotateCcw, X } from 'lucide-react'
import { useObjectUrl } from '../../../hooks/useObjectUrl'
import { validateFeedbackImage } from '../../../lib/storage/feedbackImages'
import { FileField } from '../FileField'
import { FEEDBACK_IMAGE_ACCEPTED_MIME_TYPES } from './feedbackImageField.data'
import type { FeedbackImageFieldProps } from './feedbackImageField.types'

/**
 * Single-image upload control for the feedback form (Must 9, Must 13, Must
 * 14, Should 42). Previews a newly selected file, or the feedback's existing
 * image (edit mode) while no new file has been picked, validates every
 * candidate file client-side via `validateFeedbackImage` (Must 23, Must 24)
 * before accepting it into form state, lets the admin cancel a pending
 * selection to revert to the existing image, and — since the image is
 * optional here, unlike the product cover — exposes a further, explicit
 * control to remove the existing image entirely with no replacement.
 *
 * That removal control is what makes this component distinct from
 * `CoverImageField`: it must communicate three mutually exclusive states to
 * the parent form/mutation — no change (`file: null`, `removed: false`), a
 * new file pending upload (`file` non-null), and an explicit request to
 * clear the existing image (`removed: true`, `file: null`) — rather than
 * just the first two. The removed/undo affordance mirrors
 * `GalleryImageField`'s existing-image removal toggle (dim the image, badge
 * it "Removida", offer an undo button) since that is this codebase's closest
 * precedent for flagging an existing image for removal without immediately
 * discarding it from view.
 *
 * A standalone component (not a `form.Field` render-prop consumer) because
 * it manages two related `FeedbackFormValues` slots (`imageFile` for writes,
 * `removeExistingImage` for the removal flag) plus the read-only
 * `existingImageUrl` — the parent form (Task 11) wires all three via its own
 * `form.Field`s and passes their values/setters down as plain props.
 *
 * Uploading `file`, or deleting the existing image when `removed` is true,
 * against Supabase Storage on save is handled by the create/update
 * mutations (Task 5), not here.
 */
export function FeedbackImageField({
  id,
  label = 'Imagem do depoimento',
  file,
  existingUrl,
  removed,
  onChange,
  onRemovedChange,
  onBlur,
  disabled = false,
}: FeedbackImageFieldProps) {
  const [validationError, setValidationError] = useState<string | undefined>(undefined)
  const newFilePreviewUrl = useObjectUrl(file)
  const previewUrl = newFilePreviewUrl ?? existingUrl
  const isRemoved = !file && removed && existingUrl !== null

  function handleFilesSelected(fileList: FileList | null) {
    const candidate = fileList?.[0]
    if (!candidate) return

    const result = validateFeedbackImage(candidate)
    if (!result.valid) {
      setValidationError(result.reason)
      return
    }

    setValidationError(undefined)
    onChange(candidate)

    // A newly selected replacement supersedes any pending "remove existing
    // image" request, so the two never linger as a contradictory pair.
    if (removed) {
      onRemovedChange(false)
    }
  }

  function handleCancelNewFile() {
    setValidationError(undefined)
    onChange(null)
  }

  function handleToggleRemoval() {
    onRemovedChange(!isRemoved)
  }

  return (
    <div className="flex flex-col gap-2">
      {previewUrl && (
        <div className="relative w-fit">
          <img
            src={previewUrl}
            alt="Pré-visualização da imagem do depoimento"
            className="h-32 w-32 rounded-sm object-cover"
            style={{
              border: '1px solid var(--border-soft)',
              opacity: isRemoved ? 0.4 : 1,
            }}
          />

          {isRemoved && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-1 bottom-1 rounded-pill px-2 py-0.5 text-center text-2xs font-medium"
              style={{ background: 'var(--rose-400)', color: 'var(--white)' }}
            >
              Removida
            </span>
          )}

          {file && (
            <button
              type="button"
              onClick={handleCancelNewFile}
              disabled={disabled}
              aria-label="Cancelar nova imagem selecionada"
              className="absolute -right-2 -top-2 inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-circle disabled:cursor-not-allowed"
              style={{ background: 'var(--rose-400)', color: 'var(--white)', boxShadow: 'var(--shadow-sm)' }}
            >
              <X aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
          )}

          {!file && existingUrl && (
            <button
              type="button"
              onClick={handleToggleRemoval}
              disabled={disabled}
              aria-label={
                isRemoved
                  ? 'Desfazer remoção da imagem do depoimento'
                  : 'Remover imagem do depoimento'
              }
              className="absolute -right-2 -top-2 inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-circle disabled:cursor-not-allowed"
              style={{
                background: isRemoved ? 'var(--emerald-500)' : 'var(--rose-400)',
                color: 'var(--white)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {isRemoved ? (
                <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
              ) : (
                <X aria-hidden="true" className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>
      )}

      <FileField
        id={id}
        label={label}
        accept={FEEDBACK_IMAGE_ACCEPTED_MIME_TYPES}
        onChange={handleFilesSelected}
        onBlur={onBlur}
        disabled={disabled}
        error={validationError}
        hint="JPG, PNG ou WebP, até 5MB."
      />
    </div>
  )
}
