import { useState } from 'react'
import { X } from 'lucide-react'
import { useObjectUrl } from '../../../hooks/useObjectUrl'
import { validateProductImage } from '../../../lib/storage/productImages'
import { FileField } from '../FileField'
import { COVER_IMAGE_ACCEPTED_MIME_TYPES } from './coverImageField.data'
import type { CoverImageFieldProps } from './coverImageField.types'

/**
 * Cover image upload control for the product form (Must 28). Shows a
 * preview of the newly selected file, or the product's existing cover
 * (edit mode) while no new file has been picked, validates every candidate
 * file client-side via `validateProductImage` (Must 30, Must 31) before
 * accepting it into form state, and lets the admin clear a pending
 * selection to revert to the existing cover.
 *
 * A standalone component (not a `form.Field` render-prop consumer) because
 * it manages two related `ProductFormValues` slots (`coverImageFile` for
 * writes, `existingCoverImageUrl` for read-only preview) — the parent form
 * (Task 21) wires both via its own `form.Field`s and passes their values/
 * setters down as plain props.
 *
 * Uploading `file` to Supabase Storage on save is handled by the create/
 * update mutations (Tasks 11-12), not here.
 */
export function CoverImageField({
  id,
  label = 'Imagem de capa',
  file,
  existingUrl,
  onChange,
  onBlur,
  disabled = false,
}: CoverImageFieldProps) {
  const [validationError, setValidationError] = useState<string | undefined>(undefined)
  const newFilePreviewUrl = useObjectUrl(file)
  const previewUrl = newFilePreviewUrl ?? existingUrl

  function handleFilesSelected(fileList: FileList | null) {
    const candidate = fileList?.[0]
    if (!candidate) return

    const result = validateProductImage(candidate)
    if (!result.valid) {
      setValidationError(result.reason)
      return
    }

    setValidationError(undefined)
    onChange(candidate)
  }

  function handleClearClick() {
    setValidationError(undefined)
    onChange(null)
  }

  return (
    <div className="flex flex-col gap-2">
      {previewUrl && (
        <div className="relative w-fit">
          <img
            src={previewUrl}
            alt="Pré-visualização da imagem de capa"
            className="h-32 w-32 rounded-sm object-cover"
            style={{ border: '1px solid var(--border-soft)' }}
          />

          {file && (
            <button
              type="button"
              onClick={handleClearClick}
              disabled={disabled}
              aria-label="Cancelar nova imagem de capa selecionada"
              className="absolute -right-2 -top-2 inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-circle disabled:cursor-not-allowed"
              style={{ background: 'var(--rose-400)', color: 'var(--white)', boxShadow: 'var(--shadow-sm)' }}
            >
              <X aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      <FileField
        id={id}
        label={label}
        accept={COVER_IMAGE_ACCEPTED_MIME_TYPES}
        onChange={handleFilesSelected}
        onBlur={onBlur}
        disabled={disabled}
        error={validationError}
        hint="JPG, PNG ou WebP, até 5MB."
      />
    </div>
  )
}
