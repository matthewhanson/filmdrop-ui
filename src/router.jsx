/**
 * TanStack Router configuration for FilmDrop UI
 *
 * Single route with all shareable state in URL search params.
 * No path-based item route — the `item` search param indicates which
 * item is selected. This eliminates cross-route param syncing complexity.
 *
 * Search params are divided into two categories:
 * - Search-committed: updated only when Search button is clicked (col, dt, view, queryable filters)
 * - Immediate: updated as user interacts (item, viz, tab, z, c)
 *
 * The useUrlStateSync hook in App.jsx reads these params and syncs to Redux.
 * Components continue reading from Redux via useSelector.
 */
import {
  createRouter,
  createRootRoute,
  createRoute,
  defaultStringifySearch
} from '@tanstack/react-router'
import App from './App'

/**
 * Reserved search param names that are not queryable filters.
 * Any param not in this set is treated as a dynamic queryable filter
 * (including _min/_max suffixed variants used for range filters).
 */
export const RESERVED_PARAMS = new Set([
  'col',
  'dt',
  'view',
  'viz',
  'item',
  'tab',
  'z',
  'c'
])

/**
 * Extract queryable filter params from the raw search object.
 * Returns any params not in the RESERVED_PARAMS set.
 */
export function extractQueryableParams(search) {
  const result = {}
  for (const [key, value] of Object.entries(search)) {
    if (!RESERVED_PARAMS.has(key)) {
      result[key] = value
    }
  }
  return result
}

/**
 * Normalize and validate URL search params.
 * Exported for direct unit testing.
 */
export function normalizeSearch(search) {
  return {
    // Search-committed params (updated on Search click)
    col: String(search.col ?? ''),
    dt: String(search.dt ?? ''),
    view: ['scene', 'hex', 'grid-code', 'mosaic'].includes(search.view)
      ? search.view
      : '',
    // Immediate params (updated on user interaction)
    viz: String(search.viz ?? ''),
    item: String(search.item ?? ''),
    tab: ['search', 'details'].includes(search.tab) ? search.tab : '',
    z: search.z != null ? Number(search.z) : undefined,
    c: String(search.c ?? ''),
    // Dynamic queryable filter params (pass through non-reserved keys)
    ...extractQueryableParams(search)
  }
}

const rootRoute = createRootRoute({
  validateSearch: normalizeSearch,
  component: App
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => null
})

const routeTree = rootRoute.addChildren([indexRoute])

/**
 * Custom stringifySearch that strips empty/null/undefined values before
 * serialization. normalizeSearch restores defaults on read, so omitting
 * these keys keeps the URL short without losing state.
 */
function stringifySearch(search) {
  const cleaned = {}
  for (const [key, value] of Object.entries(search)) {
    if (value !== '' && value !== undefined && value !== null) {
      cleaned[key] = value
    }
  }
  return defaultStringifySearch(cleaned)
}

export const router = createRouter({ routeTree, stringifySearch })
