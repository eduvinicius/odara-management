import { RotateCcw, X } from 'lucide-react'

type ExistingGalleryImageThumbnailProps = {
  /** Public URL of the existing gallery image this thumbnail previews. */
  url: string
  /** Whether the admin has flagged this image for removal on save. */
  markedForRemoval: boolean
  /** Called when the admin toggles removal (flag it, or undo the flag) for this image. */
  onToggleRemoval: () => void
  disabled?: boolean
}

/**
 * Thumbnail for one existing (already saved) gallery image (Must 37).
 * Removal only flags the image via `markedForRemoval` in form state — it is
 * never deleted here; actual storage deletion happens later when the update
 * mutation saves the form (Task 12). A flagged image stays visible, dimmed
 * and labeled, with an undo control, so the admin can review pending
 * removals before submitting. Private to `GalleryImageField` — not
 * re-exported from its `index.ts`.
 */
export function ExistingGalleryImageThumbnail({
  url,
  markedForRemoval,
  onToggleRemoval,
  disabled = false,
}: ExistingGalleryImageThumbnailProps) {
  return (
    <div className="relative h-24 w-24 shrink-0">
      <img
        src={url}
        alt="Imagem existente da galeria"
        className="h-full w-full rounded-sm object-cover"
        style={{
          border: '1px solid var(--border-soft)',
          opacity: markedForRemoval ? 0.4 : 1,
        }}
      />

      {markedForRemoval && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-1 bottom-1 rounded-pill px-2 py-0.5 text-center text-2xs font-medium"
          style={{ background: 'var(--rose-400)', color: 'var(--white)' }}
        >
          Removida
        </span>
      )}

      <button
        type="button"
        onClick={onToggleRemoval}
        disabled={disabled}
        aria-label={
          markedForRemoval
            ? 'Desfazer remoção desta imagem da galeria'
            : 'Remover esta imagem da galeria'
        }
        className="absolute -right-2 -top-2 inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-circle disabled:cursor-not-allowed"
        style={{
          background: markedForRemoval ? 'var(--emerald-500)' : 'var(--rose-400)',
          color: 'var(--white)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {markedForRemoval ? (
          <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
        ) : (
          <X aria-hidden="true" className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  )
}
