import { useEffect, useMemo } from 'react'

/**
 * Creates a temporary `blob:` object URL for a `File` so it can be shown as
 * an `<img>` preview before it is uploaded (e.g. a newly selected product
 * cover or gallery image), and revokes it whenever `file` changes or the
 * component unmounts so no blob URLs leak.
 *
 * The URL itself is derived synchronously during render with `useMemo` (no
 * `setState` inside an Effect, which would trigger an extra cascading
 * render); only the revocation — releasing a browser-managed resource
 * outside React's own state — belongs in an Effect, per
 * "you-dont-need-useeffect" (synchronizing with an external system).
 */
export function useObjectUrl(file: File | null): string | null {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])

  useEffect(() => {
    return () => {
      if (url) {
        URL.revokeObjectURL(url)
      }
    }
  }, [url])

  return url
}
