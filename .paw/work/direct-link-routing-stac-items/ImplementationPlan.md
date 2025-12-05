# Direct Link Routing to STAC Items Implementation Plan

## Overview

This plan implements client-side routing using TanStack Router to enable direct URL access to STAC items without requiring search interaction. Users will be able to share URLs like `/item/sentinel-2-l2a/S2A_17SNB_20230617_0_L2A` that immediately display the item on the map with footprint visualization and TiTiler imagery rendering.

## Current State Analysis

FilmDrop UI is a React 19 single-page application with:
- **No existing routing**: Navigation is purely Redux state-driven via `tabSelected` state
- **Redux-centric architecture**: All component communication flows through Redux store
- **Consistent STAC API patterns**: All services use fetch with JWT Bearer authentication, credentials configuration, and promise-based error handling
- **Three critical item states**: `clickResults` (array), `currentPopupResult` (single item), `selectedPopupResultIndex` (integer)
- **Map-click selection flow**: Users click map → `mapClickHandler` populates Redux states → `PopupResults` and `EnhancedDetailsTab` components display item
- **Existing visualization utilities**: `clearMapSelection()`, `debounceTitilerOverlay()`, `zoomToItemExtent()`, Leaflet FeatureGroups for layers

### Key Discoveries:
- No existing service fetches individual items; all items come from `/search` endpoints returning FeatureCollections (`src/services/get-search-service.js`)
- `getCollectionConfig(collectionId, paramName)` returns `undefined` for unconfigured collections, providing validation mechanism (`src/utils/configHelper.js:242-276`)
- `showApplicationAlert(severity, message, duration)` utility displays error banners via Redux-integrated `SystemMessage` component (`src/utils/alertHelper.js:7-23`)
- `PopupResults` and `EnhancedDetailsTab` components only depend on Redux state, not props for data sharing (`src/components/PopupResults/PopupResults.jsx`, `src/components/EnhancedDetailsTab/EnhancedDetailsTab.jsx`)
- Authentication gate in `App.jsx` conditionally renders Login vs main Content based on `APP_TOKEN_AUTH_ENABLED` and `authTokenExists` state (`src/App.jsx:44-59`)
- TiTiler imagery uses collection-specific `sceneTilerParams` from config to construct tile URLs (`src/utils/mapHelper.js:355-420`)

## Desired End State

After implementation:
- Users navigate to `/item/:collectionId/:itemId` URLs and see items displayed on map
- Browser back/forward buttons work correctly between items
- URL always reflects current item context
- Item IDs with special characters (colons, slashes) are properly encoded/decoded
- Error states (404, unconfigured collections, network failures) display helpful error banners
- Authentication requirements are respected with login redirect and post-auth return
- Existing `PopupResults` and `EnhancedDetailsTab` components display routed items identically to map-click selection

### Verification:
- Navigate to direct item URL without search → item loads and displays on map
- Browser back/forward navigation → previous/next items restore correctly
- Share URL with colleague → same item displays on their browser
- Invalid item ID → error banner displays "Item not found" without breaking app
- Unconfigured collection → error banner displays "Collection not configured"
- Test with item ID containing colon → URL encodes/decodes correctly

## What We're NOT Doing

- Deep-linking search results with URL-encoded query parameters (deferred to future iteration)
- Server-side rendering or pre-rendering of item routes
- Route-based code splitting or lazy loading
- Custom 404 page design (using existing error banner system)
- Migration of existing components beyond integration with routing
- Analytics or tracking of URL sharing patterns
- Changes to STAC API beyond adding single-item fetch endpoint
- Modifying `PopupResults` or `EnhancedDetailsTab` components

## Implementation Approach

**Strategy**: Introduce TanStack Router as a minimal overlay on top of existing Redux-driven architecture. The router will manage URL patterns and History API while continuing to populate Redux states that trigger existing component rendering. This hybrid approach requires no refactoring of existing components—they continue reading from Redux via `useSelector` hooks.

**Key Pattern**: Route loader functions will fetch items from the new STAC API service, then dispatch Redux actions (`setClickResults`, `setCurrentPopupResult`, `setselectedPopupResultIndex`, `settabSelected`) to populate state. Existing components detect these state changes and render naturally.

## Phase Summary

1. **Phase 1: TanStack Router Setup and Basic Route Structure** - Install TanStack Router, create router configuration with root and item routes, integrate RouterProvider into index.jsx without disrupting Redux Provider
2. **Phase 2: STAC Item Fetch Service** - Create get-item-service.js following existing service patterns with authentication headers, credentials config, and error handling for individual item endpoint
3. **Phase 3: Item Route Implementation with State Population** - Implement item route loader with collection validation, item fetch, Redux state population, and map visualization triggers
4. **Phase 4: Error Handling and Edge Cases** - Integrate showApplicationAlert for error states (404, collection validation, network failures), implement URL encoding/decoding for special characters
5. **Phase 5: Authentication and Route Protection** - Add authentication checks in route beforeLoad, implement login redirect with preserved target URL for post-auth return

---

## Phase 1: TanStack Router Setup and Basic Route Structure

### Overview
Install TanStack Router library and create fundamental routing structure. Wrap the application with RouterProvider while preserving existing Redux Provider and App.jsx authentication gate. Define root route and item route patterns without implementing full functionality yet.

### Changes Required:

#### 1. Install TanStack Router Dependency
**File**: `package.json`
**Changes**: 
- Add `@tanstack/react-router` as production dependency (latest stable v1.x)
- Version will be determined by npm install, typically `^1.80.0` or latest stable

**Installation Command**:
```bash
npm install @tanstack/react-router
```

#### 2. Create Router Configuration File
**File**: `src/router.jsx` (new file)
**Changes**:
- Create router instance using `createRouter()` from TanStack Router
- Define `rootRoute` using `createRootRoute()` to render App component
- Define `indexRoute` for home path `/` (currently no specific home page, will maintain default state-driven navigation)
- Define `itemRoute` for path `/item/$collectionId/$itemId` with placeholder component
- Build route tree combining root, index, and item routes
- Export router instance for use in index.jsx

**Brief Example**:
```jsx
import { createRouter, createRootRoute, createRoute } from '@tanstack/react-router'
import App from './App'

// Root route renders App component
const rootRoute = createRootRoute({
  component: App,
})

// Index route for home path
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => null, // No specific component, App handles state-driven rendering
})

// Item route (placeholder, will be implemented in Phase 3)
const itemRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/item/$collectionId/$itemId',
  component: () => <div>Item Route Placeholder</div>,
})

const routeTree = rootRoute.addChildren([indexRoute, itemRoute])

export const router = createRouter({ routeTree })
```

#### 3. Integrate Router into Application Entry Point
**File**: `src/index.jsx`
**Changes**:
- Import `RouterProvider` from `@tanstack/react-router`
- Import `router` instance from `./router.jsx`
- Wrap existing `<App />` with `<RouterProvider router={router}>`
- Maintain existing `<Provider store={store}>` wrapper (Redux Provider remains outermost)

**Tests**:
- Verify router integration doesn't break existing authentication gate
- Confirm Redux state management continues working
- Test that app loads at `/` path without errors

### Success Criteria:

#### Automated Verification:
- [ ] TanStack Router installed: `npm list @tanstack/react-router` shows version
- [ ] Application builds successfully: `npm run build`
- [ ] Type checking passes: `npm run typecheck`
- [ ] Linting passes: `npm run lint`
- [ ] Existing tests pass: `npm run test`

#### Manual Verification:
- [ ] Application loads at `/` path without errors
- [ ] Redux DevTools shows state continues updating normally
- [ ] Authentication gate still works (login screen appears when `APP_TOKEN_AUTH_ENABLED` true and no token)
- [ ] Existing search functionality works without regression
- [ ] Map interactions (click, zoom, pan) work normally

---

## Phase 2: STAC Item Fetch Service

### Overview
Create a new service file `get-item-service.js` following the established pattern for STAC API calls. The service will fetch individual items from the `/collections/{collectionId}/items/{itemId}` endpoint per STAC specification, including authentication headers when enabled.

### Changes Required:

#### 1. Create Item Fetch Service
**File**: `src/services/get-item-service.js` (new file)
**Changes**: 
- Implement `GetItemService(collectionId, itemId)` function following pattern established in `get-search-service.js`
- Setup authentication headers: check `APP_TOKEN_AUTH_ENABLED` flag, retrieve JWT from localStorage 'APP_AUTH_TOKEN', append as `Authorization: Bearer ${JWT}` header
- Construct URL: `${STAC_API_URL}/collections/${collectionId}/items/${itemId}`
- Use fetch with `credentials: appConfig.FETCH_CREDENTIALS || 'same-origin'`
- Promise chain: `.then(response => response.ok ? response.json() : throw Error())` to check status
- Return item GeoJSON on success (do not dispatch Redux actions in service—let caller handle state)
- Catch errors and return null (caller will determine appropriate error handling)
- Follow existing service pattern for consistency with other API calls

**Brief Example**:
```javascript
import { store } from '../redux/store'

export async function GetItemService(collectionId, itemId) {
  const requestHeaders = new Headers()
  const JWT = localStorage.getItem('APP_AUTH_TOKEN')
  const isSTACTokenAuthEnabled =
    store.getState().mainSlice.appConfig.APP_TOKEN_AUTH_ENABLED ?? false
  if (JWT && isSTACTokenAuthEnabled) {
    requestHeaders.append('Authorization', `Bearer ${JWT}`)
  }

  try {
    const response = await fetch(
      `${store.getState().mainSlice.appConfig.STAC_API_URL}/collections/${collectionId}/items/${itemId}`,
      {
        credentials:
          store.getState().mainSlice.appConfig.FETCH_CREDENTIALS || 'same-origin',
        headers: requestHeaders
      }
    )

    if (response.ok) {
      return await response.json()
    }
    
    // Return error info for caller to handle
    return { error: true, status: response.status }
  } catch (error) {
    console.error('Error fetching STAC item:', error)
    return { error: true, status: null }
  }
}
```

**Tests**:
- Unit test: service constructs correct URL with collection ID and item ID
- Unit test: authentication header added when `APP_TOKEN_AUTH_ENABLED` is true and JWT exists
- Unit test: credentials configuration from Redux state applied correctly
- Integration test: service successfully fetches real item from STAC API (requires test environment)

### Success Criteria:

#### Automated Verification:
- [ ] Service file exists at `src/services/get-item-service.js`
- [ ] Type checking passes: `npm run typecheck`
- [ ] Linting passes: `npm run lint`
- [ ] Unit tests pass for authentication header logic
- [ ] Unit tests pass for URL construction

#### Manual Verification:
- [ ] Service successfully fetches item from STAC API when called directly with valid collection ID and item ID
- [ ] Service returns error object when item does not exist (404)
- [ ] Service includes JWT token in Authorization header when authentication is enabled
- [ ] Service handles network failures gracefully without throwing uncaught exceptions

---

## Phase 3: Item Route Implementation with State Population

### Overview
Implement the core routing functionality in the item route. When user navigates to `/item/:collectionId/:itemId`, the route loader validates the collection, fetches the item, populates Redux states, and triggers map visualization—all following the same state population pattern as the existing `mapClickHandler`.

### Changes Required:

#### 1. Implement Item Route Loader and Component
**File**: `src/router.jsx`
**Changes**:
- Replace placeholder item route with full implementation
- Add `loader` function to `itemRoute` that executes before component renders
- In loader: validate collection exists using `getCollectionConfig(collectionId, 'sceneMinZoom')`
- If collection invalid, call `showApplicationAlert('info', 'Collection not configured')` and return early
- Fetch item using `GetItemService(collectionId, itemId)`
- If fetch fails with 404, call `showApplicationAlert('error', 'Item not found')` and return early
- If fetch succeeds, dispatch Redux actions in sequence: `setClickResults([item])`, `setselectedPopupResultIndex(0)`, `setCurrentPopupResult(item)`, `settabSelected('details')`
- Call map visualization functions: `clearMapSelection()`, then trigger footprint and imagery via existing Redux state flow (no direct calls to map functions in loader—let useEffect hooks in components handle it)
- Component returns `null` (App.jsx already renders full UI via Redux state)

**Brief Example**:
```jsx
import { createRoute } from '@tanstack/react-router'
import { GetItemService } from './services/get-item-service'
import { getCollectionConfig } from './utils/configHelper'
import { showApplicationAlert } from './utils/alertHelper'
import { store } from './redux/store'
import {
  setClickResults,
  setCurrentPopupResult,
  setselectedPopupResultIndex,
  settabSelected,
} from './redux/slices/mainSlice'

const itemRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/item/$collectionId/$itemId',
  loader: async ({ params }) => {
    const { collectionId, itemId } = params

    // Validate collection
    const collectionConfig = getCollectionConfig(collectionId, 'sceneMinZoom')
    if (!collectionConfig) {
      showApplicationAlert('info', 'Collection not configured')
      return
    }

    // Fetch item
    const result = await GetItemService(collectionId, itemId)
    
    if (result.error) {
      if (result.status === 404) {
        showApplicationAlert('error', 'Item not found')
      } else {
        showApplicationAlert('error', 'Unable to load item. Please try again.')
      }
      return
    }

    // Populate Redux states (triggers component rendering)
    store.dispatch(setClickResults([result]))
    store.dispatch(setselectedPopupResultIndex(0))
    store.dispatch(setCurrentPopupResult(result))
    store.dispatch(settabSelected('details'))
  },
  component: () => null, // App.jsx handles rendering via Redux state
})
```

#### 2. Add Map Visualization Integration Hook
**File**: `src/App.jsx` (or new `src/hooks/useItemVisualization.jsx` if preferred)
**Changes**:
- Create `useEffect` hook that watches `currentPopupResult` Redux state
- When `currentPopupResult` changes and is not null, call `clearMapSelection()` first
- Then render footprint: `L.geoJSON(currentPopupResult, {style: clickedFootprintLayerStyle}).addTo(clickedSceneHighlightLayer)`
- Call `debounceTitilerOverlay(currentPopupResult)` to load imagery
- Call `zoomToItemExtent(currentPopupResult)` if `SHOW_ITEM_AUTO_ZOOM` config flag is true
- This hook ensures both map-click selection AND routed items trigger identical visualization

**Tests**:
- Integration test: navigate to `/item/sentinel-2-l2a/valid-item-id` → item displays on map
- Integration test: navigate to `/item/invalid-collection/item-id` → error banner displays
- Integration test: navigate to `/item/sentinel-2-l2a/invalid-item-id` → error banner displays
- Integration test: PopupResults component displays routed item identically to clicked item

### Success Criteria:

#### Automated Verification:
- [ ] Type checking passes: `npm run typecheck`
- [ ] Linting passes: `npm run lint`
- [ ] Integration tests pass for item route loading
- [ ] Integration tests pass for collection validation
- [ ] Integration tests pass for Redux state population

#### Manual Verification:
- [ ] Navigate to valid item URL → item loads and displays on map within 3 seconds
- [ ] Item footprint renders in yellow highlight style on clickedSceneHighlightLayer
- [ ] Item imagery renders via TiTiler (spinner appears then imagery displays)
- [ ] Map auto-centers on item extent (if SHOW_ITEM_AUTO_ZOOM is true)
- [ ] Left panel switches to 'details' tab and displays PopupResults component
- [ ] EnhancedDetailsTab shows item properties when expanded
- [ ] Navigate to unconfigured collection URL → "Collection not configured" error banner displays
- [ ] Navigate to invalid item ID → "Item not found" error banner displays
- [ ] Application remains interactive after error states (map still works, can navigate to other routes)

---

## Phase 4: Error Handling and Edge Cases

### Overview
Implement comprehensive error handling for all failure scenarios and add URL encoding/decoding for item IDs with special characters. Ensure error states display helpful messages without breaking application functionality.

### Changes Required:

#### 1. Add URL Encoding for Item Links
**File**: `src/router.jsx` or new `src/utils/routerHelper.js`
**Changes**:
- Create utility function `buildItemUrl(collectionId, itemId)` that constructs item route URLs
- Use `encodeURIComponent(itemId)` to handle special characters (colons, slashes, dots)
- TanStack Router automatically decodes path parameters, so loader receives decoded itemId
- Export utility for use in components that need to construct item links

**Brief Example**:
```javascript
export function buildItemUrl(collectionId, itemId) {
  return `/item/${collectionId}/${encodeURIComponent(itemId)}`
}
```

#### 2. Enhance Error Handling in Item Route Loader
**File**: `src/router.jsx`
**Changes**:
- Add try/catch block around entire loader function to catch unexpected errors
- Distinguish between different error types: 404 (item not found), 403 (authentication), network failures, parsing errors
- Use appropriate severity levels for `showApplicationAlert`: 'error' for 404 and network failures, 'warning' for auth failures, 'info' for collection validation
- Ensure loader returns gracefully after error (don't let errors propagate and break routing)
- Log detailed errors to console for debugging while showing user-friendly messages

**Tests**:
- Integration test: item ID with colon (e.g., "S2A:17SNB") encodes/decodes correctly
- Integration test: item ID with slash (e.g., "path/to/item") encodes/decodes correctly
- Integration test: network timeout → error banner displays with retry message
- Integration test: STAC API returns 500 → error banner displays

#### 3. Add Error State Recovery
**File**: `src/router.jsx`
**Changes**:
- After displaying error banner, ensure Redux state remains consistent (don't leave partial state)
- If item fetch fails, ensure `clickResults`, `currentPopupResult`, and `selectedPopupResultIndex` are either cleared or remain unchanged from previous state
- Consider adding "Retry" button in error banner for network failures (future enhancement, document in comments)

### Success Criteria:

#### Automated Verification:
- [ ] Type checking passes: `npm run typecheck`
- [ ] Linting passes: `npm run lint`
- [ ] Unit tests pass for URL encoding utility
- [ ] Integration tests pass for special character handling
- [ ] Integration tests pass for error scenarios

#### Manual Verification:
- [ ] Navigate to item URL with item ID containing colon → loads correctly
- [ ] Navigate to item URL with item ID containing slash → loads correctly
- [ ] Navigate to item URL with very long item ID (100+ characters) → URL remains functional and shareable
- [ ] Disconnect network, navigate to item URL → "Unable to load item" error banner displays
- [ ] Reconnect network, navigate to same URL → item loads successfully
- [ ] Navigate to item URL with typo in item ID → "Item not found" banner displays
- [ ] After error banner displays, click map → new search and selection works normally

---

## Phase 5: Authentication and Route Protection

### Overview
Integrate authentication checks into the routing system to respect `APP_TOKEN_AUTH_ENABLED` configuration. When authentication is required and user is not logged in, redirect to login screen and preserve the target item URL for post-authentication return.

### Changes Required:

#### 1. Add Route Protection in Item Route
**File**: `src/router.jsx`
**Changes**:
- Add `beforeLoad` function to `itemRoute` that executes before loader
- In beforeLoad: check `APP_TOKEN_AUTH_ENABLED` flag from Redux state
- If auth enabled, check for 'APP_AUTH_TOKEN' in localStorage
- If no token, store target URL in sessionStorage as 'POST_AUTH_REDIRECT_URL'
- Throw redirect to home path `/` (App.jsx auth gate will show login screen)
- If token exists, proceed normally to loader

**Brief Example**:
```javascript
const itemRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/item/$collectionId/$itemId',
  beforeLoad: ({ location }) => {
    const appConfig = store.getState().mainSlice.appConfig
    const JWT = localStorage.getItem('APP_AUTH_TOKEN')
    const authRequired = appConfig?.APP_TOKEN_AUTH_ENABLED ?? false

    if (authRequired && !JWT) {
      // Store target URL for post-auth redirect
      sessionStorage.setItem('POST_AUTH_REDIRECT_URL', location.href)
      throw redirect({ to: '/' })
    }
  },
  loader: async ({ params }) => {
    // ... existing loader implementation
  },
  component: () => null,
})
```

#### 2. Update Login Component for Post-Auth Redirect
**File**: `src/components/Login/Login.jsx`
**Changes**:
- After successful login (when `AuthService` stores token and sets `authTokenExists` to true), check sessionStorage for 'POST_AUTH_REDIRECT_URL'
- If redirect URL exists, navigate to it using `window.location.href = redirectUrl` or router navigation
- Clear sessionStorage 'POST_AUTH_REDIRECT_URL' after redirect
- If no redirect URL, remain on home path (normal login behavior)

**Tests**:
- Integration test: auth enabled, navigate to item URL without token → redirects to home, shows login
- Integration test: after successful login, automatically redirects to original item URL
- Integration test: auth enabled, navigate to item URL with valid token → item loads normally
- Integration test: auth disabled, navigate to item URL → item loads normally without auth check

#### 3. Handle Token Expiration During Routing
**File**: `src/services/get-item-service.js`
**Changes**:
- If STAC API returns 403 status, call `logoutUser()` from authHelper to clear token and force re-login
- Follow existing pattern from `get-collections-service.js` lines 69-79
- Display error banner: "Authentication expired. Please log in again."

### Success Criteria:

#### Automated Verification:
- [ ] Type checking passes: `npm run typecheck`
- [ ] Linting passes: `npm run lint`
- [ ] Integration tests pass for authentication redirect
- [ ] Integration tests pass for post-auth return

#### Manual Verification:
- [ ] Enable `APP_TOKEN_AUTH_ENABLED` in config, clear localStorage, navigate to item URL → redirects to home and shows login screen
- [ ] Enter valid credentials, click login → automatically navigates to original item URL
- [ ] Item loads and displays on map after post-auth redirect
- [ ] With authentication enabled and valid token, navigate to item URL → loads directly without login prompt
- [ ] Disable `APP_TOKEN_AUTH_ENABLED`, navigate to item URL → loads without authentication check
- [ ] With valid token, STAC API returns 403 → logout triggered, login screen appears with helpful message

---

## Cross-Phase Testing Strategy

### Integration Tests:
- End-to-end scenario: User receives shared item URL via email → opens in browser → item displays on map
- Navigation flow: User performs search → clicks item from results → views details → presses back button → search results restore
- Multi-item browsing: User navigates to item A URL → manually edits URL to item B → item B loads → presses back → item A restores
- Authentication flow: Unauthenticated user opens item URL → redirects to login → successful login → returns to item → item displays

### Manual Testing Steps:
1. Configure test environment with valid STAC API endpoint and TiTiler service
2. Navigate to item URL for sentinel-2-l2a collection with known valid item ID
3. Verify footprint displays in yellow highlight style on map
4. Verify imagery loads and renders correctly (may take 2-3 seconds)
5. Verify left panel switches to details tab and shows item metadata
6. Click "Enhanced Details" tab → verify properties and assets display
7. Edit URL to change item ID to another valid item → verify new item loads
8. Press browser back button → verify previous item restores
9. Press browser forward button → verify navigation history works
10. Edit URL to use invalid item ID → verify error banner displays
11. Edit URL to use unconfigured collection → verify error banner displays
12. Copy item URL and open in new browser tab/window → verify same item displays

## Performance Considerations

- **Item fetch latency**: Network request to STAC API typically 100-300ms; TiTiler imagery rendering 1-2 seconds for tile loading; total time to full visualization ~3 seconds on standard connections
- **Route loader caching**: TanStack Router includes built-in loader caching; subsequent visits to same item URL may skip fetch if cache valid (configurable cache duration)
- **Map performance**: Existing `debounceTitilerOverlay` uses 800ms debounce to prevent excessive tile requests during rapid navigation
- **Large item IDs**: URL encoding adds ~2x length for special characters; monitor production URLs to ensure they stay under practical 2,000 character limit for sharing

## Migration Notes

**No Data Migration Required**: This feature adds new routing capability without modifying existing data structures, configuration formats, or API interactions.

**Backward Compatibility**: Existing users will experience no disruption. Application continues working identically for search-based workflows. Direct item URLs are additive functionality.

**Deployment Considerations**: 
- For single-page application hosting (Netlify, Vercel, S3+CloudFront), ensure server-side routing fallback is configured to serve `index.html` for all paths
- Example Netlify `_redirects` file: `/* /index.html 200`
- Example Apache `.htaccess`: `RewriteRule ^ index.html [L]`

## References

- Original Issue: https://github.com/Element84/filmdrop-ui/issues/477
- Spec: `.paw/work/direct-link-routing-stac-items/Spec.md`
- Research: `.paw/work/direct-link-routing-stac-items/SpecResearch.md`, `.paw/work/direct-link-routing-stac-items/CodeResearch.md`
- TanStack Router Documentation: https://tanstack.com/router/latest
- STAC API Specification: https://github.com/radiantearth/stac-api-spec
- Similar implementation pattern in `mapHelper.js`: `src/utils/mapHelper.js:86-143` (mapClickHandler function)
