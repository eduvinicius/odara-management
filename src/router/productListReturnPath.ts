/** Path to the product list route, without any querystring. */
export const PRODUCTS_LIST_PATH = '/products'

/**
 * Shape of the router `state` carried on the "Novo produto" and "Editar"
 * links from `ProductListPage`/`ProductRowActions` to `/products/new` and
 * `/products/:id/edit`. Lets the create/edit pages restore the admin's
 * search, filter, and page selections after a successful submit (Should 50)
 * without `/products/new` or `/products/:id/edit` needing their own
 * querystring — they only need to remember where to go back to.
 */
export type ProductFormLocationState = {
  /** The list path, including its original querystring (e.g. `/products?q=vela&page=2`), to return to after a successful create or edit. */
  from?: string
}

/**
 * Resolves the path `ProductNewPage`/`ProductEditPage` should navigate to
 * after a successful create or edit. Reads `from` off router location state
 * when present; falls back to the bare list path otherwise — e.g. when the
 * admin opened the form directly via a bookmarked URL or a page refresh,
 * where `location.state` is `null`.
 */
export function resolveProductListReturnPath(locationState: unknown): string {
  if (
    locationState !== null &&
    typeof locationState === 'object' &&
    'from' in locationState &&
    typeof (locationState as ProductFormLocationState).from === 'string'
  ) {
    return (locationState as ProductFormLocationState).from as string
  }

  return PRODUCTS_LIST_PATH
}
