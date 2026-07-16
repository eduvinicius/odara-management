export function money(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/**
 * Converts a label into a URL-safe slug: strips accents/diacritics,
 * lowercases, and replaces any run of non-alphanumeric characters with a
 * single hyphen, trimming leading/trailing hyphens.
 *
 * Used to auto-generate a category's `id` from its `label` at creation time
 * (e.g. a label containing a cedilla or tilde has those diacritics
 * stripped before lowercasing and hyphenating).
 */
export function slugify(label: string): string {
  const COMBINING_DIACRITICS_PATTERN = /[̀-ͯ]/g

  return label
    .trim()
    .normalize('NFD')
    .replace(COMBINING_DIACRITICS_PATTERN, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
