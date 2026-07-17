/** Public props for `FeedbackImageField`. */
export type FeedbackImageFieldProps = {
  /** `id` of the underlying file input; also used to derive its error/hint ids. */
  id: string
  /** Visible label text for the file picker. @default 'Imagem do depoimento' */
  label?: string
  /**
   * Newly selected image file pending upload (`FeedbackFormValues.imageFile`),
   * or `null` when no new file has been selected. Takes priority over
   * `existingUrl`/`removed` for preview, and — per the update mutation — for
   * what actually gets saved.
   */
  file: File | null
  /**
   * Current image URL for preview (`FeedbackFormValues.existingImageUrl`).
   * `null` in create mode, or in edit mode when the feedback has no image
   * yet. Drives the preview whenever `file` is `null`; shown dimmed with a
   * "Removida" badge when `removed` is `true`.
   */
  existingUrl: string | null
  /**
   * Whether the admin has explicitly requested removal of `existingUrl` with
   * no replacement (`FeedbackFormValues.removeExistingImage`). This is a
   * third state, distinct from both "no change" (`removed: false`, `file:
   * null`) and "new file selected" (`file` non-null) — it tells the parent
   * form/mutation to clear the image on save even though no replacement was
   * picked. Always `false` in create mode, since there is no existing image
   * to remove. Has no effect on the preview while `file` is set.
   */
  removed: boolean
  /**
   * Called with an already-validated file once the admin picks one, or with
   * `null` when the admin cancels a pending selection (reverting the preview
   * to `existingUrl`, dimmed if `removed` is still `true`). Never called
   * with a file that failed `validateFeedbackImage`. Selecting a valid file
   * also resets a pending `removed` flag back to `false` via
   * `onRemovedChange`, since picking a replacement supersedes a prior
   * removal request.
   */
  onChange: (file: File | null) => void
  /**
   * Called with `true` when the admin clicks the explicit "remove existing
   * image" control on `existingUrl`, or `false` when they undo that request
   * via the same control. Only rendered/reachable while `file` is `null` —
   * selecting a replacement takes precedence over removing.
   */
  onRemovedChange: (removed: boolean) => void
  onBlur?: () => void
  disabled?: boolean
}
