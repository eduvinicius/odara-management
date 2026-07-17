/**
 * Maximum number of gallery images a product may have at once — existing
 * kept images (not marked for removal) plus newly selected files combined
 * (Must 29, spec "Max gallery images per product: 6").
 */
export const GALLERY_IMAGE_LIMIT = 6

/** `accept` attribute for the gallery image file input (Must 30). */
export const GALLERY_IMAGE_ACCEPTED_MIME_TYPES = 'image/jpeg,image/png,image/webp'
