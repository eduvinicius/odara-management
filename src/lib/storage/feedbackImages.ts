import { supabase } from '../supabase'

/**
 * Name of the existing Supabase Storage bucket that holds feedback images.
 * The bucket is provisioned outside this app — never create or configure it
 * here.
 */
const BUCKET_NAME = 'Feedbacks'

/** Maximum accepted size for a single feedback image upload, in bytes. */
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024

/** MIME types accepted for feedback image uploads. */
const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

type AcceptedMimeType = (typeof ACCEPTED_MIME_TYPES)[number]

const EXTENSION_BY_MIME_TYPE: Record<AcceptedMimeType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

/** Result of validating a candidate feedback image file. Never thrown. */
export type ImageValidationResult = { valid: true } | { valid: false; reason: string }

function isAcceptedMimeType(type: string): type is AcceptedMimeType {
  return (ACCEPTED_MIME_TYPES as readonly string[]).includes(type)
}

/**
 * Validates that a File is an accepted feedback image: JPG, PNG, or WebP,
 * and no larger than 5MB. Never throws — callers (e.g. the feedback form UI)
 * use the returned result to show feedback for a rejected file.
 */
export function validateFeedbackImage(file: File): ImageValidationResult {
  if (!isAcceptedMimeType(file.type)) {
    return {
      valid: false,
      reason: 'Formato de imagem não suportado. Use JPG, PNG ou WebP.',
    }
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      reason: 'A imagem deve ter no máximo 5MB.',
    }
  }

  return { valid: true }
}

/**
 * Uploads an already-validated feedback image File to the "Feedbacks"
 * bucket under a randomly generated filename, and returns its public URL —
 * the same shape stored in `Feedbacks.image_url` and read directly by the
 * catalog app.
 *
 * Callers must validate the file with `validateFeedbackImage` first; this
 * function does not re-validate and will throw for a rejected file type.
 */
export async function uploadFeedbackImage(file: File): Promise<string> {
  if (!isAcceptedMimeType(file.type)) {
    throw new Error('Formato de imagem não suportado. Use JPG, PNG ou WebP.')
  }

  const extension = EXTENSION_BY_MIME_TYPE[file.type]
  const path = `${crypto.randomUUID()}.${extension}`

  const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })

  if (uploadError) {
    throw new Error(uploadError.message)
  }

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path)
  return data.publicUrl
}

/**
 * Derives the "Feedbacks" bucket storage path from a stored value, which
 * may already be a bare storage path or a full Supabase public URL (the
 * shape saved to `Feedbacks.image_url`). Returns null when the value does
 * not point into this bucket.
 */
function toStoragePath(urlOrPath: string): string | null {
  const publicUrlMarker = `/object/public/${BUCKET_NAME}/`
  const markerIndex = urlOrPath.indexOf(publicUrlMarker)

  if (markerIndex === -1) {
    // Not a full Supabase public URL for this bucket — treat it as an
    // already-bare storage path.
    return urlOrPath.length > 0 ? urlOrPath : null
  }

  const path = urlOrPath.slice(markerIndex + publicUrlMarker.length)
  return path.length > 0 ? decodeURIComponent(path) : null
}

/**
 * Removes a single feedback image from the "Feedbacks" bucket, given its
 * public URL (or bare storage path). Used on feedback delete to remove the
 * associated image, and on feedback edit to remove a replaced or cleared
 * image, so no orphaned files remain.
 *
 * No-ops when given an empty string or a value that does not resolve to a
 * path in this bucket.
 */
export async function deleteFeedbackImage(urlOrPath: string): Promise<void> {
  const path = toStoragePath(urlOrPath)

  if (path === null) {
    return
  }

  const { error } = await supabase.storage.from(BUCKET_NAME).remove([path])

  if (error) {
    throw new Error(error.message)
  }
}
