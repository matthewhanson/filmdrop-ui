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
  createRoute
} from '@tanstack/react-router'
import App from './App'

/**
 * Reserved search param names that are not queryable filters.
 * Any param not in this set (and not a _min/_max suffix of one) is treated
 * as a dynamic queryable filter.
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
 * These are any params not in the RESERVED_PARAMS set and not
 * _min/_max suffixes of reserved params.
 */
function extractQueryableParams(search) {
  const result = {}
  for (const [key, value] of Object.entries(search)) {
    const baseKey = key.replace(/_min$|_max$/, '')
    if (!RESERVED_PARAMS.has(key) && !RESERVED_PARAMS.has(baseKey)) {
      result[key] = value
    }
  }
  return result
}

const rootRoute = createRootRoute({
  validateSearch: (search) => ({
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
  }),
  component: App
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => null
})

const routeTree = rootRoute.addChildren([indexRoute])

export const router = createRouter({ routeTree })
