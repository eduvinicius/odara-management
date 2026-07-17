import { X } from 'lucide-react'
import { useObjectUrl } from '../../../hooks/useObjectUrl'

type GalleryNewFileThumbnailProps = {
  /** The newly selected, already-validated file this thumbnail previews. */
  file: File
  /** Called when the admin removes this file from the pending selection. */
  onRemove: () => void
  disabled?: boolean
}

/**
 * Thumbnail preview for one newly selected (not yet uploaded) gallery image
 * file, with a control to drop it from the pending selection before submit.
 * Private to `GalleryImageField` — not re-exported from its `index.ts`.
 */
export function GalleryNewFileThumbnail({
  file,
  onRemove,
  disabled = false,
}: GalleryNewFileThumbnailProps) {
  const previewUrl = useObjectUrl(file)

  return (
    <div className="relative h-24 w-24 shrink-0">
      {previewUrl && (
        <img
          src={previewUrl}
          alt={`Nova imagem da galeria: ${file.name}`}
          className="h-full w-full rounded-sm object-cover"
          style={{ border: '1px solid var(--border-soft)' }}
        />
      )}

      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        aria-label={`Remover ${file.name} da galeria`}
        className="absolute -right-2 -top-2 inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-circle disabled:cursor-not-allowed"
        style={{ background: 'var(--rose-400)', color: 'var(--white)', boxShadow: 'var(--shadow-sm)' }}
      >
        <X aria-hidden="true" className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
