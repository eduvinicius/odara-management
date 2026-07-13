import { supabase } from '../supabase'

/**
 * Name of the existing Supabase Storage bucket that holds product cover and
 * gallery images. The bucket is provisioned outside this app — never create
 * or configure it here.
 */
const BUCKET_NAME = 'Products'

/** Maximum accepted size for a single product image upload, in bytes. */
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024

/** MIME types accepted for product cover and gallery image uploads. */
const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

type AcceptedMimeType = (typeof ACCEPTED_MIME_TYPES)[number]

const EXTENSION_BY_MIME_TYPE: Record<AcceptedMimeType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

/** Result of validating a candidate product image file. Never thrown. */
export type ImageValidationResult = { valid: true } | { valid: false; reason: string }

function isAcceptedMimeType(type: string): type is AcceptedMimeType {
  return (ACCEPTED_MIME_TYPES as readonly string[]).includes(type)
}

/**
 * Validates that a File is an accepted product image: JPG, PNG, or WebP,
 * and no larger than 5MB. Never throws — callers (e.g. the image upload UI)
 * use the returned result to show per-image feedback for rejected files.
 */
export function validateProductImage(file: File): ImageValidationResult {
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
 * Uploads an already-validated product image File to the "Products" bucket
 * under a randomly generated filename, and returns its public URL — the
 * same shape stored in `Products.image_url` / `Products.images` and read
 * directly by the catalog app.
 *
 * Callers must validate the file with `validateProductImage` first; this
 * function does not re-validate and will throw for a rejected file type.
 */
export async function uploadProductImage(file: File): Promise<string> {
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
 * Uploads multiple already-validated product image Files (e.g. a gallery
 * batch) to the "Products" bucket, returning their public URLs in the same
 * order as the input. Rejects as soon as any individual upload fails, so
 * callers can abort the whole create/edit save without persisting a partial
 * set of images.
 */
export async function uploadProductImages(files: readonly File[]): Promise<string[]> {
  return Promise.all(files.map(uploadProductImage))
}

/**
 * Derives the "Products" bucket storage path from a stored value, which may
 * already be a bare storage path or a full Supabase public URL (the shape
 * saved to `Products.image_url` / `Products.images`). Returns null when the
 * value does not point into this bucket.
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
 * Removes one or more product images from the "Products" bucket, given
 * their public URLs (or bare storage paths). Used on product delete to
 * remove the cover and every gallery image, and on product edit to remove
 * gallery images the admin dropped, so no orphaned files remain.
 *
 * Silently skips any values that do not resolve to a path in this bucket.
 * No-ops when given an empty list.
 */
export async function deleteProductImages(urlsOrPaths: readonly string[]): Promise<void> {
  const paths = urlsOrPaths
    .map(toStoragePath)
    .filter((path): path is string => path !== null)

  if (paths.length === 0) {
    return
  }

  const { error } = await supabase.storage.from(BUCKET_NAME).remove(paths)

  if (error) {
    throw new Error(error.message)
  }
}
