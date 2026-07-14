import { useState } from 'react'
import { validateProductImage } from '../../../lib/storage/productImages'
import { FileField } from '../FileField'
import { ExistingGalleryImageThumbnail } from './ExistingGalleryImageThumbnail'
import { GalleryNewFileThumbnail } from './GalleryNewFileThumbnail'
import { GALLERY_IMAGE_ACCEPTED_MIME_TYPES, GALLERY_IMAGE_LIMIT } from './galleryImageField.data'
import type { GalleryImageFieldProps, RejectedGalleryFile } from './galleryImageField.types'

/**
 * Up-to-{@link GALLERY_IMAGE_LIMIT} gallery image upload control for the
 * product form (Must 29). Combines the admin's kept existing images (edit
 * mode) with newly selected files against a shared cap, validates each
 * newly selected file individually via `validateProductImage` and reports
 * per-file feedback for any rejected file without discarding the other
 * valid files in the same batch (Must 30, Must 31), and lets the admin
 * remove a pending new file or flag/unflag an existing image for removal on
 * save (Must 37).
 *
 * A standalone component (not a `form.Field` render-prop consumer) because
 * it manages two related `ProductFormValues` slots (`galleryImageFiles` and
 * `existingGalleryImages`) whose cap is enforced jointly — the parent form
 * (Task 21) wires both via its own `form.Field`s and passes their values/
 * setters down as plain props.
 *
 * Uploading `newFiles` and deleting images flagged `markedForRemoval` on
 * save is handled by the create/update mutations (Tasks 11-12), not here.
 */
export function GalleryImageField({
  id,
  label = 'Imagens da galeria',
  newFiles,
  existingImages,
  onNewFilesChange,
  onExistingImagesChange,
  onBlur,
  disabled = false,
}: GalleryImageFieldProps) {
  const [rejectedFiles, setRejectedFiles] = useState<RejectedGalleryFile[]>([])

  const keptExistingCount = existingImages.filter((image) => !image.markedForRemoval).length
  const totalSelectedCount = keptExistingCount + newFiles.length
  const isFull = totalSelectedCount >= GALLERY_IMAGE_LIMIT

  function handleFilesSelected(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return

    let remainingSlots = GALLERY_IMAGE_LIMIT - totalSelectedCount
    const accepted: File[] = []
    const rejections: RejectedGalleryFile[] = []

    for (const candidate of Array.from(fileList)) {
      if (remainingSlots <= 0) {
        rejections.push({
          name: candidate.name,
          reason: `Limite de ${GALLERY_IMAGE_LIMIT} imagens atingido.`,
        })
        continue
      }

      const result = validateProductImage(candidate)
      if (!result.valid) {
        rejections.push({ name: candidate.name, reason: result.reason })
        continue
      }

      accepted.push(candidate)
      remainingSlots -= 1
    }

    setRejectedFiles(rejections)

    if (accepted.length > 0) {
      onNewFilesChange([...newFiles, ...accepted])
    }
  }

  function handleRemoveNewFileAt(indexToRemove: number) {
    onNewFilesChange(newFiles.filter((_, index) => index !== indexToRemove))
  }

  function handleToggleExistingRemoval(url: string) {
    onExistingImagesChange(
      existingImages.map((image) =>
        image.url === url ? { ...image, markedForRemoval: !image.markedForRemoval } : image,
      ),
    )
  }

  const hasThumbnails = existingImages.length > 0 || newFiles.length > 0

  return (
    <div className="flex flex-col gap-2">
      {hasThumbnails && (
        <div className="flex flex-wrap gap-3">
          {existingImages.map((image) => (
            <ExistingGalleryImageThumbnail
              key={image.url}
              url={image.url}
              markedForRemoval={image.markedForRemoval}
              onToggleRemoval={() => handleToggleExistingRemoval(image.url)}
              disabled={disabled}
            />
          ))}

          {newFiles.map((file, index) => (
            <GalleryNewFileThumbnail
              key={`${file.name}-${file.lastModified}-${index}`}
              file={file}
              onRemove={() => handleRemoveNewFileAt(index)}
              disabled={disabled}
            />
          ))}
        </div>
      )}

      <FileField
        id={id}
        label={label}
        accept={GALLERY_IMAGE_ACCEPTED_MIME_TYPES}
        multiple
        onChange={handleFilesSelected}
        onBlur={onBlur}
        disabled={disabled || isFull}
        hint={
          isFull
            ? `Limite de ${GALLERY_IMAGE_LIMIT} imagens atingido.`
            : `JPG, PNG ou WebP, até 5MB cada. ${totalSelectedCount} de ${GALLERY_IMAGE_LIMIT} imagens selecionadas.`
        }
      />

      {rejectedFiles.length > 0 && (
        <ul className="flex flex-col gap-1">
          {rejectedFiles.map((rejection, index) => (
            <li
              key={`${rejection.name}-${index}`}
              role="alert"
              className="text-xs"
              style={{ color: 'var(--rose-400)' }}
            >
              {rejection.name}: {rejection.reason}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
