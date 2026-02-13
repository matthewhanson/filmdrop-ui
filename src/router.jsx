/**
 * TanStack Router configuration for FilmDrop UI
 *
 * Path-based routes for resource selection:
 *   /                          — no collection selected (landing)
 *   /:collectionId             — collection selected
 *   /:collectionId/:itemId     — collection + item selected
 *
 * Search params carry display preferences and search state:
 *   dt, view, viz, tab, z, c   — reserved params
 *   anything else              — dynamic queryable filters
 *
 * The useUrlStateSync hook in App.jsx reads path params + search params
 * and syncs to Redux. Components continue reading from Redux via useSelector.
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
 *
 * Note: `col` and `item` are path params (/:collectionId/:itemId),
 * not search params.
 */
export const RESERVED_PARAMS = new Set(['dt', 'view', 'viz', 'tab', 'z', 'c'])

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
    dt: String(search.dt ?? ''),
    view: ['scene', 'hex', 'grid-code', 'mosaic'].includes(search.view)
      ? search.view
      : '',
    // Immediate params (updated on user interaction)
    viz: String(search.viz ?? ''),
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

const collectionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/$collectionId',
  component: () => null
})

const itemRoute = createRoute({
  getParentRoute: () => collectionRoute,
  path: '/$itemId',
  component: () => null
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  collectionRoute.addChildren([itemRoute])
])

/**
 * Preferred key order for URL search params.
 * Reserved params appear first in this fixed order for readability,
 * then any queryable filter params follow in alphabetical order.
 */
const PARAM_ORDER = ['dt', 'view', 'viz', 'tab', 'z', 'c']

/**
 * Custom stringifySearch that strips empty/null/undefined values and
 * enforces deterministic key ordering before serialization.
 * normalizeSearch restores defaults on read, so omitting these keys
 * keeps the URL short without losing state.
 */
function stringifySearch(search) {
  const ordered = {}

  // Reserved params in fixed order
  for (const key of PARAM_ORDER) {
    if (key in search) {
      const value = search[key]
      if (value !== '' && value !== undefined && value !== null) {
        ordered[key] = value
      }
    }
  }

  // Remaining params (queryable filters) in alphabetical order
  const remaining = Object.keys(search)
    .filter((key) => !PARAM_ORDER.includes(key))
    .sort()
  for (const key of remaining) {
    const value = search[key]
    if (value !== '' && value !== undefined && value !== null) {
      ordered[key] = value
    }
  }

  return defaultStringifySearch(ordered)
}

export const router = createRouter({ routeTree, stringifySearch })

/**
 * Read current path params from router state.
 * For use outside React (searchHelper, mapHelper, services).
 * Returns { collectionId?, itemId? }.
 */
export function getPathParams() {
  const matches = router.state.matches
  // Accumulate params from all matched routes
  let params = {}
  for (const match of matches) {
    if (match.params) {
      params = { ...params, ...match.params }
    }
  }
  return params
}
