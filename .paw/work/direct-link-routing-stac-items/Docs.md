# Direct Link Routing to STAC Items - Feature Documentation

## Overview

FilmDrop UI now supports direct URL-based navigation to individual STAC items, enabling users to share and bookmark specific satellite scenes without requiring search interaction. Users can navigate directly to URLs like `/item/sentinel-2-l2a/S2A_17SNB_20230617_0_L2A` and immediately see the item visualized on the map with footprint rendering and TiTiler imagery.

This feature transforms FilmDrop from a session-based search tool into a fully linkable web application. When a user discovers a compelling satellite scene—such as a dramatic weather event or specific location—they can now share the exact view with colleagues, embed it in documentation, or bookmark it for later reference. Recipients opening the link immediately see the item displayed with all visualization capabilities intact.

The implementation integrates TanStack Router as a minimal overlay on FilmDrop's existing Redux-driven architecture. The router manages URL patterns and the History API while continuing to populate Redux states that trigger existing component rendering. This hybrid approach required no refactoring of existing components—they continue reading from Redux via `useSelector` hooks and work identically for both map-click selection and routed item access.

### Problem Solved

Before this feature:
- Users could not share links to specific satellite scenes
- All item viewing required manual search interaction
- Browser back/forward buttons did not work for navigation between items
- Bookmarking interesting scenes was impossible
- URLs remained static regardless of user context

After this feature:
- Direct URLs provide immediate access to specific items
- Browser navigation patterns (back/forward) work naturally
- URLs are shareable via email, chat, documentation
- Bookmarks preserve exact item context
- URL bar always reflects current viewing state

### User Experience

**Direct Item Access**: Navigate to `/item/sentinel-2-l2a/S2A_17SNB_20230617_0_L2A`:
1. Item metadata loads from STAC API (`/collections/{collectionId}/items/{itemId}`)
2. Map centers on item extent with footprint highlighted in yellow
3. TiTiler imagery renders (if collection has TiTiler configuration)
4. Left panel switches to details tab showing item metadata
5. Enhanced details tab displays properties and assets

**Browser Navigation**: 
- Back button returns to previously viewed items
- Forward button revisits items after navigation backward
- URL always reflects current item context
- Navigation works without full page reloads

**Error Handling**:
- Invalid item IDs display "Item not found" banner
- Unconfigured collections display "Collection not configured" banner
- Network failures show "Unable to load item" with retry guidance
- Authentication errors trigger logout and re-login flow
- Application remains functional after errors

## Architecture and Design

### High-Level Architecture

The routing implementation uses TanStack Router v1.139.14 integrated as a minimal overlay on FilmDrop's Redux-centric architecture. The router manages:
- URL pattern matching (`/item/:collectionId/:itemId`)
- History API interactions (pushState/replaceState)
- Route loading lifecycle (beforeLoad, loader, component)
- Navigation between routes

Existing components remain unchanged—they continue reading from Redux states (`clickResults`, `currentPopupResult`, `selectedPopupResultIndex`, `tabSelected`) and work identically for both map-click selection and routed item access.

### Design Decisions

**TanStack Router Choice**: Selected for type-safe routing, modern React integration, and built-in state management that works alongside Redux. Alternative approaches (React Router, manual History API) were considered but TanStack Router's loader pattern cleanly separated data fetching from rendering.

**Redux State Population Pattern**: Route loaders fetch data and dispatch Redux actions rather than managing local route state. This preserves compatibility with existing components (`PopupResults`, `EnhancedDetailsTab`) which expect Redux data. Components required zero modifications.

**Configuration-Driven Validation**: Collection validation uses existing `getCollectionConfig()` helper to check if collections exist in `config.json` before fetching items. This respects FilmDrop's deployment flexibility where different instances may configure different collections.

**Authentication Integration**: Route protection checks `APP_TOKEN_AUTH_ENABLED` flag and preserves target URLs for post-authentication redirect. This maintains consistency with existing authentication patterns across all STAC API services.

**Error Display Strategy**: Uses existing `showApplicationAlert()` utility to render error banners via the `SystemMessage` component at app root. This provides consistent user-facing error messages without custom error pages.

### Integration Points

**Router Provider Integration** (`src/index.jsx`):
- `RouterProvider` wraps `App` component
- Redux `Provider` remains outermost wrapper
- Both providers coexist without conflicts

**Route Configuration** (`src/router.jsx`):
- Root route renders `App` component
- Index route (`/`) maintains existing home behavior
- Item route (`/item/:collectionId/:itemId`) implements direct item access

**STAC API Service** (`src/services/get-item-service.js`):
- New service following existing patterns (authentication, credentials, error handling)
- Fetches individual items from `/collections/{collectionId}/items/{itemId}`
- Returns item GeoJSON or error object with status code

**Redux State Flow**:
1. Route loader fetches item
2. Dispatches actions: `setClickResults([item])`, `setCurrentPopupResult(item)`, `setselectedPopupResultIndex(0)`, `settabSelected('details')`
3. Components detect state changes via `useSelector` hooks
4. `PopupResults` and `EnhancedDetailsTab` render item details
5. Existing useEffect hooks in components trigger map visualization

**Map Visualization** (automatic via existing hooks):
- Footprint rendering: `L.geoJSON()` on `clickedSceneHighlightLayer`
- Imagery rendering: `debounceTitilerOverlay()` called by component hooks
- Auto-centering: `zoomToItemExtent()` if `SHOW_ITEM_AUTO_ZOOM` configured

## User Guide

### Prerequisites

- FilmDrop UI instance running with valid STAC API endpoint
- Collections configured in `public/config/config.json` (or `build/config/config.json` for production)
- (Optional) TiTiler instance for imagery visualization
- (Optional) Authentication configured if `APP_TOKEN_AUTH_ENABLED` is true

### Basic Usage

**Accessing Items via Direct URL**:

1. Construct URL pattern: `/item/{collectionId}/{itemId}`
   - Example: `/item/sentinel-2-l2a/S2A_17SNB_20230617_0_L2A`
   
2. Navigate to URL in browser
   - Item loads automatically
   - Map centers on item extent
   - Footprint displays in yellow highlight
   - Imagery renders if TiTiler configured
   - Details panel shows metadata

3. Share URL with colleagues
   - Copy URL from browser address bar
   - Send via email, chat, documentation
   - Recipients see identical view

**Browser Navigation**:

- **Back button**: Returns to previously viewed item
- **Forward button**: Revisits item after going back
- **Manual URL editing**: Change collection ID or item ID in URL and press Enter to navigate

**Error Recovery**:

- If "Item not found" appears: Verify item ID spelling and collection ID
- If "Collection not configured" appears: Check that collection exists in `config.json`
- If "Unable to load item" appears: Check network connection and STAC API availability

### Advanced Usage

**Special Characters in Item IDs**:

Item IDs containing colons, slashes, or other special characters are automatically encoded:
- Original ID: `S2A:17SNB/20230617_0_L2A`
- Encoded URL: `/item/sentinel-2-l2a/S2A%3A17SNB%2F20230617_0_L2A`
- TanStack Router automatically decodes when loading

Use the `buildItemUrl()` utility when programmatically constructing URLs:

```javascript
import { buildItemUrl } from './utils/routerHelper'

const url = buildItemUrl('sentinel-2-l2a', 'S2A:17SNB/20230617_0_L2A')
// Returns: '/item/sentinel-2-l2a/S2A%3A17SNB%2F20230617_0_L2A'
```

**Authentication Requirements**:

When `APP_TOKEN_AUTH_ENABLED` is true in `config.json`:

1. Unauthenticated users navigating to item URLs redirect to home (login screen)
2. Target URL preserved in sessionStorage as `POST_AUTH_REDIRECT_URL`
3. After successful login, user automatically redirects to original item URL
4. Authenticated users with valid tokens access items directly

Token expiration (403 responses) triggers automatic logout and re-login flow.

**Combining with Search**:

Users can:
1. Perform search to find items
2. Click item from results to view details
3. Copy URL from browser address bar (now reflects item route)
4. Share URL with others
5. Navigate back to search results using browser back button

Search state (filters, results, map viewport) is preserved when navigating back from item view.

### Configuration

**Collection Configuration**:

Items are only accessible for collections defined in `config.json`:

```json
{
  "COLLECTIONS_CONFIG": {
    "sentinel-2-l2a": {
      "sceneMinZoom": 9,
      "sceneTilerParams": {
        "baseUrl": "https://titiler.example.com",
        "collectionId": "sentinel-2-l2a",
        "colorFormula": "gamma RGB 3.5, sigmoidal RGB 15 0.35",
        "rescale": "0,10000"
      }
    }
  }
}
```

The router validates collections using `getCollectionConfig(collectionId, 'sceneMinZoom')` before fetching items. Unconfigured collections display error banners without API calls.

**Authentication Configuration**:

```json
{
  "APP_TOKEN_AUTH_ENABLED": true,
  "FETCH_CREDENTIALS": "include"
}
```

- `APP_TOKEN_AUTH_ENABLED`: When true, requires authentication token in localStorage
- `FETCH_CREDENTIALS`: Credential mode for fetch requests ('same-origin', 'include', 'omit')

**Map Auto-Centering**:

```json
{
  "SHOW_ITEM_AUTO_ZOOM": true
}
```

Controls whether map automatically centers on item extent when loading via URL. Applies to both direct URL access and map-click selection.

## Technical Reference

### Key Components

**Router Configuration** (`src/router.jsx`):
- Exports `router` instance created with `createRouter({ routeTree })`
- Defines root, index, and item routes
- Item route includes `beforeLoad` (authentication check) and `loader` (data fetching)

**Item Service** (`src/services/get-item-service.js`):
- `GetItemService(collectionId, itemId)`: Fetches individual STAC items
- Returns item GeoJSON on success or `{ error: true, status: number }` on failure
- Includes JWT authentication headers when `APP_TOKEN_AUTH_ENABLED` is true
- Calls `logoutUser()` on 403 responses to force re-authentication

**Router Helper** (`src/utils/routerHelper.js`):
- `buildItemUrl(collectionId, itemId)`: Constructs properly encoded item URLs
- Uses `encodeURIComponent()` for both collection and item IDs
- Returns string ready for browser navigation

### Behavior and Algorithms

**Item Loading Sequence**:

1. **URL Navigation**: User navigates to `/item/:collectionId/:itemId`
2. **Authentication Check** (`beforeLoad`):
   - Check `APP_TOKEN_AUTH_ENABLED` flag
   - Check localStorage for `APP_AUTH_TOKEN`
   - If auth required and no token: preserve URL in sessionStorage, redirect to home
   - If auth satisfied or not required: proceed to loader
3. **Configuration Loading** (`loader`):
   - Wait for `appConfig` to load (max 5 seconds)
   - If config fails: display error banner, return early
4. **Collections Loading**:
   - Trigger `GetCollectionsService()` if not already loaded
   - Wait for `collectionsData` to populate (max 15 seconds)
   - If collections fail: display error banner, return early
5. **Collection Validation**:
   - Call `getCollectionConfig(collectionId, 'sceneMinZoom')`
   - If returns `undefined`: display "Collection not configured" banner, return early
6. **Item Fetch**:
   - Call `GetItemService(collectionId, itemId)`
   - If 404: display "Item not found" banner, return early
   - If 403: display "Authentication required" banner, return early
   - If network error: display "Unable to load item" banner, return early
7. **Redux State Population**:
   - Find `selectedCollection` from `collectionsData`
   - Dispatch `setSelectedCollection(id)` and `setSelectedCollectionData(collection)`
   - Create `searchResultsObject` as FeatureCollection with item
   - Dispatch `setSearchResults()`, `setmappedScenes()`, `setClickResults()`
   - Dispatch `setCurrentPopupResult(item)`, `setselectedPopupResultIndex(0)`
   - Dispatch `settabSelected('details')`
8. **Component Rendering** (automatic):
   - `PopupResults` detects `currentPopupResult` change via `useSelector`
   - `EnhancedDetailsTab` displays properties and assets
   - useEffect hooks trigger map visualization (footprint, imagery, auto-center)

**Error Recovery**:
- All errors display user-facing banners via `showApplicationAlert()`
- Map remains visible and interactive after errors
- Navigation to other routes works without page refresh
- Retry possible by refreshing page or navigating to different item

### Error Handling

**Client-Side Validation Errors**:
- **Unconfigured Collection**: `showApplicationAlert('info', 'Collection "{collectionId}" is not configured in this deployment')`
  - Occurs when `getCollectionConfig()` returns `undefined`
  - No STAC API call made
  - User can navigate to different collection

**STAC API Errors**:
- **404 Not Found**: `showApplicationAlert('error', 'Item "{itemId}" not found in collection "{collectionId}"')`
  - Item does not exist in STAC catalog
  - Verify item ID spelling and collection ID correctness
- **403 Forbidden**: `showApplicationAlert('warning', 'Authentication required')`
  - Token expired or invalid
  - Triggers `logoutUser()` to clear token
  - User redirected to login screen
- **Network Errors**: `showApplicationAlert('error', 'Unable to load item. Please check your network connection and try again.')`
  - STAC API unreachable
  - Network timeout or connection failure
  - Retry by refreshing page

**Configuration Errors**:
- **Config Load Timeout**: `showApplicationAlert('error', 'Configuration failed to load')`
  - `appConfig` not populated within 5 seconds
  - Check `public/config/config.json` exists and is valid JSON
- **Collections Load Timeout**: `showApplicationAlert('error', 'Collections data failed to load')`
  - STAC `/collections` endpoint unreachable or slow
  - Verify STAC API availability

**Unexpected Errors**:
- **Uncaught Exceptions**: `showApplicationAlert('error', 'An unexpected error occurred while loading the item')`
  - Try-catch block in loader catches all unexpected errors
  - Error logged to console with full stack trace
  - Application remains functional for navigation to other routes

## Usage Examples

### Example 1: Sharing a Sentinel-2 Scene

User discovers a flood event in Sentinel-2 imagery:

1. Navigate to item via search or map click
2. Copy URL from browser: `https://filmdrop.example.com/item/sentinel-2-l2a/S2A_17SNB_20230617_0_L2A`
3. Send URL to emergency response team via email
4. Recipients click link and immediately see:
   - Map centered on flood extent
   - Item footprint highlighted in yellow
   - Sentinel-2 true color imagery rendered via TiTiler
   - Metadata panel showing acquisition date, cloud cover, processing level

### Example 2: Bookmarking Multiple Scenes for Comparison

Researcher analyzing land use change over time:

1. Navigate to scene from January: `/item/sentinel-2-l2a/S2A_17SNB_20230115_0_L2A`
2. Bookmark URL in browser: "Flood Plain - January 2023"
3. Navigate to scene from June: `/item/sentinel-2-l2a/S2A_17SNB_20230617_0_L2A`
4. Bookmark URL: "Flood Plain - June 2023"
5. Later, click bookmarks to switch between scenes
6. Browser back/forward buttons navigate between bookmarked scenes
7. Compare imagery and metadata without re-executing searches

### Example 3: Embedding in Documentation

Documentation author creating tutorial:

1. Write tutorial: "To see the reference scene, visit [this link](https://filmdrop.example.com/item/sentinel-2-l2a/S2A_17SNB_20230617_0_L2A)"
2. Readers click link and see exact scene referenced in tutorial
3. Tutorial remains accurate as long as STAC item exists
4. No need for screenshots or manual search instructions

## Edge Cases and Limitations

**Item ID Special Characters**:
- Item IDs with colons, slashes, dots are automatically encoded/decoded
- Very long item IDs (100+ characters) work but may be unwieldy in chat apps
- URLs remain shareable up to practical browser limit (~2000 characters)

**Collection Configuration Changes**:
- If collection's TiTiler parameters change in `config.json`, bookmarked URLs use updated configuration on next load
- No caching of stale configuration
- Collection removal from config makes existing item URLs display "Collection not configured" error

**Browser History Caching**:
- TanStack Router includes built-in loader caching
- Subsequent visits to same item URL may skip fetch if cache valid
- Cache duration configurable via router options (not customized in current implementation)
- Ensures responsive back/forward navigation

**Search State Preservation**:
- Navigating from search results to item preserves search state
- Browser back button returns to search results with filters and viewport intact
- Only works if user navigated from search to item within same session
- Direct URL access does not populate search state

**Authentication Token Expiration**:
- If token expires during item viewing, subsequent navigation triggers 403
- User logged out automatically and redirected to login
- Post-login redirect returns to originally requested item URL

**Network Timeouts**:
- Configuration load timeout: 5 seconds
- Collections load timeout: 15 seconds
- Item fetch timeout: Browser default (~30 seconds for most browsers)
- No automatic retry on timeout—user must refresh manually

**STAC API Compatibility**:
- Requires STAC API support for `/collections/{collectionId}/items/{itemId}` endpoint
- Endpoint must return standard STAC Item GeoJSON
- Non-standard STAC implementations may not work

## Testing Guide

### How to Test This Feature

**Test Direct URL Access**:

1. Start FilmDrop UI: `npm start`
2. Open browser to `http://localhost:5173`
3. Note: Home page loads normally (existing behavior)
4. Manually navigate to item URL: `http://localhost:5173/item/sentinel-2-l2a/S2A_17SNB_20230617_0_L2A`
   - Replace `sentinel-2-l2a` with a collection ID from your `config.json`
   - Replace `S2A_17SNB_20230617_0_L2A` with a valid item ID from your STAC API
5. Verify:
   - Map centers on item extent
   - Yellow footprint highlights item geometry
   - TiTiler imagery loads (spinner appears, then imagery renders)
   - Left panel switches to "Details" tab
   - Item metadata displays in details panel
   - "Enhanced Details" tab shows properties and assets

**Test Browser Navigation**:

1. Navigate to item A: `/item/sentinel-2-l2a/S2A_17SNB_20230617_0_L2A`
2. Note item A displays on map
3. Navigate to item B: `/item/sentinel-2-l2a/S2A_17SNB_20230620_0_L2A`
4. Note item B replaces item A on map
5. Click browser back button
6. Verify:
   - Item A restores
   - Map centers on item A extent
   - Footprint and imagery update to item A
   - URL changes to item A route
7. Click browser forward button
8. Verify:
   - Item B restores
   - All visualization updates to item B

**Test Error Handling**:

1. Navigate to invalid item ID: `/item/sentinel-2-l2a/INVALID_ITEM_ID`
2. Verify:
   - Error banner displays: "Item 'INVALID_ITEM_ID' not found in collection 'sentinel-2-l2a'"
   - Map remains visible and interactive
   - Can navigate to other routes without refresh
3. Navigate to unconfigured collection: `/item/unconfigured-collection/some-item-id`
4. Verify:
   - Error banner displays: "Collection 'unconfigured-collection' is not configured in this deployment"
   - No STAC API call attempted (check network tab)
5. Disconnect network (browser dev tools → Network → Offline)
6. Navigate to valid item URL
7. Verify:
   - Error banner displays: "Unable to load item. Please check your network connection and try again."
8. Reconnect network and refresh page
9. Verify item loads successfully

**Test Special Characters in Item IDs**:

1. Find item with special characters in ID (e.g., containing colon or slash)
2. Construct URL using `buildItemUrl()` utility or manual encoding
3. Navigate to URL
4. Verify:
   - Item loads correctly
   - Special characters decoded properly
   - No routing errors in console

**Test Authentication** (if `APP_TOKEN_AUTH_ENABLED` is true):

1. Clear localStorage: `localStorage.clear()`
2. Navigate to item URL: `/item/sentinel-2-l2a/S2A_17SNB_20230617_0_L2A`
3. Verify:
   - Redirect to home page
   - Login screen displays
   - Target URL preserved (check sessionStorage: `sessionStorage.getItem('POST_AUTH_REDIRECT_URL')`)
4. Enter valid credentials and login
5. Verify:
   - Automatically redirect to original item URL
   - Item loads and displays on map
6. With valid token, navigate directly to different item URL
7. Verify:
   - Item loads without login prompt
   - Authentication header included in API calls (check network tab)

**Test Search Integration**:

1. Perform search with date range and area of interest
2. Search results display on map
3. Click item from search results
4. Verify:
   - URL updates to `/item/{collectionId}/{itemId}`
   - Item details display in left panel
5. Click browser back button
6. Verify:
   - Return to search results page
   - Search filters remain unchanged
   - Search results still visible on map
   - Map viewport approximately preserved

### Manual Testing Checklist

- [ ] Direct URL navigation loads item within 3 seconds
- [ ] Map centers on item extent automatically
- [ ] Footprint displays in yellow highlight style
- [ ] TiTiler imagery renders (if collection configured)
- [ ] Details panel shows item metadata
- [ ] Enhanced details tab displays properties and assets
- [ ] Browser back button returns to previous item
- [ ] Browser forward button revisits next item
- [ ] URL changes reflect current item
- [ ] Invalid item ID displays error banner
- [ ] Unconfigured collection displays error banner
- [ ] Network failure displays error banner
- [ ] Application remains functional after errors
- [ ] Special characters in item IDs work correctly
- [ ] Authentication redirect preserves target URL
- [ ] Post-login redirect returns to original item
- [ ] Search state preserved when navigating back
- [ ] Bookmarked URLs work in new browser tabs
- [ ] Shared URLs work for other users

## Migration and Compatibility

### For Existing Users

**No Breaking Changes**: This feature is additive. Existing FilmDrop functionality works identically:
- Search workflows unchanged
- Map interactions unchanged
- Item selection via map click unchanged
- Existing configuration files compatible
- No data migration required

**New Capabilities Available Immediately**:
- Copy URLs from browser address bar after viewing items
- Share URLs with colleagues
- Bookmark items for later reference
- Use browser back/forward buttons for navigation
- Embed item URLs in documentation

### For Developers

**New Dependencies**:
- `@tanstack/react-router` v1.139.14 added to package.json
- Install with: `npm install`

**New Files**:
- `src/router.jsx`: Router configuration and route definitions
- `src/services/get-item-service.js`: STAC item fetch service
- `src/utils/routerHelper.js`: URL construction utilities

**Modified Files**:
- `src/index.jsx`: Added RouterProvider wrapper
- `src/components/Login/Login.jsx`: Added post-auth redirect logic
- `src/App.jsx`: No structural changes (router integrates seamlessly)

**Configuration Changes** (optional):
- No required configuration changes
- Existing `config.json` files work without modification
- Optional: Set `SHOW_ITEM_AUTO_ZOOM` to control map centering behavior

**API Requirements**:
- STAC API must support `/collections/{collectionId}/items/{itemId}` endpoint
- Most standard STAC API implementations include this endpoint
- Non-standard implementations may require backend updates

### Deployment Considerations

**Single-Page Application Hosting**:

For Netlify, Vercel, S3+CloudFront, or similar SPA hosting, configure server-side routing fallback to serve `index.html` for all paths.

**Netlify** (`public/_redirects` or `netlify.toml`):
```
/*    /index.html   200
```

**Vercel** (`vercel.json`):
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Apache** (`.htaccess`):
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

**Nginx**:
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

**Why This Matters**: Without server-side routing fallback, navigating directly to item URLs (e.g., `/item/sentinel-2-l2a/S2A_17SNB_20230617_0_L2A`) returns 404 errors from the web server. The fallback ensures all routes serve `index.html`, allowing client-side router to handle URL patterns.

### Backward Compatibility

**Configuration Files**: Both modern `COLLECTIONS_CONFIG` and legacy configuration formats work. The existing `normalizeCollectionsConfig()` function ensures compatibility during config load.

**Redux State**: All existing Redux states preserved. New routes populate the same states (`clickResults`, `currentPopupResult`, etc.) used by map-click selection, ensuring existing components work without modification.

**Components**: No changes to `PopupResults`, `EnhancedDetailsTab`, `LayerList`, or other existing components. They continue reading from Redux via `useSelector` hooks and work identically for routed items.

**Browser Support**: TanStack Router requires modern browsers supporting ES6 features. This aligns with FilmDrop's existing requirements (React 19, Leaflet, modern JavaScript). No additional browser compatibility concerns.

## References

- **Original Issue**: https://github.com/Element84/filmdrop-ui/issues/477
- **Specification**: `.paw/work/direct-link-routing-stac-items/Spec.md`
- **Implementation Plan**: `.paw/work/direct-link-routing-stac-items/ImplementationPlan.md`
- **Research Documents**:
  - `.paw/work/direct-link-routing-stac-items/SpecResearch.md` - Feature requirements research
  - `.paw/work/direct-link-routing-stac-items/CodeResearch.md` - Codebase architecture analysis
- **External Documentation**:
  - TanStack Router: https://tanstack.com/router/latest
  - STAC API Specification: https://github.com/radiantearth/stac-api-spec
  - STAC Item endpoint standard: https://github.com/radiantearth/stac-api-spec/tree/main/item-search#items-endpoint
