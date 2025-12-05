# Spec Research: Direct Link Routing to STAC Items

**Date**: 2025-12-05  
**Status**: Complete

## Summary

This research documents the current behavior of FilmDrop UI's navigation, state management, and item visualization systems to support the design of direct link routing to STAC items. Key findings include:

- **Navigation**: The application currently has no URL-based routing; navigation is purely state-driven through Redux. Item selection occurs via map clicks that trigger `mapClickHandler`, storing results in `clickResults` Redux state array.

- **State Management**: Item data flows through three Redux states: `clickResults` (array of clicked items), `currentPopupResult` (single active item), and `selectedPopupResultIndex` (integer index). The `PopupResults` component manages navigation between multiple clicked items via prev/next buttons.

- **API Patterns**: All STAC API calls follow a consistent pattern using fetch with optional JWT authentication headers when `APP_TOKEN_AUTH_ENABLED` is true. The application currently fetches items only through search endpoints returning FeatureCollections—there is no existing service for fetching individual items via `/collections/{collectionId}/items/{itemId}`.

- **Configuration**: Collection settings are accessed via `getCollectionConfig(collectionId, paramName)` which supports both the modern `COLLECTIONS_CONFIG` structure and legacy separate parameters with automatic migration. TiTiler parameters, minimum zoom levels, and popup display fields are all stored per-collection.

- **Visualization**: Item imagery is rendered using TiTiler by constructing URLs to `/stac/tiles/{z}/{x}/{y}` endpoints. Footprints are displayed using Leaflet's `L.geoJSON()` on the `clickedSceneHighlightLayer`. Map centering uses `zoomToItemExtent()` which calls `map.fitBounds()` on the item's bbox.

---

## Research Findings

### 1. Current Navigation and State Management

**Question**: How does the application currently handle navigation between the search view and item detail view? What triggers item selection and how is the selected item stored in Redux state?

**Answer**: FilmDrop UI currently operates as a single-page application with no URL-based routing. Navigation between views is managed entirely through Redux state, specifically the `tabSelected` state which toggles between 'filters', 'details', and 'enhanced' views in the left panel.

Item selection is triggered by the `mapClickHandler` function in `mapHelper.js`, which fires when a user clicks on the Leaflet map. The handler:
1. Creates click bounds from the click coordinates
2. Iterates through `searchResults.features` to find items whose bounds intersect the click point
3. Creates visual highlights using `L.geoJSON(feature, {style: clickedFootprintLayerStyle})` and adds them to `clickedSceneHighlightLayer`
4. Dispatches `setClickResults(intersectingFeatures)` to store the array of clicked items
5. Dispatches `settabSelected('details')` to switch the left panel view
6. Dispatches `setIsEnhancedDetailsExpanded(false)` and `sethasLeftPanelTabChanged(true)` to manage panel state

The clicked items are stored in the `clickResults` Redux state array. When multiple items are clicked at the same location, all intersecting items are added to this array.

**Evidence**: Code examination of `src/utils/mapHelper.js` lines 86-143, `src/redux/slices/mainSlice.js` lines 1-50, and `src/components/Layout/Content/LeftContent/LeftContent.jsx`.

**Implications**: Since there is no existing routing mechanism, the direct link routing feature will need to introduce a new navigation paradigm. The current click-based selection flow should be maintained for backward compatibility while adding URL-based navigation as an alternative entry point.

---

### 2. Redux State Structure for Item Data

**Question**: What is the current structure of the Redux state for item data (`clickResults`, `currentPopupResult`, `selectedPopupResultIndex`)? How is item metadata currently populated when a user clicks on a search result?

**Answer**: The Redux state manages item data through three related pieces of state in `mainSlice.js`:

- **`clickResults`**: Array of GeoJSON Feature objects representing all items at a clicked location. Initial value is empty array `[]`. Set by `setClickResults(array)` action.

- **`currentPopupResult`**: Single GeoJSON Feature object representing the currently displayed item. Initial value is `null`. Set by `setCurrentPopupResult(feature)` action. This is the item whose details are shown in the popup.

- **`selectedPopupResultIndex`**: Integer representing the index into the `clickResults` array for the currently displayed item. Initial value is `0`. Set by `setselectedPopupResultIndex(number)` action.

When a user clicks a search result on the map, the following sequence occurs:

1. `mapClickHandler` identifies intersecting features and dispatches `setClickResults(intersectingFeatures)`
2. `PopupResults` component's `useEffect` hook (lines 31-45) responds to changes in `clickResults`:
   - If `clickResults` has items and `currentPopupResult` is null or not in the array, it resets `selectedPopupResultIndex` to 0
   - Calls `debounceTitilerOverlay(results[selectedPopupResultIndex])` to load imagery
   - Dispatches `setCurrentPopupResult(results[selectedPopupResultIndex])` to set the active item
3. Another `useEffect` (lines 47-51) watches `selectedPopupResultIndex` and updates `currentPopupResult` when the index changes (via prev/next buttons)

Item metadata comes directly from the GeoJSON features in `searchResults` which are fetched from the STAC API `/search` endpoint. The features contain standard STAC Item properties including `id`, `collection`, `bbox`, `geometry`, `properties` (with fields like `datetime`, `platform`, `eo:cloud_cover`), `assets`, and `links`.

**Evidence**: Redux state definition in `src/redux/slices/mainSlice.js` lines 1-50, state update logic in `src/components/PopupResults/PopupResults.jsx` lines 31-51, and GeoJSON structure visible in `src/testing/shared-mocks.js` mock data.

**Implications**: The direct link routing implementation will need to populate these same three Redux state values to maintain compatibility with existing components. When loading an item from a direct URL, the system should fetch the item, create a `clickResults` array containing it, set `selectedPopupResultIndex` to 0, and set `currentPopupResult` to the fetched item.

---

### 3. Map Centering Logic

**Question**: How does the existing map centering logic work when an item is selected? Identify the functions in `mapHelper.js` or related utilities that control map viewport (center, zoom, bounds).

**Answer**: Map viewport control is managed through several functions in `mapHelper.js`:

**Core Functions:**
- **`zoomToBounds(bounds)`** (line 243): Private function that calls `map.fitBounds(bounds)` to adjust viewport to contain the specified Leaflet bounds object
- **`setMapZoomLevel(level)`** (line 250): Public function that calls `map.setZoom(level)` to set a specific zoom level
- **`zoomToItemExtent(item)`** (line 292): Public function that takes a STAC item, converts its `item.bbox` to Leaflet bounds using `leafletBoundsFromBBOX()`, then calls `zoomToBounds()`
- **`zoomToCollectionExtent(collection)`** (line 277): Public function that zooms to a collection's extent from `collection.extent.spatial.bbox[0]`, but only if the current viewport doesn't already contain the collection bounds

**Helper Functions:**
- **`leafletBoundsFromBBOX(bbox)`** (line 257): Converts a STAC bbox array `[minX, minY, maxX, maxY]` to a Leaflet LatLngBounds object
- **`bboxFromMapBounds()`** (line 264): Inverse operation - gets current map bounds and returns them as a bbox array
- **`getCurrentMapZoomLevel()`** (line 299): Returns the current map zoom level via `map.getZoom()`

**When Items Are Selected:**
The `PopupResult` component (which displays individual item details) includes an `_autoCenterOnItemChanged` selector that determines whether to automatically center the map when the item changes. When enabled, `useEffect` at line 31-50 calls `zoomToItemExtent(props.result)` to fit the map to the item's extent.

The `autoCenterOnItemChanged` state is user-configurable via the `SHOW_ITEM_AUTO_ZOOM` configuration flag.

**Evidence**: Function implementations in `src/utils/mapHelper.js` lines 243-302, and auto-centering logic in `src/components/PopupResult/PopupResult.jsx` lines 31-50.

**Implications**: Direct link routing should leverage the existing `zoomToItemExtent()` function to center the map on the loaded item. The behavior should respect the `SHOW_ITEM_AUTO_ZOOM` configuration to maintain consistency with user expectations.

---

### 4. Authentication Patterns

**Question**: What authentication patterns are currently implemented? How does `APP_TOKEN_AUTH_ENABLED` affect application behavior? Where in the codebase are authentication checks performed?

**Answer**: FilmDrop implements optional JWT bearer token authentication controlled by the `APP_TOKEN_AUTH_ENABLED` configuration flag.

**Authentication Flow:**
1. **Login**: `Login` component at `src/components/Login/Login.jsx` submits username/password to `AuthService` in `src/services/post-auth-service.js`
2. **Token Storage**: `AuthService` posts to `config.AUTH_URL`, receives `access_token` in response, stores it in localStorage as 'APP_AUTH_TOKEN', and sets `authTokenExists` Redux state to true
3. **Application Gating**: `App.jsx` checks if `APP_TOKEN_AUTH_ENABLED` is true and `authTokenExists` is false; if so, displays `Login` component instead of main application
4. **Token Usage**: All STAC API service files check localStorage for 'APP_AUTH_TOKEN' and, if present and `APP_TOKEN_AUTH_ENABLED` is true, add an `Authorization: Bearer ${JWT}` header to requests

**Service Files with Authentication:**
- `get-search-service.js` (lines 13-19)
- `get-collections-service.js` (lines 12-17)
- `get-aggregations-service.js` (lines 4-10)
- `get-queryables-service.js` (lines 4-10)

**Authentication Header Pattern:**
```javascript
const requestHeaders = new Headers()
const JWT = localStorage.getItem('APP_AUTH_TOKEN')
const isSTACTokenAuthEnabled = store.getState().mainSlice.appConfig.APP_TOKEN_AUTH_ENABLED ?? false
if (JWT && isSTACTokenAuthEnabled) {
  requestHeaders.append('Authorization', `Bearer ${JWT}`)
}
```

**Logout**: The `logoutUser()` function in `src/utils/authHelper.js` removes 'APP_AUTH_TOKEN' from localStorage and sets `authTokenExists` to false, which triggers the App component to show the login screen.

**Error Handling**: 403 responses in `GetCollectionsService` trigger `logoutUser()` and display an alert about bad token or missing STAC auth configuration.

**Evidence**: Authentication flow in `src/App.jsx` lines 48-70, token storage in `src/services/post-auth-service.js` lines 6-40, header addition pattern repeated across service files, logout logic in `src/utils/authHelper.js`.

**Implications**: Direct link routing must respect authentication requirements. When `APP_TOKEN_AUTH_ENABLED` is true and no token exists, the application should either redirect to login or require authentication before allowing item access. The spec mentions a route protection flag in `config.json` for controlling whether direct item links require authentication.

---

### 5. URL Construction for External Links

**Question**: How does the application currently construct URLs for external links (Dashboard, Analyze buttons, Launch URL)? Are there any existing URL construction patterns that handle special characters or encoding?

**Answer**: The application constructs external URLs in a straightforward manner without special encoding logic:

**Dashboard and Analyze Buttons** (`PageHeader.jsx` lines 16-20):
```javascript
function onDashboardClick() {
  window.open(_appConfig.DASHBOARD_BTN_URL, '_blank')
}

function onAnalyzeClick() {
  window.open(_appConfig.ANALYZE_BTN_URL, '_blank')
}
```
These URLs are used directly from configuration without encoding or parameter construction.

**Action Button** (`RightContent.jsx` line 85):
```javascript
function onActionClick() {
  window.open(_appConfig.ACTION_BUTTON.url, '_blank')
}
```

**No URL Parameter Encoding**: There are no existing patterns for URL parameter encoding in external link construction. The application does not append query parameters or encode special characters when opening external URLs.

**Internal API URL Construction**: When constructing STAC API URLs, the application uses template strings:
- Search: `` `${STAC_API_URL}/search?${searchParams}` ``
- Collections: `` `${STAC_API_URL}/collections` ``
- Aggregations: `` `${STAC_API_URL}/collections/${collectionId}/aggregations` ``

The `searchParams` are constructed using `URLSearchParams` in `searchHelper.js` which handles encoding automatically, but this is for API calls, not user-facing URLs.

**TiTiler URL Construction** (`mapHelper.js` line 405): TiTiler URLs are constructed with the STAC item's self link:
```javascript
`${sceneTilerURL}/stac/tiles/{z}/{x}/{y}@${scale()}x.png?url=${featureURL}&${tilerParams}`
```
The `featureURL` (item self link) is inserted directly without encoding, relying on the STAC API to provide valid URLs.

**Evidence**: External link handlers in `src/components/Layout/PageHeader/PageHeader.jsx` lines 16-24 and `src/components/Layout/Content/RightContent/RightContent.jsx` line 85, API URL construction in service files, TiTiler URL in `src/utils/mapHelper.js` line 405.

**Implications**: The direct link routing feature will need to introduce URL encoding/decoding for item IDs in route parameters. Since item IDs can contain special characters (colons, slashes), the implementation must use `encodeURIComponent()` when constructing URLs and `decodeURIComponent()` when parsing route parameters.

---

### 6. STAC API Endpoints Usage

**Question**: What STAC API endpoints does the application currently use? Document the patterns in existing service files (`get-search-service.js`, `get-collections-service.js`, etc.) including how they construct URLs, handle authentication headers, and process responses.

**Answer**: The application uses the following STAC API endpoints:

**Endpoints:**
1. **`/collections`**: Fetches available collections (GetCollectionsService)
2. **`/search`**: Searches for items with query parameters (SearchService)
3. **`/collections/{collectionId}/aggregations`**: Fetches aggregation data (GetCollectionAggregationsService)
4. **`/collections/{collectionId}/queryables`**: Fetches queryable properties (GetCollectionQueryablesService)
5. **`/aggregate`**: Performs aggregated searches (AggregateSearchService)

**Common Service Pattern:**

All services follow this structure:

```javascript
export async function ServiceName(params) {
  // 1. Setup authentication headers
  const requestHeaders = new Headers()
  const JWT = localStorage.getItem('APP_AUTH_TOKEN')
  const isSTACTokenAuthEnabled = 
    store.getState().mainSlice.appConfig.APP_TOKEN_AUTH_ENABLED ?? false
  if (JWT && isSTACTokenAuthEnabled) {
    requestHeaders.append('Authorization', `Bearer ${JWT}`)
  }
  
  // 2. Make fetch request
  await fetch(`${STAC_API_URL}/endpoint`, {
    credentials: store.getState().mainSlice.appConfig.FETCH_CREDENTIALS || 'same-origin',
    headers: requestHeaders
  })
    // 3. Check response status
    .then((response) => {
      if (response.ok) {
        return response.json()
      }
      throw new Error()
    })
    // 4. Process response data
    .then((json) => {
      // Dispatch to Redux or return data
    })
    // 5. Error handling
    .catch((error) => {
      console.error('Error message', error)
    })
}
```

**URL Construction:**
- Base URL comes from `appConfig.STAC_API_URL`
- Endpoint paths are template literals: `` `${STAC_API_URL}/collections` ``
- Collection IDs are inserted directly: `` `${STAC_API_URL}/collections/${collectionId}/aggregations` ``
- Search parameters use URLSearchParams: `` `${STAC_API_URL}/search?${searchParams}` ``

**Authentication Headers:**
- Conditionally added based on `APP_TOKEN_AUTH_ENABLED` flag
- Uses Bearer token from localStorage 'APP_AUTH_TOKEN'
- All API requests include `credentials` property from config (defaults to 'same-origin')

**Response Processing:**
- Responses are parsed as JSON
- Search results dispatch to `setSearchResults(json)` and extract features
- Collections data is transformed by `buildCollectionsData(json)` before storing
- Aggregations return `json.aggregations`
- Errors are logged to console with descriptive messages

**Evidence**: Service implementations in `src/services/get-search-service.js`, `src/services/get-collections-service.js`, `src/services/get-aggregations-service.js`, `src/services/get-queryables-service.js`.

**Implications**: A new service for fetching individual items should follow the same pattern for consistency. The endpoint will be `/collections/{collectionId}/items/{itemId}` per STAC spec.

---

### 7. Individual STAC Item Fetching

**Question**: Does the application currently fetch individual STAC items (single item endpoint `/collections/{collectionId}/items/{itemId}`)? Or does it only fetch items via search endpoints that return feature collections?

**Answer**: The application currently **does not** fetch individual STAC items via the single item endpoint. All item data is obtained through search endpoints that return FeatureCollections.

**Current Item Access Methods:**
1. **Scene Search** (`/search`): Returns FeatureCollection with items matching spatial/temporal/property filters
2. **Grid Code Search** (`/search`): Returns items within specific grid cells
3. **Hex Aggregation** (`/aggregate`): Returns aggregated hex cells, then searches for items within clicked cells

After search results are returned as a FeatureCollection, users click on map footprints to select items. The selected items are GeoJSON Features from the search results array - no additional API calls are made to fetch individual item metadata.

**Item Self Links:**
Items do have self links in their `links` array (e.g., `{rel: 'self', href: 'https://earth-search.aws.element84.com/v1/collections/sentinel-2-l2a/items/S2A_17SNB_20230617_0_L2A'}`), but these are only used:
- In TiTiler URL construction for imagery rendering (`mapHelper.js` line 377-405): The self link is passed as the `url` parameter to TiTiler's `/stac/tiles` endpoint
- In the fetch within `addImageOverlay()` to retrieve the full item JSON including bbox for tile bounds setup

The fetch in `addImageOverlay()` (line 381) does retrieve the full item from its self link, but this is for tile rendering purposes, not for populating item metadata in the UI. The metadata displayed in popups comes from the original search results.

**Evidence**: No service file exists for fetching individual items. Search services in `src/services/get-search-service.js` and `src/services/get-aggregate-service.js` return FeatureCollections. The only fetch of an item self link is in `src/utils/mapHelper.js` line 381 for TiTiler bounds setup. Mock data in `src/testing/shared-mocks.js` shows item self links but no individual item endpoint calls.

**Implications**: Direct link routing will require creating a new service function to fetch individual items from `/collections/{collectionId}/items/{itemId}`. This service should follow the same authentication and error handling patterns as existing services.

---

### 8. STAC API Error Handling

**Question**: How does the application handle STAC API errors in existing service files? What error handling patterns are established (try/catch blocks, promise rejections, error state management)?

**Answer**: The application uses a consistent promise-based error handling pattern across all STAC API service files:

**Standard Pattern:**
```javascript
await fetch(url, options)
  .then((response) => {
    if (response.ok) {
      return response.json()
    }
    // Option 1: Simple throw
    throw new Error()
    
    // Option 2: Enhanced error (GetCollectionsService only)
    const error = new Error('Server responded with an error')
    error.status = response.status
    error.statusText = response.statusText
    // Attempt to parse JSON error body
    if (contentType && contentType.includes('application/json')) {
      return response.json().then((err) => {
        error.response = err
        throw error
      })
    }
    throw error
  })
  .then((json) => {
    // Process successful response
    // Dispatch to Redux or return data
  })
  .catch((error) => {
    // Log error
    console.error('Error message', error)
    
    // Specific handling for 403 in GetCollectionsService:
    if (error.status === 403) {
      store.dispatch(setapplicationAlertMessage(
        'STAC API returned 403. Bad Token OR needs STAC Auth Enabled in config.'
      ))
      store.dispatch(setshowApplicationAlert(true))
      logoutUser()
    }
  })
```

**Error Handling Characteristics:**
- **No try/catch blocks**: All services use promise-based `.then()/.catch()` chains
- **Response status checking**: `response.ok` check in first `.then()`; non-OK responses throw errors
- **Generic errors**: Most services throw basic `Error` objects without details
- **Console logging**: All services log errors with descriptive messages via `console.error()`
- **State cleanup**: Services like `SearchService` dispatch `setSearchLoading(false)` in the catch block
- **No user-facing error messages**: Most errors are only logged to console, not displayed to users via alerts (except 403 in collections)
- **Special 403 handling**: Only `GetCollectionsService` has specific logic for 403 responses, which triggers logout and displays an alert

**Error State Management:**
The application does not have dedicated error state in Redux for API failures. The `applicationAlertMessage` and `showApplicationAlert` states exist for displaying system messages, but they're rarely used for API errors.

**Evidence**: Error handling in `src/services/get-search-service.js` lines 35-43, `src/services/get-collections-service.js` lines 21-85, `src/services/get-aggregations-service.js` lines 26-31, `src/services/get-queryables-service.js` lines 26-31.

**Implications**: Direct link routing should follow the established promise-based error handling pattern. Error conditions (404 for missing items, collection validation failures, network errors) should use the `alertHelper.js` utility to display user-friendly messages via error banners, as specified in the requirements.

---

### 9. COLLECTIONS_CONFIG Structure

**Question**: What is the structure of `COLLECTIONS_CONFIG` in `config.json`? How does the application access collection-specific settings like `sceneTilerParams`, `sceneMinZoom`, and TiTiler configuration?

**Answer**: `COLLECTIONS_CONFIG` is a modern configuration structure introduced to consolidate collection-specific parameters. The structure groups all settings for each collection under a single key:

**Structure:**
```json
{
  "COLLECTIONS_CONFIG": {
    "collection-id": {
      "sceneTilerParams": {
        "assets": ["red", "green", "blue"],
        "color_formula": "Gamma+RGB+3.2",
        "nodata": 0,
        "bidx": "1,2,3",
        "rescale": ["-1000,4000"],
        "colormap_name": "terrain",
        "colormap": {"0": "#000000", "1": "#419bdf"},
        "expression": "B1*0.5"
      },
      "mosaicTilerParams": {
        // Same properties as sceneTilerParams
      },
      "sceneMinZoom": 7,
      "popupDisplayFields": ["datetime", "platform", "eo:cloud_cover"],
      "tileLayerParams": {
        "tileSize": 256,
        "minZoom": 2,
        "maxZoom": 26,
        "opacity": 1.0
      },
      "enhancedDisplayConfig": {
        "property_groups": [...],
        "asset_groups": [...]
      }
    }
  }
}
```

**Legacy Format:**
The application also supports legacy configuration with separate top-level keys:
- `SCENE_TILER_PARAMS[collection-id]`
- `MOSAIC_TILER_PARAMS[collection-id]`
- `SEARCH_MIN_ZOOM_LEVELS[collection-id].high`
- `POPUP_DISPLAY_FIELDS[collection-id]`
- `TILE_LAYER_PARAMS[collection-id]`
- `ENHANCED_DISPLAY_CONFIG[collection-id]`

**Automatic Migration:**
The `normalizeCollectionsConfig(config)` function in `configHelper.js` (lines 129-241) automatically migrates legacy format to the new structure:
- Detects if `COLLECTIONS_CONFIG` exists and is populated
- If not, scans legacy parameters to build `COLLECTIONS_CONFIG`
- Preserves legacy parameters for backward compatibility
- Converts `SEARCH_MIN_ZOOM_LEVELS[id].high` to `sceneMinZoom`
- Logs warning if both formats exist (new format takes precedence)

**Access Pattern:**
Collection settings are accessed via `getCollectionConfig(collectionId, paramName, config)` helper (lines 244-281):
- Checks `COLLECTIONS_CONFIG[collectionId][paramName]` first
- Falls back to legacy parameter if not found
- Special handling for `sceneMinZoom`: extracts `.high` value from legacy object
- Returns `undefined` if parameter doesn't exist
- Optional third parameter allows passing custom config object (for testing)

**Evidence**: Configuration structure documented in `CONFIGURATION.md` lines 137-192, example config in `public/config/config.json`, migration logic in `src/utils/configHelper.js` lines 129-241, accessor function at lines 244-281, tests demonstrating both formats in `src/utils/configHelper.test.js`.

**Implications**: Direct link routing implementation can assume `getCollectionConfig()` will work correctly regardless of whether the deployment uses modern or legacy configuration format. Code should not access config directly but always use the helper function.

---

### 10. getCollectionConfig() Helper Function

**Question**: How does the `getCollectionConfig()` helper function work? What does it return when a collection ID is not found in configuration?

**Answer**: The `getCollectionConfig()` helper function provides unified access to collection-specific configuration with automatic fallback to legacy parameters.

**Function Signature:**
```javascript
getCollectionConfig(collectionId, paramName, config = null)
```

**Parameters:**
- `collectionId`: String collection identifier (e.g., 'sentinel-2-l2a')
- `paramName`: String parameter name ('sceneTilerParams', 'mosaicTilerParams', 'sceneMinZoom', 'popupDisplayFields', 'tileLayerParams', 'enhancedDisplayConfig')
- `config`: Optional config object for testing (defaults to `store.getState().mainSlice.appConfig`)

**Lookup Logic:**
1. Gets `appConfig` from parameter or Redux store
2. Returns `undefined` if `appConfig` is null/undefined
3. Checks new format: `appConfig.COLLECTIONS_CONFIG?.[collectionId]?.[paramName]`
4. If found, returns the value immediately
5. If not found, attempts legacy fallback using mapping:
   - `sceneTilerParams` → `SCENE_TILER_PARAMS[collectionId]`
   - `mosaicTilerParams` → `MOSAIC_TILER_PARAMS[collectionId]`
   - `sceneMinZoom` → `SEARCH_MIN_ZOOM_LEVELS[collectionId].high` (or `.medium` if object)
   - `popupDisplayFields` → `POPUP_DISPLAY_FIELDS[collectionId]`
   - `tileLayerParams` → `TILE_LAYER_PARAMS[collectionId]`
   - `enhancedDisplayConfig` → `ENHANCED_DISPLAY_CONFIG[collectionId]`
6. Returns legacy value if found
7. Returns `undefined` if parameter doesn't exist in either format

**Return Values:**
- **When parameter exists**: Returns the configuration object or value (object, array, number, etc.)
- **When collection ID doesn't exist**: Returns `undefined`
- **When parameter name doesn't exist for collection**: Returns `undefined`
- **When appConfig is null**: Returns `undefined`

**Special Handling:**
For `sceneMinZoom`, if the legacy value is an object (e.g., `{medium: 4, high: 7}`), the function extracts the `high` value. This handles the legacy `SEARCH_MIN_ZOOM_LEVELS` structure which had multiple zoom level tiers.

**Usage Examples:**
```javascript
// Get TiTiler parameters for a collection
const tilerParams = getCollectionConfig('sentinel-2-l2a', 'sceneTilerParams')
// Returns: {assets: ["visual"], nodata: 0} or undefined

// Get minimum zoom level
const minZoom = getCollectionConfig('sentinel-2-l2a', 'sceneMinZoom')
// Returns: 7 or undefined

// Check if configuration exists
if (!getCollectionConfig(collectionId, 'sceneTilerParams')) {
  // Handle missing configuration
}
```

**Evidence**: Function implementation in `src/utils/configHelper.js` lines 244-281, test cases in `src/utils/configHelper.test.js` lines 265-360 demonstrating all return scenarios, usage throughout codebase in `src/utils/mapHelper.js` and components.

**Implications**: Direct link routing should use `getCollectionConfig()` to validate that a collection ID exists and has required configuration before attempting to fetch or display items. When validating collection IDs from URLs, checking if `getCollectionConfig(collectionId, 'sceneMinZoom')` or another required parameter returns `undefined` indicates an unconfigured collection.

---

### 11. TiTiler Imagery Rendering

**Question**: How does the application currently render STAC item imagery on the map using TiTiler? Identify the code that constructs TiTiler URLs and creates Leaflet image overlays.

**Answer**: Item imagery is rendered through the `addImageOverlay()` function in `mapHelper.js`, which is debounced and called when items are selected.

**Rendering Flow:**

1. **Trigger**: `debounceTitilerOverlay(item)` is called (800ms debounce) when:
   - Item is selected from `PopupResults` (line 41)
   - User navigates between items in `EnhancedDetailsTab` (line 44)
   - Item changes in `PopupResult` (line 35)

2. **Validation** (`addImageOverlay()` function, lines 356-366):
   ```javascript
   const sceneTilerURL = appConfig.SCENE_TILER_URL || ''
   const sceneTilerParams = getCollectionConfig(item?.collection, 'sceneTilerParams')
   if (!item || !sceneTilerURL || !sceneTilerParams) {
     store.dispatch(setimageOverlayLoading(false))
     return // Exit if prerequisites missing
   }
   ```

3. **Preparation** (lines 367-380):
   - Sets `imageOverlayLoading` to true (shows spinner)
   - Clears existing imagery: `clearLayer('clickedSceneImageLayer')`
   - Extracts item self link: `item?.links?.find((x) => x?.rel === 'self')?.href`
   - Constructs tiler parameters: `constructSceneTilerParams(selectedCollectionData.id)`

4. **Fetch Item for Bounds** (lines 381-389):
   Fetches full item JSON from self link to get bbox:
   ```javascript
   fetch(featureURL, {credentials: appConfig.FETCH_CREDENTIALS || 'same-origin'})
     .then(response => response.json())
     .then(json => {
       const tileBounds = setupBounds(json.bbox)
       // Continue with tile layer creation...
     })
   ```

5. **Create Tile Layer** (lines 390-418):
   ```javascript
   const collectionTileLayerParams = getTileLayerParams(selectedCollectionData.id)
   const tileLayerParams = {
     ...DEFAULT_TILE_LAYER_PARAMS,
     ...collectionTileLayerParams,
     bounds: tileBounds
   }
   const currentSelectionImageTileLayer = L.tileLayer(
     `${sceneTilerURL}/stac/tiles/{z}/{x}/{y}@${scale()}x.png?url=${featureURL}&${tilerParams}`,
     tileLayerParams
   )
   ```

6. **Add to Map** (lines 405-418):
   - Attaches load event: sets `imageOverlayLoading` to false
   - Attaches tileerror event: logs errors, sets loading to false
   - Finds `clickedSceneImageLayer` and adds tile layer to it

**TiTiler URL Format:**
```
{SCENE_TILER_URL}/stac/tiles/{z}/{x}/{y}@{scale}x.png?url={item_self_link}&{tiler_params}
```

**Tiler Parameters Construction** (`constructSceneTilerParams()`, lines 451-479):
Builds query string from `sceneTilerParams` config:
- `assets`: Multi-value for compositing (e.g., `assets=red&assets=green&assets=blue`)
- `asset_bidx`: Band indices per asset (e.g., `asset_bidx=red|1`)
- `nodata`: No-data value
- `color_formula`: Color adjustments (e.g., `Gamma+RGB+3.2`)
- `expression`: Band math expressions
- `rescale`: Value rescaling (e.g., `rescale=-1000,4000`)
- `colormap_name`: Named colormaps (e.g., `terrain`)
- `colormap`: Custom colormaps as JSON

**Layer Management:**
- Imagery goes into `clickedSceneImageLayer` (z-index 650, imagery pane)
- Layer is non-interactive (pointer-events: none)
- Only one image overlay exists at a time (cleared before adding new)

**Evidence**: Main rendering logic in `src/utils/mapHelper.js` lines 350-420, parameter construction at lines 451-527, layer setup in `src/components/LeafMap/LeafMap.jsx` lines 113-120, debounce wrapper at line 350.

**Implications**: Direct link routing should trigger the same rendering flow by calling `debounceTitilerOverlay()` with the fetched item. This maintains consistency with existing visualization and respects collection-specific TiTiler configuration.

---

### 12. Footprint Display on Map

**Question**: How does the application display item footprints (geometry) on the map? What Leaflet layers or components are used to render GeoJSON geometries?

**Answer**: Item footprints are rendered as GeoJSON polygons on Leaflet using styled FeatureGroup layers.

**Layer Structure:**
The map has three main FeatureGroup layers for footprints, created in `LeafMap.jsx` (lines 102-120):

1. **`searchResultsLayer`**: Shows all search result footprints
   - Blue style (`footprintLayerStyle`: #3183f5, weight 1, fillOpacity 0.1)
   - z-index 600, searchResults pane

2. **`clickedSceneHighlightLayer`**: Highlights selected items
   - Gold style (`clickedFootprintLayerStyle`: #BEA835, weight 4, fillOpacity 0)
   - z-index 600, searchResults pane

3. **`cartFootprintsLayer`**: Shows items in cart
   - Orange style (`cartFootprintLayerStyle`: #ad5c11, weight 3, fillOpacity 0.1)
   - z-index 600, searchResults pane, non-interactive

**Rendering Process:**

**Search Results** (via `SearchService`, lines 40-43):
```javascript
const options = {style: footprintLayerStyle}
addDataToLayer(json, 'searchResultsLayer', options, true)
```

**Clicked Items** (via `mapClickHandler`, lines 112-120):
```javascript
const clickedFootprintsFound = L.geoJSON(feature, {
  style: clickedFootprintLayerStyle
})
map.eachLayer(function (layer) {
  if (layer.layer_name === 'clickedSceneHighlightLayer') {
    clickedFootprintsFound.addTo(layer)
  }
})
```

**Cart Items** (via `setScenesForCartLayer()`, lines 68-82):
```javascript
const cartGeojson = {
  type: 'FeatureCollection',
  features: store.getState().mainSlice.cartItems
}
const options = {
  style: cartFootprintLayerStyle,
  interactive: false
}
addDataToLayer(cartGeojson, 'cartFootprintsLayer', options, true)
```

**Core Helper Function:**
`addDataToLayer(geojson, layerName, options, clearExisting)` (lines 170-190):
- Iterates through map layers to find target layer by `layer_name`
- Optionally clears existing content if `clearExisting` is true
- Calls `L.geoJSON(geojson, options).addTo(layer)` to render
- Brings `cartFootprintsLayer` to front to ensure cart items are visible on top

**Layer Clearing:**
`clearLayer(layerName)` (lines 192-200): Calls `layer.clearLayers()` on matching layer name

**Styles:**
Styles are defined as objects in `mapHelper.js` (lines 23-58) with properties:
- `color`: Border color
- `weight`: Border width
- `opacity`: Border opacity  
- `fillOpacity`: Fill transparency
- `fillColor`: Fill color (for some styles)
- `pane`: Leaflet pane name for z-ordering

**Evidence**: Layer initialization in `src/components/LeafMap/LeafMap.jsx` lines 102-120, `addDataToLayer` function in `src/utils/mapHelper.js` lines 170-190, style definitions at lines 23-58, rendering calls in `src/services/get-search-service.js` lines 40-43 and `src/utils/mapHelper.js` lines 112-120.

**Implications**: Direct link routing should render the fetched item's footprint on `clickedSceneHighlightLayer` using the same `L.geoJSON(feature, {style: clickedFootprintLayerStyle})` pattern. This provides visual confirmation that the item is selected and maintains consistency with the existing click-based selection.

---

### 13. Item Selection Flow Sequence

**Question**: What is the sequence of operations when a user selects an item from search results? Trace the flow from click event through Redux dispatch to map visualization.

**Answer**: The complete item selection flow follows this sequence:

**1. User Clicks Map** (Leaflet map click event):
   - Event captured by `map.on('click', mapClickHandler)` registered in `LeafMap.jsx` line 156
   - `mapClickHandler(e)` function called with click coordinates

**2. Clear Previous Selection** (`mapClickHandler`, line 98):
   ```javascript
   clearMapSelection()
   ```
   - Clears `clickedSceneHighlightLayer` and `clickedSceneImageLayer`
   - Dispatches `setClickResults([])` and `setCurrentPopupResult(null)`

**3. Find Intersecting Features** (`mapClickHandler`, lines 107-141):
   - Creates `clickBounds` from click coordinates
   - Iterates through `searchResults.features`
   - For each feature, gets bounds with `L.geoJSON(feature).getBounds()`
   - Checks if `featureBounds.intersects(clickBounds)`
   - Accumulates matching features in `intersectingFeatures` array
   - For each match, creates highlight: `L.geoJSON(feature, {style: clickedFootprintLayerStyle})` and adds to `clickedSceneHighlightLayer`

**4. Update Redux State** (`mapClickHandler`, lines 128-132):
   ```javascript
   store.dispatch(setClickResults(intersectingFeatures))
   store.dispatch(settabSelected('details'))
   store.dispatch(setIsEnhancedDetailsExpanded(false))
   store.dispatch(sethasLeftPanelTabChanged(true))
   ```

**5. PopupResults Component Reacts** (triggered by `clickResults` change):
   
   **First useEffect** (lines 31-45):
   - Checks if `clickResults` has items
   - Validates `currentPopupResult` is in the array, resets index if not
   - Calls `debounceTitilerOverlay(results[selectedPopupResultIndex])`
   - Dispatches `setCurrentPopupResult(results[selectedPopupResultIndex])`
   - Dispatches `setimageOverlayLoading(false)` on cleanup

**6. TiTiler Overlay Loads** (debounced, 800ms):
   - `debounceTitilerOverlay` calls `addImageOverlay(item)`
   - Validates item, SCENE_TILER_URL, and sceneTilerParams
   - Sets `imageOverlayLoading` to true (shows spinner)
   - Clears `clickedSceneImageLayer`
   - Fetches item from self link for bbox
   - Constructs TiTiler URL with assets and parameters
   - Creates `L.tileLayer` with styled tiles
   - Adds tile layer to `clickedSceneImageLayer`
   - Sets `imageOverlayLoading` to false on load/error

**7. PopupResult Component Displays** (triggered by `currentPopupResult` change):
   
   **useEffect** (lines 31-50):
   - If `autoCenterOnItemChanged` is enabled, calls `zoomToItemExtent(props.result)`
   - Calls `debounceTitilerOverlay(props.result)` (redundant with PopupResults)
   - Fetches thumbnail from `links` array with `rel: 'thumbnail'`
   - Loads thumbnail image, sets to component state or fallback image
   
   **Render**:
   - Displays thumbnail
   - Shows item ID
   - Displays configured `popupDisplayFields` properties
   - Shows "View Enhanced Details" button

**8. Left Panel Updates**:
   - `LeftContent` component's `_tabSelected` triggers tab switch to 'details'
   - `PopupResults` component renders with `_clickResults` array
   - Shows "X scenes selected" header
   - Displays `PopupResult` for item at `_selectedPopupResultIndex`
   - Shows `PopupFooter` with prev/next navigation (if multiple items)

**9. Enhanced Details (Optional)**:
   - User can click "View Enhanced Details" button
   - Dispatches `settabSelected('enhanced')` and `setIsEnhancedDetailsExpanded(true)`
   - `EnhancedDetailsTab` displays with full property groups and assets

**Timeline:**
- 0ms: Click captured
- 0-50ms: Highlights drawn, Redux updated
- 50-100ms: Components re-render
- 800ms: TiTiler overlay begins loading
- 1-3s: Imagery tiles load

**Evidence**: Event handler registration in `src/components/LeafMap/LeafMap.jsx` line 156, mapClickHandler in `src/utils/mapHelper.js` lines 86-143, PopupResults effects in `src/components/PopupResults/PopupResults.jsx` lines 31-51, PopupResult rendering in `src/components/PopupResult/PopupResult.jsx` lines 31-100, LeftContent tab management in `src/components/Layout/Content/LeftContent/LeftContent.jsx` lines 70-132.

**Implications**: Direct link routing should replicate steps 2-9 to achieve identical behavior. The URL-based entry point should dispatch the same Redux actions, trigger the same rendering, and integrate seamlessly with existing components.

---

### 14. alertHelper Utility

**Question**: How does the `alertHelper.js` utility work? What functions are available for displaying error messages, and how are they integrated with Redux state?

**Answer**: The `alertHelper.js` utility provides a single function for displaying system alerts via a banner component.

**Function:**
```javascript
showApplicationAlert(severity, message = null, duration = null)
```

**Parameters:**
- `severity`: String indicating alert type ('error', 'warning', 'info', 'success')
- `message`: Optional string message to display (defaults to 'System Error' if null)
- `duration`: Optional number in milliseconds for auto-dismiss (if null, persists until user dismisses)

**Implementation** (lines 8-21):
```javascript
export function showApplicationAlert(severity, message = null, duration = null) {
  message
    ? store.dispatch(setapplicationAlertMessage(message))
    : store.dispatch(setapplicationAlertMessage('System Error'))

  store.dispatch(setapplicationAlertSeverity(severity))
  store.dispatch(setshowApplicationAlert(true))

  duration &&
    setTimeout(() => {
      store.dispatch(setshowApplicationAlert(false))
    }, duration)
}
```

**Redux Integration:**
Three Redux state values control alerts in `mainSlice.js`:
- `showApplicationAlert`: Boolean, controls visibility (initial: false)
- `applicationAlertMessage`: String, message text (initial: 'System Error')
- `applicationAlertSeverity`: String, severity level (initial: 'error')

**Display Component:**
The `SystemMessage` component is conditionally rendered in `App.jsx` (line 77):
```javascript
{_showApplicationAlert ? <SystemMessage></SystemMessage> : null}
```

The component is rendered at the application root level, ensuring alerts appear regardless of which view is active.

**Usage Examples:**
```javascript
// Error with 5-second auto-dismiss
showApplicationAlert('warning', 'Login Failed', 5000)

// Error that persists (user must dismiss)
showApplicationAlert('error', 'Item not found')

// Info message
showApplicationAlert('info', 'Collection not configured')
```

**Current Usage in Codebase:**
- `post-auth-service.js` line 39: Login failure warning with 5s duration
- `get-collections-service.js` line 62-64: 403 error for bad token
- `get-collections-service.js` line 57-58: No collections found error
- Other services log errors to console but don't display alerts

**Evidence**: Utility implementation in `src/utils/alertHelper.js`, Redux state in `src/redux/slices/mainSlice.js` lines 30-32, component rendering in `src/App.jsx` line 77, usage examples in `src/services/post-auth-service.js` and `src/services/get-collections-service.js`.

**Implications**: Direct link routing should use `showApplicationAlert()` for all user-facing error conditions: item not found (404), collection not configured, network failures, and authentication errors. The function's simplicity makes it easy to integrate consistent error messaging.

---

### 15. Collection ID Validation

**Question**: How does the application currently handle missing or invalid collection IDs? Are there validation checks before making API calls?

**Answer**: The application has minimal explicit validation for collection IDs before making API calls. Validation is primarily implicit through configuration checks and usage patterns.

**Implicit Validation Mechanisms:**

**1. Collection Selection** (`CollectionDropdown` component):
   - User selects from collections returned by `/collections` endpoint
   - Only collections in `appConfig.COLLECTIONS` array (if defined) are shown
   - Selection stores valid `selectedCollectionData` object in Redux
   - Invalid IDs cannot be selected through UI

**2. Configuration Checks**:
   - `getCollectionConfig(collectionId, paramName)` returns `undefined` if collection doesn't exist
   - Code often checks if config exists before proceeding:
   ```javascript
   const sceneTilerParams = getCollectionConfig(item?.collection, 'sceneTilerParams')
   if (!sceneTilerParams) {
     return // Exit early
   }
   ```

**3. Collection Data Structure**:
   - `buildCollectionsData()` in `dataHelper.js` creates a map of collection IDs to collection objects
   - Collections are filtered against `appConfig.COLLECTIONS` if defined
   - Invalid IDs won't exist in `collectionsData` Redux state

**No Explicit Pre-API Validation:**
The application does not validate collection IDs before making API calls. Service functions accept collection IDs as parameters and pass them directly to API endpoints:

```javascript
// No validation before API call
`${STAC_API_URL}/collections/${collectionId}/aggregations`
```

**Error Handling:**
When API calls fail due to invalid collection IDs:
- 404 responses trigger the catch block
- Error is logged to console
- No user-facing message is displayed (except for special 403 handling)
- Application continues functioning

**Collection in Items:**
When processing search results, items have a `collection` property:
```javascript
const sceneTilerParams = getCollectionConfig(item?.collection, 'sceneTilerParams')
```
If `item.collection` doesn't match any configured collection, `sceneTilerParams` is `undefined` and TiTiler rendering is skipped. No error is displayed.

**Evidence**: Collection filtering in `src/services/get-collections-service.js` lines 46-51, collection data building in `src/utils/dataHelper.js`, implicit validation in `src/utils/mapHelper.js` lines 356-366, no explicit validation checks found in codebase.

**Implications**: Direct link routing will need to introduce explicit collection ID validation since URLs can contain arbitrary values. Before attempting to fetch an item, the implementation should verify that the collection ID exists in the application's configuration using `getCollectionConfig()`. If the collection is not configured, an error should be displayed rather than attempting an API call that will fail.

---

### 16. Component Hierarchy

**Question**: What is the component hierarchy for the main application view? How are Layout components (PageHeader, LeftContent, RightContent, LeafMap) organized and how do they communicate via Redux?

**Answer**: The application has a straightforward component hierarchy with Redux as the primary communication mechanism.

**Component Tree:**
```
App (root)
├── Login (conditional: if APP_TOKEN_AUTH_ENABLED && !authTokenExists)
├── PageHeader
│   ├── Logo/Brand
│   ├── Dashboard Button (conditional: if DASHBOARD_BTN_URL)
│   ├── Analyze Button (conditional: if ANALYZE_BTN_URL)
│   ├── ThemeSwitcher (conditional: if THEME_SWITCHING_ENABLED)
│   ├── CartButton (conditional: if CART_ENABLED)
│   └── Logout Button (conditional: if APP_TOKEN_AUTH_ENABLED)
├── Content
│   ├── LeftContent
│   │   ├── Tab Buttons (Filters, Item Details, Enhanced Details)
│   │   └── Selected Tab Content:
│   │       ├── Search (filters tab)
│   │       │   ├── CollectionDropdown
│   │       │   ├── DateTimeRangeSelector
│   │       │   ├── CloudSlider
│   │       │   └── ViewSelector
│   │       ├── PopupResults (details tab)
│   │       │   ├── PopupResult
│   │       │   └── PopupFooter
│   │       └── EnhancedDetailsTab (enhanced tab)
│   │           ├── ItemHeader
│   │           ├── FieldGroup (multiple)
│   │           ├── AssetDisplay/DefaultAssetDisplay
│   │           └── PopupFooter
│   └── RightContent
│       ├── LeafMap
│       │   ├── MapContainer (react-leaflet)
│       │   ├── TileLayer (basemap)
│       │   └── Feature Groups (initialized in useEffect):
│       │       ├── referenceLayerGroup
│       │       ├── searchResultsLayer
│       │       ├── cartFootprintsLayer
│       │       ├── clickedSceneHighlightLayer
│       │       ├── clickedSceneImageLayer
│       │       ├── mosaicImageLayer
│       │       └── drawBoundsLayer
│       ├── LoadingAnimation (conditional)
│       ├── Zoom Notice (conditional)
│       ├── Draw Geom Message (conditional)
│       ├── Layer Legend (conditional)
│       ├── Export Button
│       └── Attribution Tooltip
├── UploadGeojsonModal (conditional: if showUploadGeojsonModal)
├── SystemMessage (conditional: if showApplicationAlert)
└── CartModal (conditional: if showCartModal && CART_ENABLED)
```

**Communication Pattern:**

**Redux State Flow:**
Components communicate exclusively through Redux state, not props or callbacks between siblings.

**Typical Pattern:**
```javascript
// Component reads from Redux
const _searchResults = useSelector((state) => state.mainSlice.searchResults)
const _clickResults = useSelector((state) => state.mainSlice.clickResults)

// Component writes to Redux
const dispatch = useDispatch()
dispatch(setClickResults(items))
```

**Key State Flows:**

1. **Search → Map Visualization**:
   - User interacts with `Search` component
   - Search dispatches `setSearchResults(json)`
   - `SearchService` calls `addDataToLayer()` to render footprints
   - Map updates automatically via Leaflet layer manipulation

2. **Map Click → Item Details**:
   - `mapClickHandler` dispatches `setClickResults()` and `settabSelected('details')`
   - `LeftContent` reads `_tabSelected` and renders `PopupResults`
   - `PopupResults` reads `_clickResults` and renders `PopupResult`

3. **Item Selection → Imagery**:
   - `PopupResults` dispatches `setCurrentPopupResult(item)`
   - Calls `debounceTitilerOverlay(item)`
   - `addImageOverlay` function manipulates Leaflet layers directly
   - Sets `imageOverlayLoading` state for spinner

**No Parent-Child Props:**
- `Content` doesn't pass props to `LeftContent` or `RightContent`
- `LeftContent` doesn't pass props to `Search`, `PopupResults`, or `EnhancedDetailsTab`
- All data sharing happens via Redux selectors

**Direct Map Manipulation:**
Many components directly manipulate the Leaflet map object stored in Redux:
```javascript
const map = store.getState().mainSlice.map
map.eachLayer(function(layer) {
  // Manipulate layers
})
```

**Evidence**: App structure in `src/App.jsx`, Content structure in `src/components/Layout/Content/Content.jsx`, LeftContent in `src/components/Layout/Content/LeftContent/LeftContent.jsx`, RightContent in `src/components/Layout/Content/RightContent/RightContent.jsx`, LeafMap initialization in `src/components/LeafMap/LeafMap.jsx` lines 54-167.

**Implications**: Direct link routing components can integrate naturally by reading/writing Redux state. No component refactoring is needed—new URL-based navigation can dispatch the same Redux actions that map clicks do, and existing components will respond identically.

---

### 17. Popup/Modal System for Item Details

**Question**: How does the existing popup/modal system work for displaying item details? What triggers the display of item details in the left panel (`PopupResults`, `EnhancedDetailsTab`)?

**Answer**: Item details are displayed in the left panel through a tab-based system, not a traditional modal overlay. The "popup" terminology is legacy naming—details appear inline in the `LeftContent` component.

**Tab System Structure:**

The left panel has three tabs controlled by `tabSelected` Redux state:
1. **'filters'**: Displays `Search` component with collection/date/cloud filters
2. **'details'**: Displays `PopupResults` component with item details and thumbnails
3. **'enhanced'**: Displays `EnhancedDetailsTab` with grouped properties and assets

**Tab Rendering** (`LeftContent.jsx`, lines 117-132):
```javascript
<div className="LeftContentSelectedTab">
  {_tabSelected === 'filters' ? (
    <Search></Search>
  ) : _tabSelected === 'enhanced' ? (
    <EnhancedDetailsTab></EnhancedDetailsTab>
  ) : (
    <div className="ItemDetails">
      <PopupResults results={_clickResults}></PopupResults>
    </div>
  )}
</div>
```

**Triggers for Item Details Display:**

**1. Map Click** (most common):
   - `mapClickHandler` dispatches `settabSelected('details')` (line 129)
   - `LeftContent` component reacts to `_tabSelected` change and renders `PopupResults`

**2. Manual Tab Click**:
   - User clicks "Item Details" tab button
   - `setDetailsTab` callback dispatches `settabSelected('details')`
   - Only works if `_clickResults` has items to display

**3. Grid Code Search**:
   - `SearchService` with `typeOfSearch === 'grid-code'` dispatches `settabSelected('details')` after fetching results
   - Similar to map click but from API response

**PopupResults Component Behavior:**

**With Items** (`_clickResults.length > 0`):
- Shows header: "X scenes selected (Y in cart)"
- Displays "Add all to cart" button (if `CART_ENABLED`)
- Renders `PopupResult` for item at `_selectedPopupResultIndex`
- Shows "Add/Remove scene from cart" button (if `CART_ENABLED`)
- Displays `PopupFooter` with prev/next navigation

**Without Items** (`_clickResults.length === 0`):
- Shows empty state message:
  - "Nothing Selected"
  - "search and click footprint on map to view details"

**Navigation Between Items:**
`PopupFooter` component provides prev/next buttons:
- Clicking prev calls `onPrevClick()` which dispatches `setselectedPopupResultIndex(index - 1)`
- Clicking next calls `onNextClick()` which dispatches `setselectedPopupResultIndex(index + 1)`
- Buttons disabled when at first/last item
- Shows "X of Y" counter

**Enhanced Details View:**
- User clicks "View Enhanced Details" button in `PopupResult`
- Dispatches `settabSelected('enhanced')` and `setIsEnhancedDetailsExpanded(true)`
- `LeftContent` switches to `EnhancedDetailsTab` component
- Enhanced tab can expand to full width, pushing map to right

**No Modal Overlay:**
Despite the "Popup" naming in components, there's no modal overlay or z-indexed popup. All item details render inline within the left panel's content area. The legacy names `PopupResults`, `PopupResult`, `showPopupModal` are historical artifacts.

**Evidence**: Tab rendering in `src/components/Layout/Content/LeftContent/LeftContent.jsx` lines 117-132, tab switching logic lines 48-70, PopupResults conditional rendering in `src/components/PopupResults/PopupResults.jsx` lines 93-170, PopupFooter navigation in `src/components/PopupFooter/PopupFooter.jsx`, enhanced details button in `src/components/PopupResult/PopupResult.jsx` lines 27-30.

**Implications**: Direct link routing should trigger the same tab switching by dispatching `settabSelected('details')` after loading an item. The existing `PopupResults` component will handle display automatically when `clickResults` is populated. No modal management or z-index handling is needed.

---

## Open Unknowns

*The Spec Agent will review these with you. You may provide answers here if possible.*

No open unknowns. All internal system behavior questions from the research prompt were answered through code examination.

---

## User-Provided External Knowledge (Manual Fill)

The following questions require external knowledge or user decision-making. These are provided for optional manual completion:

- [ ] What are the browser History API best practices for single-page applications? How should `pushState` and `replaceState` be used to manage navigation state without causing memory leaks or excessive history entries?

  - It would be nice to let the library like TanStack worry about this

- [ ] How does TanStack Router integrate with Redux for state management? Are there recommended patterns for keeping router state synchronized with Redux state?

  - Recommended Patterns for Keeping Router State Synchronized with Redux State:
    - Prioritize URL-Driven State: Let TanStack Router manage the URL and its associated state. Only introduce router-related data into Redux if there's a strong, justified need for global accessibility or complex interactions with other Redux-managed state.
    - Decouple Concerns: Maintain a clear separation of concerns. TanStack Router handles navigation and URL parsing, while Redux manages your application's internal data.
    - Use Effects for Bridging: When synchronization is required, use useEffect to observe changes in router state and dispatch Redux actions to update the store.
    - Avoid Redundant Storage: Don't store identical copies of router state in both TanStack Router and Redux if it can be directly accessed from the router. This reduces redundancy and potential for inconsistencies.

- [ ] What URL length limitations exist for modern browsers and common sharing platforms (email, Slack, etc.)? What is the practical maximum length for shareable URLs?

  - The practical maximum length for a shareable URL is about 2,000 characters.
