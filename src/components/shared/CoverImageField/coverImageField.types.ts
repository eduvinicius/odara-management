/** Public props for `CoverImageField`. */
export type CoverImageFieldProps = {
  /** `id` of the underlying file input; also used to derive its error/hint ids. */
  id: string
  /** Visible label text for the file picker. @default 'Imagem de capa' */
  label?: string
  /**
   * Newly selected cover image file pending upload (`ProductFormValues.coverImageFile`),
   * or `null` when no new file has been selected.
   */
  file: File | null
  /**
   * Current cover image URL for preview (`ProductFormValues.existingCoverImageUrl`).
   * `null` in create mode, or in edit mode when the product has no cover yet.
   * Shown only while `file` is `null`.
   */
  existingUrl: string | null
  /**
   * Called with an already-validated file once the admin picks one, or with
   * `null` when the admin clears a pending selection (reverting the preview
   * to `existingUrl`, if any). Never called with a file that failed
   * `validateProductImage`.
   */
  onChange: (file: File | null) => void
  onBlur?: () => void
  disabled?: boolean
}
