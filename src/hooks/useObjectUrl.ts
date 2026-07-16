import { useEffect, useState } from 'react'

/**
 * Creates a temporary `blob:` object URL for a `File` so it can be shown as
 * an `<img>` preview before it is uploaded (e.g. a newly selected product
 * cover or gallery image), and revokes it whenever `file` changes or the
 * component unmounts so no blob URLs leak.
 *
 * Both creation and revocation happen inside the same Effect (rather than
 * creating in `useMemo` and only revoking in an Effect) so the two stay
 * correctly paired under React StrictMode's dev-only mount → cleanup →
 * remount cycle. A component whose *first* mount already has a non-null
 * `file` (e.g. a gallery thumbnail, which only mounts once a file exists)
 * would otherwise have its freshly created blob revoked by the simulated
 * cleanup before the `<img>` ever loads it, since creation living outside
 * the Effect meant the "remount" half of that cycle never made a new one.
 */
export function useObjectUrl(file: File | null): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!file) {
      setUrl(null)
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setUrl(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [file])

  return url
}
