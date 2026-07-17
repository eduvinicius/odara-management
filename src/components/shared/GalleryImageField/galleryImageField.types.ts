import type { ProductFormGalleryImage } from '../../../lib/forms/productForm'

/** Public props for `GalleryImageField`. */
export type GalleryImageFieldProps = {
  /** `id` of the underlying file input. */
  id: string
  /** Visible label text for the file picker. @default 'Imagens da galeria' */
  label?: string
  /**
   * Newly selected gallery image files pending upload
   * (`ProductFormValues.galleryImageFiles`). Combined with the kept
   * (non-removed) entries of `existingImages`, the total is capped at
   * `GALLERY_IMAGE_LIMIT` by this component.
   */
  newFiles: File[]
  /**
   * Existing gallery images (`ProductFormValues.existingGalleryImages`),
   * always empty in create mode. Entries with `markedForRemoval: true` are
   * excluded from the 6-image cap count and visually flagged for removal.
   */
  existingImages: ProductFormGalleryImage[]
  /** Called with the next `newFiles` array whenever files are added or removed. */
  onNewFilesChange: (files: File[]) => void
  /** Called with the next `existingImages` array whenever a removal is toggled. */
  onExistingImagesChange: (images: ProductFormGalleryImage[]) => void
  onBlur?: () => void
  disabled?: boolean
}

/** One newly selected file rejected from a gallery upload batch, with the reason shown to the admin. */
export type RejectedGalleryFile = {
  name: string
  reason: string
}
