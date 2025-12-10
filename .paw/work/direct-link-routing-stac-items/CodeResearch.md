---
date: 2025-12-05 13:52:56 EST
git_commit: 63cd1aea2c3e9c303ddf3c49694cf56c984d35ef
branch: issues/477/direct-link-stac-item
repository: filmdrop-ui
topic: "Direct Link Routing to STAC Items - Implementation Research"
tags: [research, codebase, routing, react, redux, tanstack-router, stac-api, map-visualization]
status: complete
last_updated: 2025-12-05
---

# Research: Direct Link Routing to STAC Items - Implementation Research

**Date**: 2025-12-05 13:52:56 EST
**Git Commit**: 63cd1aea2c3e9c303ddf3c49694cf56c984d35ef
**Branch**: issues/477/direct-link-stac-item
**Repository**: filmdrop-ui

## Research Question

How should TanStack Router be integrated into the existing FilmDrop UI React/Redux application to enable direct link routing to STAC items? Document the implementation patterns for:
1. Current application structure and routing (or lack thereof)
2. Existing STAC API service patterns that the new item fetch service must follow
3. Redux state management integration
4. Map visualization and item rendering workflows
5. Configuration helper utilities for collection validation
6. Authentication patterns
7. Error handling mechanisms
8. Component integration patterns

## Summary

FilmDrop UI is a React 19 application built with Vite that currently has **no URL-based routing**. The application uses Redux Toolkit for state management and operates as a purely state-driven single-page application where navigation is controlled through Redux state (`tabSelected`). All item data flows through three Redux states: `clickResults` (array), `currentPopupResult` (single item), and `selectedPopupResultIndex` (integer).

To implement direct link routing, TanStack Router will need to be added as a new dependency. The router will manage URL patterns like `/item/:collectionId/:itemId` while populating the existing Redux states to trigger current UI components. A new STAC API service following the established pattern is required to fetch individual items from `/collections/{collectionId}/items/{itemId}` endpoints.

All existing STAC API services follow a consistent pattern: fetch with JWT Bearer authentication when `APP_TOKEN_AUTH_ENABLED` is true, `credentials: appConfig.FETCH_CREDENTIALS || 'same-origin'`, and promise-based error handling. Item visualization reuses existing map utilities (`debounceTitilerOverlay`, `zoomToItemExtent`, `clearMapSelection`) and layer management with Leaflet FeatureGroups.

## Detailed Findings

### 1. Application Structure and Current Routing State

**Current State**: FilmDrop UI has no URL-based routing mechanism.

**React and Build Configuration**:
- **React Version**: 19.2.1 (latest) - `package.json:22`
- **Build Tool**: Vite 7.1.7 with React plugin - `vite.config.mts:11`
- **Entry Point**: `src/index.jsx` renders `<Provider store={store}><App /></Provider>` - `src/index.jsx:10-13`
- **Root Component**: `src/App.jsx` conditionally renders Login or main Content based on Redux state - `src/App.jsx:1-100`

**Navigation is Redux State-Driven**:
```javascript
// All navigation controlled through tabSelected state
const _tabSelected = useSelector((state) => state.mainSlice.tabSelected)
// Values: 'filters', 'details', 'enhanced'
```
Referenced in: `src/redux/slices/mainSlice.js:39`

**No Existing Router Dependencies**:
- `package.json` shows no router libraries (React Router, TanStack Router, etc.) - `package.json:1-100`
- TanStack Router will need to be added as a new dependency: `@tanstack/react-router`

**Integration Point for Router**:
The router should wrap the `<App />` component in `src/index.jsx:10-13`:
```jsx
// Current structure
<Provider store={store}>
  <App />
</Provider>

// Future structure with TanStack Router
<Provider store={store}>
  <RouterProvider router={router}>
    <App />
  </RouterProvider>
</Provider>
```

**Authentication Gate**: `App.jsx` already implements conditional rendering based on `APP_TOKEN_AUTH_ENABLED` and `authTokenExists` state - `src/App.jsx:44-59`. The router will need to respect this by checking authentication before rendering item routes.

### 2. STAC API Service Patterns

**Pattern Location**: All services in `src/services/` directory follow the same structure.

**Consistent Service Pattern** (documented from `get-search-service.js:1-58`, `get-collections-service.js:1-86`, `get-queryables-service.js:1-34`):

```javascript
// 1. Import store for accessing Redux state
import { store } from '../redux/store'

// 2. Setup request headers with conditional JWT authentication
const requestHeaders = new Headers()
const JWT = localStorage.getItem('APP_AUTH_TOKEN')
const isSTACTokenAuthEnabled =
  store.getState().mainSlice.appConfig.APP_TOKEN_AUTH_ENABLED ?? false
if (JWT && isSTACTokenAuthEnabled) {
  requestHeaders.append('Authorization', `Bearer ${JWT}`)
}

// 3. Fetch with credentials configuration
await fetch(
  `${store.getState().mainSlice.appConfig.STAC_API_URL}/endpoint`,
  {
    credentials:
      store.getState().mainSlice.appConfig.FETCH_CREDENTIALS || 'same-origin',
    headers: requestHeaders
  }
)
  .then((response) => {
    if (response.ok) {
      return response.json()
    }
    throw new Error()
  })
  .then((json) => {
    // Dispatch Redux actions or return data
  })
  .catch((error) => {
    // Log error and optionally show user alert
    console.error(message, error)
  })
```

**Key Pattern Elements**:
1. **Authentication Headers**: Check `APP_TOKEN_AUTH_ENABLED` flag, retrieve JWT from localStorage 'APP_AUTH_TOKEN', append as `Authorization: Bearer ${JWT}` - `get-search-service.js:12-17`
2. **Credentials Configuration**: Use `FETCH_CREDENTIALS` from config, default to 'same-origin' - `get-search-service.js:21-22`
3. **Error Handling**: Promise chain with `.then()/.catch()`, log errors to console - `get-search-service.js:26-58`
4. **Redux Integration**: Services import and dispatch actions directly using `store.dispatch()` - `get-search-service.js:7`

**No Existing Item Fetch Service**:
Current services only fetch:
- Search results via `/search` endpoint (returns FeatureCollection) - `get-search-service.js:19-20`
- Collections list via `/collections` endpoint - `get-collections-service.js:19-20`
- Queryables via `/collections/{id}/queryables` - `get-queryables-service.js:11-13`

**Required New Service**: A new service file `get-item-service.js` must be created following the pattern above to fetch from `/collections/{collectionId}/items/{itemId}` endpoint per STAC specification.

**Service File Naming Convention**: All services use kebab-case: `get-{resource}-service.js` or `post-{resource}-service.js` - `src/services/` directory listing

### 3. Redux State Management Integration

**Redux Store Structure**: `src/redux/store.js` - single store with `mainSlice`

**Critical Item States** (from `src/redux/slices/mainSlice.js:1-50`):
```javascript
const initialState = {
  clickResults: [],              // Array of GeoJSON Feature objects (line 11)
  currentPopupResult: null,      // Single GeoJSON Feature object (line 13)
  selectedPopupResultIndex: 0,   // Integer index into clickResults (line 39)
  tabSelected: 'filters',        // Navigation state (line 39)
  // ... other states
}
```

**State Actions** (from `src/redux/slices/mainSlice.js:72-176`):
```javascript
setClickResults: (state, action) => { state.clickResults = action.payload }
setCurrentPopupResult: (state, action) => { state.currentPopupResult = action.payload }
setselectedPopupResultIndex: (state, action) => { state.selectedPopupResultIndex = action.payload }
settabSelected: (state, action) => { state.tabSelected = action.payload }
```

**Routing Integration Pattern**:
When loading an item from a direct URL, the router must:
1. Fetch the item GeoJSON from STAC API
2. Dispatch `setClickResults([item])` to create array with fetched item - `mainSlice.js:73-75`
3. Dispatch `setselectedPopupResultIndex(0)` to point to first (only) item - `mainSlice.js:171-173`
4. Dispatch `setCurrentPopupResult(item)` to set active item - `mainSlice.js:76-78`
5. Dispatch `settabSelected('details')` to show details panel - `mainSlice.js:167-169`

**State Flow Example** (from map click handler `mapHelper.js:86-143`):
```javascript
// Current map click selection flow
store.dispatch(setClickResults(intersectingFeatures))  // line 132
store.dispatch(settabSelected('details'))               // line 133
store.dispatch(setIsEnhancedDetailsExpanded(false))     // line 134
store.dispatch(sethasLeftPanelTabChanged(true))         // line 135
```

**Component State Consumption**:
- `PopupResults` component watches `clickResults` and `selectedPopupResultIndex` via `useSelector` - `PopupResults.jsx:19-27`
- `EnhancedDetailsTab` watches `currentPopupResult` via `useSelector` - `EnhancedDetailsTab.jsx:25-27`
- Both components trigger `debounceTitilerOverlay()` on state changes - `PopupResults.jsx:36`, `EnhancedDetailsTab.jsx:41`

**State Dependencies**:
Other related states that may need updating during routing:
- `imageOverlayLoading`: Set to `false` after imagery loads - `mainSlice.js:34`
- `hasLeftPanelTabChanged`: Triggers panel animations - `mainSlice.js:44`
- `isEnhancedDetailsExpanded`: Controls expanded details view - `mainSlice.js:45`

### 4. Map Visualization and Item Rendering

**Map Instance**: Stored in Redux `state.mainSlice.map` as Leaflet map object - `mainSlice.js:6`

**Visualization Workflow** (from `mapHelper.js:350-420`):

#### Item Footprint Rendering
```javascript
// Footprint style constant
export const clickedFootprintLayerStyle = {
  color: '#BEA835',
  weight: 4,
  opacity: 0.65,
  fillOpacity: 0,
  pane: 'searchResults'
}
```
Referenced in: `mapHelper.js:43-48`

**Footprint Rendering Flow** (from `mapClickHandler` in `mapHelper.js:86-143`):
1. Clear existing selection: `clearMapSelection()` - `mapHelper.js:361-366`
2. Create GeoJSON layer with style: `L.geoJSON(feature, {style: clickedFootprintLayerStyle})` - `mapHelper.js:113-115`
3. Add to `clickedSceneHighlightLayer` Leaflet FeatureGroup - `mapHelper.js:116-121`

**Layers Used**:
- `clickedSceneHighlightLayer`: FeatureGroup for selected item footprints - `mapHelper.js:117`
- `clickedSceneImageLayer`: FeatureGroup for TiTiler imagery overlays - `mapHelper.js:408`
- `searchResultsLayer`: FeatureGroup for search result footprints - `mapHelper.js:177`

#### TiTiler Imagery Rendering

**Debounced Function** (from `mapHelper.js:350-353`):
```javascript
export const debounceTitilerOverlay = debounce(
  (item) => addImageOverlay(item),
  800  // 800ms debounce delay
)
```

**Image Overlay Implementation** (from `mapHelper.js:355-420`):
```javascript
function addImageOverlay(item) {
  // 1. Get TiTiler URL and collection-specific parameters
  const sceneTilerURL = store.getState().mainSlice.appConfig.SCENE_TILER_URL
  const sceneTilerParams = getCollectionConfig(item?.collection, 'sceneTilerParams')
  
  // 2. Validate configuration exists
  if (!item || !sceneTilerURL || !sceneTilerParams) {
    store.dispatch(setimageOverlayLoading(false))
    return
  }
  
  // 3. Set loading state and clear previous imagery
  store.dispatch(setimageOverlayLoading(true))
  clearLayer('clickedSceneImageLayer')
  
  // 4. Fetch item self link for TiTiler
  const featureURL = item?.links?.find((x) => x?.rel === 'self')?.href
  
  // 5. Construct TiTiler URL with parameters
  const tilerParams = constructSceneTilerParams(collection.id)
  // URL pattern: /stac/tiles/{z}/{x}/{y}@2x.png?url={featureURL}&{tilerParams}
  
  // 6. Create Leaflet TileLayer with bounds from item bbox
  const tileBounds = setupBounds(json.bbox)
  const currentSelectionImageTileLayer = L.tileLayer(
    `${sceneTilerURL}/stac/tiles/{z}/{x}/{y}@${scale()}x.png?url=${featureURL}&${tilerParams}`,
    { ...DEFAULT_TILE_LAYER_PARAMS, ...collectionTileLayerParams, bounds: tileBounds }
  )
  
  // 7. Add tile layer to clickedSceneImageLayer FeatureGroup
  map.eachLayer(function (layer) {
    if (layer.layer_name === 'clickedSceneImageLayer') {
      currentSelectionImageTileLayer.addTo(layer)
    }
  })
}
```

**TiTiler Parameters Construction** (from `mapHelper.js:442-484`):
The `constructSceneTilerParams()` function reads collection config to build URL query string with:
- `assets`: Which asset(s) to render (e.g., "visual", "B01,B02,B03")
- `bidx`: Band indices for multi-band assets
- `nodata`: Pixel value to treat as transparent
- `color_formula`: Color adjustment formulas (e.g., "gamma RGB 3.5")
- `expression`: Band math expressions
- `rescale`: Value rescaling for contrast
- `colormap_name`: Named colormap from TiTiler
- `colormap`: Custom colormap JSON

#### Map Centering and Zoom

**Auto-Center Function** (from `mapHelper.js:292-298`):
```javascript
export function zoomToItemExtent(item) {
  if (item.bbox) {
    const itemBounds = leafletBoundsFromBBOX(item.bbox)
    zoomToBounds(itemBounds)  // Calls map.fitBounds(bounds) - line 243-247
  }
}
```

**Helper: BBOX to Leaflet Bounds** (from `mapHelper.js:257-263`):
```javascript
function leafletBoundsFromBBOX(bbox) {
  const swCorner = L.latLng(bbox[1], bbox[0])  // [lat, lng]
  const neCorner = L.latLng(bbox[3], bbox[2])
  const leafletBounds = L.latLngBounds(swCorner, neCorner)
  return leafletBounds
}
```

**Configuration Control**: Auto-centering respects `SHOW_ITEM_AUTO_ZOOM` configuration flag (referenced in PopupResult component).

#### Layer Management and Cleanup

**Clear Map Selection** (from `mapHelper.js:361-366`):
```javascript
export function clearMapSelection() {
  clearLayer('clickedSceneHighlightLayer')
  clearLayer('clickedSceneImageLayer')
  store.dispatch(setClickResults([]))
  store.dispatch(setCurrentPopupResult(null))
}
```

**Clear Layer Implementation** (from `mapHelper.js:207-216`):
```javascript
export function clearLayer(layerName) {
  const map = store.getState().mainSlice.map
  if (map && Object.keys(map).length > 0) {
    map.eachLayer(function (layer) {
      if (layer.layer_name === layerName) {
        layer.clearLayers()  // Leaflet FeatureGroup method
      }
    })
  }
}
```

**Critical for Routing**: Before rendering a routed item, call `clearMapSelection()` to remove any existing footprints/imagery from previous selections.

### 5. Configuration Helper Utilities

**Location**: `src/utils/configHelper.js`

**Primary Function**: `getCollectionConfig(collectionId, paramName, config = null)` - `configHelper.js:242-276`

#### Collection Configuration Access Pattern

```javascript
// Usage example
const sceneTilerParams = getCollectionConfig('sentinel-2-l2a', 'sceneTilerParams')
const sceneMinZoom = getCollectionConfig('landsat-c2-l2', 'sceneMinZoom')
const popupFields = getCollectionConfig('naip', 'popupDisplayFields')
```

**Available Parameters**:
- `sceneTilerParams`: TiTiler rendering parameters (assets, bands, color formulas)
- `mosaicTilerParams`: Mosaic tile server parameters
- `sceneMinZoom`: Minimum zoom level for scene visualization
- `popupDisplayFields`: Fields to display in popup
- `tileLayerParams`: Leaflet TileLayer options
- `enhancedDisplayConfig`: Enhanced details tab configuration

#### Validation Pattern for Unconfigured Collections

**Returns `undefined` for Invalid Collections** (from `configHelper.js:242-276`):
```javascript
export function getCollectionConfig(collectionId, paramName, config = null) {
  const appConfig = config || store.getState().mainSlice.appConfig
  if (!appConfig) return undefined
  
  // Try new structure first
  if (appConfig.COLLECTIONS_CONFIG?.[collectionId]?.[paramName]) {
    return appConfig.COLLECTIONS_CONFIG[collectionId][paramName]
  }
  
  // Fall back to legacy structure
  const legacyParamMap = {
    sceneTilerParams: 'SCENE_TILER_PARAMS',
    mosaicTilerParams: 'MOSAIC_TILER_PARAMS',
    sceneMinZoom: 'SEARCH_MIN_ZOOM_LEVELS',
    // ...
  }
  
  const legacyParam = legacyParamMap[paramName]
  if (legacyParam && appConfig[legacyParam]?.[collectionId]) {
    return appConfig[legacyParam][collectionId]
  }
  
  return undefined  // Collection not configured
}
```

**Validation Usage in Router**:
```javascript
// Before fetching item from STAC API
const collectionConfig = getCollectionConfig(collectionId, 'sceneMinZoom')
if (!collectionConfig) {
  // Collection not configured - show error banner
  showApplicationAlert('info', 'Collection not configured')
  return  // Don't attempt API fetch
}
```

**Note**: Any parameter can be used for validation (`sceneMinZoom`, `sceneTilerParams`, etc.). The function returns `undefined` if the collection doesn't exist in either modern `COLLECTIONS_CONFIG` or legacy separate parameters.

#### Config Format Migration

**Automatic Legacy Support** (from `configHelper.js:127-232`):
The `normalizeCollectionsConfig()` function runs on app initialization and converts legacy configuration format to modern `COLLECTIONS_CONFIG` structure:

```javascript
// Legacy format (separate parameters)
{
  SCENE_TILER_PARAMS: { "sentinel-2": {...} },
  SEARCH_MIN_ZOOM_LEVELS: { "sentinel-2": 7 },
  // ...
}

// Normalized to modern format
{
  COLLECTIONS_CONFIG: {
    "sentinel-2": {
      sceneTilerParams: {...},
      sceneMinZoom: 7,
      // ...
    }
  }
}
```

**Console Warning** (from `configHelper.js:137-144`): If both formats exist, logs warning but prioritizes `COLLECTIONS_CONFIG`.

### 6. Authentication Patterns

**Authentication Configuration**: `APP_TOKEN_AUTH_ENABLED` flag in `config.json` controls whether authentication is required - `App.jsx:48`

**Token Storage**: JWT token stored in localStorage with key `'APP_AUTH_TOKEN'` - `post-auth-service.js:34`

**Authentication Flow**:

1. **App Initialization** (from `App.jsx:35-42`):
```javascript
useEffect(() => {
  if (localStorage.getItem('APP_AUTH_TOKEN')) {
    dispatch(setauthTokenExists(true))  // Set Redux state
  }
  LoadConfigIntoStateService()
}, [])
```

2. **Login Gate** (from `App.jsx:44-59`):
```javascript
useEffect(() => {
  if (_appConfig) {
    if (_appConfig.APP_TOKEN_AUTH_ENABLED && !_authTokenExists) {
      setShowLogin(true)  // Show login screen
      return
    }
    setShowLogin(false)  // Show main app
    InitializeAppFromConfig()
    GetCollectionsService()
  }
}, [_appConfig, _authTokenExists])
```

3. **Login Service** (from `post-auth-service.js:5-41`):
```javascript
export async function AuthService(username, password) {
  await fetch(`${AuthServiceURL}`, {
    method: 'POST',
    headers: myHeaders,
    body: urlencoded  // grant_type=password&username=X&password=Y
  })
    .then((response) => response.json())
    .then((json) => {
      localStorage.setItem('APP_AUTH_TOKEN', json.access_token)
      store.dispatch(setauthTokenExists(true))  // Triggers re-render
    })
    .catch((error) => {
      store.dispatch(setauthTokenExists(false))
      showApplicationAlert('warning', 'Login Failed', 5000)
    })
}
```

4. **Logout** (from `authHelper.js:1-8`):
```javascript
export function logoutUser() {
  localStorage.removeItem('APP_AUTH_TOKEN')
  store.dispatch(setauthTokenExists(false))  // Returns to login screen
}
```

**Service Authentication Pattern** (consistent across all services):
```javascript
const requestHeaders = new Headers()
const JWT = localStorage.getItem('APP_AUTH_TOKEN')
const isSTACTokenAuthEnabled =
  store.getState().mainSlice.appConfig.APP_TOKEN_AUTH_ENABLED ?? false
if (JWT && isSTACTokenAuthEnabled) {
  requestHeaders.append('Authorization', `Bearer ${JWT}`)
}
```
Referenced in: `get-search-service.js:12-17`, `get-collections-service.js:12-17`, `get-queryables-service.js:7-12`

**403 Handling** (from `get-collections-service.js:69-79`):
```javascript
.catch((error) => {
  if (error.status === 403) {
    store.dispatch(setapplicationAlertMessage(
      'STAC API returned 403. Bad Token OR needs STAC Auth Enabled in config.'
    ))
    store.dispatch(setshowApplicationAlert(true))
    logoutUser()  // Force re-login
  }
})
```

**Route Protection Pattern for Direct Links**:
When implementing item routes, check authentication before rendering:
```javascript
// In route loader/component
const JWT = localStorage.getItem('APP_AUTH_TOKEN')
const authRequired = appConfig.APP_TOKEN_AUTH_ENABLED

if (authRequired && !JWT) {
  // Redirect to login, preserve target URL for post-auth redirect
  // TanStack Router: throw redirect({ to: '/login', search: { from: currentPath } })
}
```

### 7. Error Handling with alertHelper

**Primary Utility**: `showApplicationAlert(severity, message, duration)` - `alertHelper.js:7-23`

**Implementation**:
```javascript
export function showApplicationAlert(severity, message = null, duration = null) {
  // 1. Set message (default to 'System Error')
  message
    ? store.dispatch(setapplicationAlertMessage(message))
    : store.dispatch(setapplicationAlertMessage('System Error'))
  
  // 2. Set severity level
  store.dispatch(setapplicationAlertSeverity(severity))
  
  // 3. Show alert banner
  store.dispatch(setshowApplicationAlert(true))
  
  // 4. Auto-hide after duration (optional)
  duration &&
    setTimeout(() => {
      store.dispatch(setshowApplicationAlert(false))
    }, duration)
}
```

**Severity Levels** (MUI Alert component):
- `'error'`: Red banner, critical failures
- `'warning'`: Orange banner, non-critical issues
- `'info'`: Blue banner, informational messages
- `'success'`: Green banner, success confirmations

**Redux State Integration** (from `mainSlice.js:27-29`):
```javascript
showApplicationAlert: false,           // Boolean to show/hide
applicationAlertMessage: 'System Error',  // Message text
applicationAlertSeverity: 'error',     // Severity level
```

**SystemMessage Component** (from `SystemMessage.jsx:1-39`):
```javascript
const SystemMessage = () => {
  const _applicationAlertMessage = useSelector(
    (state) => state.mainSlice.applicationAlertMessage
  )
  const _applicationAlertSeverity = useSelector(
    (state) => state.mainSlice.applicationAlertSeverity
  )

  return (
    <div className="SystemMessage">
      <Alert
        onClose={() => {
          store.dispatch(setshowApplicationAlert(false))
          if (_applicationAlertSeverity === 'error') {
            logoutUser()  // Error severity triggers logout
          }
        }}
        severity={_applicationAlertSeverity}
      >
        {_applicationAlertMessage}
      </Alert>
    </div>
  )
}
```

**Render Location**: `SystemMessage` is rendered at app root level in `App.jsx:66, 75, 82` for all app states (loading, login, main).

**Usage Examples in Services**:
```javascript
// From get-collections-service.js:58-61
store.dispatch(setapplicationAlertMessage('Error: No Collections Found'))
store.dispatch(setshowApplicationAlert(true))

// From post-auth-service.js:38
showApplicationAlert('warning', 'Login Failed', 5000)  // Auto-hide after 5s
```

**Error Scenarios for Item Routing**:

1. **Item Not Found (404)**:
```javascript
showApplicationAlert('error', 'Item not found')
// Keep map visible, don't auto-hide banner
```

2. **Collection Not Configured**:
```javascript
showApplicationAlert('info', 'Collection not configured')
// Display before attempting API fetch
```

3. **Network/API Failure**:
```javascript
showApplicationAlert('error', 'Unable to load item. Please try again.')
// Could add duration for auto-hide: showApplicationAlert('error', message, 5000)
```

4. **Authentication Failure**:
```javascript
showApplicationAlert('warning', 'Authentication required', 3000)
// Then redirect to login
```

### 8. Component Integration - PopupResults and EnhancedDetailsTab

**Component Locations**:
- `src/components/PopupResults/PopupResults.jsx`
- `src/components/EnhancedDetailsTab/EnhancedDetailsTab.jsx`

#### PopupResults Component

**Purpose**: Displays item details in left panel with prev/next navigation for multiple items.

**Redux Dependencies** (from `PopupResults.jsx:19-27`):
```javascript
const _cartItems = useSelector((state) => state.mainSlice.cartItems)
const _appConfig = useSelector((state) => state.mainSlice.appConfig)
const _currentPopupResult = useSelector((state) => state.mainSlice.currentPopupResult)
const _selectedPopupResultIndex = useSelector((state) => state.mainSlice.selectedPopupResultIndex)
```

**Props**:
```javascript
PopupResults.propTypes = {
  results: PropTypes.array.isRequired  // The clickResults array from Redux
}
```

**State Synchronization Logic** (from `PopupResults.jsx:31-51`):
```javascript
// Effect 1: Initialize on results change
useEffect(() => {
  if (props.results.length > 0) {
    // Reset index if current result not in new results array
    if (!_currentPopupResult || !props.results.includes(_currentPopupResult)) {
      dispatch(setselectedPopupResultIndex(0))
    }
    // Load imagery for current index
    debounceTitilerOverlay(props.results[_selectedPopupResultIndex])
    // Set current popup result
    dispatch(setCurrentPopupResult(props.results[_selectedPopupResultIndex]))
  }
  return () => {
    dispatch(setimageOverlayLoading(false))  // Cleanup
  }
}, [props.results])

// Effect 2: Update on index change
useEffect(() => {
  if (props.results.length > 0) {
    dispatch(setCurrentPopupResult(props.results[_selectedPopupResultIndex]))
  }
}, [_selectedPopupResultIndex])
```

**Navigation Functions** (from `PopupResults.jsx:53-63`):
```javascript
function onNextClick() {
  if (_selectedPopupResultIndex < props.results.length - 1) {
    dispatch(setselectedPopupResultIndex(_selectedPopupResultIndex + 1))
  }
}

function onPrevClick() {
  if (_selectedPopupResultIndex > 0) {
    dispatch(setselectedPopupResultIndex(_selectedPopupResultIndex - 1))
  }
}
```

**Rendering**: Uses `<PopupResult>` child component to display individual item, `<PopupFooter>` for navigation buttons.

**Cart Integration**: Includes "Add to cart" / "Add all to cart" functionality when `CART_ENABLED` config is true - `PopupResults.jsx:65-93`

#### EnhancedDetailsTab Component

**Purpose**: Displays comprehensive item metadata and assets in expanded details view.

**Redux Dependencies** (from `EnhancedDetailsTab.jsx:25-35`):
```javascript
const currentPopupResult = useSelector((state) => state.mainSlice.currentPopupResult)
const appConfig = useSelector((state) => state.mainSlice.appConfig)
const clickResults = useSelector((state) => state.mainSlice.clickResults)
const selectedPopupResultIndex = useSelector((state) => state.mainSlice.selectedPopupResultIndex)
const isEnhancedDetailsExpanded = useSelector((state) => state.mainSlice.isEnhancedDetailsExpanded)
```

**No Props Required**: Component reads all data from Redux state.

**Empty State Handling** (from `EnhancedDetailsTab.jsx:57-66`):
```javascript
if (!currentPopupResult) {
  return (
    <div className="enhancedDetailsTabEmpty">
      <span className="enhancedDetailsTabEmptyPrimaryText">Nothing Selected</span>
      <span className="enhancedDetailsTabEmptySecondaryText">
        search and click footprint on map to view details
      </span>
    </div>
  )
}
```

**Navigation Functions** (from `EnhancedDetailsTab.jsx:37-55`):
```javascript
const navigateToIndex = useCallback((newIndex) => {
  dispatch(setselectedPopupResultIndex(newIndex))
  dispatch(setCurrentPopupResult(clickResults[newIndex]))
  debounceTitilerOverlay(clickResults[newIndex])
}, [clickResults, dispatch])

const handlePrevClick = useCallback(() => {
  if (selectedPopupResultIndex > 0) {
    navigateToIndex(selectedPopupResultIndex - 1)
  }
}, [selectedPopupResultIndex, navigateToIndex])

const handleNextClick = useCallback(() => {
  if (selectedPopupResultIndex < clickResults.length - 1) {
    navigateToIndex(selectedPopupResultIndex + 1)
  }
}, [selectedPopupResultIndex, clickResults.length, navigateToIndex])
```

**Field Grouping** (from `EnhancedDetailsTab.jsx:68-100`):
Component uses complex logic to group and display item properties based on:
1. Collection-specific `enhancedDisplayConfig` from `getCollectionConfig()`
2. Fallback to semantic field grouping by STAC extension
3. Field priorities and custom rendering per collection

**Asset Display**: Renders item assets (COG previews, download links) using `<AssetDisplay>` or `<DefaultAssetDisplay>` components.

**Integration for Routing**: Both components will work seamlessly with routed items because they only depend on Redux state. When the router populates `clickResults`, `currentPopupResult`, and `selectedPopupResultIndex`, these components will render identically to map-click selection.

## Code References

### Application Structure
- `package.json:22` - React 19.2.1 dependency
- `vite.config.mts:11` - Vite build configuration with React plugin
- `src/index.jsx:10-13` - App root with Redux Provider
- `src/App.jsx:1-100` - Root component with auth gate

### STAC API Service Patterns
- `src/services/get-search-service.js:1-58` - Complete service pattern example
- `src/services/get-collections-service.js:12-25` - Authentication header pattern
- `src/services/get-queryables-service.js:7-12` - Authentication header pattern
- `src/services/get-search-service.js:19-22` - STAC API URL and credentials pattern
- `src/services/get-search-service.js:26-58` - Promise chain and error handling

### Redux State Management
- `src/redux/slices/mainSlice.js:6-45` - Initial state definitions
- `src/redux/slices/mainSlice.js:11` - clickResults state
- `src/redux/slices/mainSlice.js:13` - currentPopupResult state
- `src/redux/slices/mainSlice.js:39` - selectedPopupResultIndex state
- `src/redux/slices/mainSlice.js:73-75` - setClickResults action
- `src/redux/slices/mainSlice.js:76-78` - setCurrentPopupResult action
- `src/redux/slices/mainSlice.js:171-173` - setselectedPopupResultIndex action
- `src/redux/slices/mainSlice.js:167-169` - settabSelected action

### Map Visualization
- `src/utils/mapHelper.js:43-48` - clickedFootprintLayerStyle constant
- `src/utils/mapHelper.js:86-143` - mapClickHandler function (complete flow)
- `src/utils/mapHelper.js:113-121` - Footprint rendering with L.geoJSON
- `src/utils/mapHelper.js:350-353` - debounceTitilerOverlay function
- `src/utils/mapHelper.js:355-420` - addImageOverlay implementation
- `src/utils/mapHelper.js:292-298` - zoomToItemExtent function
- `src/utils/mapHelper.js:257-263` - leafletBoundsFromBBOX helper
- `src/utils/mapHelper.js:243-247` - zoomToBounds function
- `src/utils/mapHelper.js:361-366` - clearMapSelection function
- `src/utils/mapHelper.js:207-216` - clearLayer function
- `src/utils/mapHelper.js:442-484` - constructSceneTilerParams function

### Configuration Helpers
- `src/utils/configHelper.js:242-276` - getCollectionConfig function
- `src/utils/configHelper.js:127-232` - normalizeCollectionsConfig function
- `src/utils/configHelper.js:137-144` - Legacy format warning

### Authentication
- `src/App.jsx:35-42` - App initialization with token check
- `src/App.jsx:44-59` - Login gate logic
- `src/services/post-auth-service.js:5-41` - AuthService function
- `src/services/post-auth-service.js:34` - Token storage to localStorage
- `src/utils/authHelper.js:3-6` - logoutUser function
- `src/services/get-search-service.js:12-17` - Service auth header pattern
- `src/services/get-collections-service.js:69-79` - 403 handling with logout

### Error Handling
- `src/utils/alertHelper.js:7-23` - showApplicationAlert function
- `src/redux/slices/mainSlice.js:27-29` - Alert Redux states
- `src/components/SystemMessage/SystemMessage.jsx:1-39` - SystemMessage component
- `src/App.jsx:66` - SystemMessage render in main app
- `src/App.jsx:75` - SystemMessage render in login
- `src/App.jsx:82` - SystemMessage render in loading

### Component Integration
- `src/components/PopupResults/PopupResults.jsx:19-27` - Redux selectors
- `src/components/PopupResults/PopupResults.jsx:31-51` - State synchronization
- `src/components/PopupResults/PopupResults.jsx:53-63` - Navigation functions
- `src/components/EnhancedDetailsTab/EnhancedDetailsTab.jsx:25-35` - Redux selectors
- `src/components/EnhancedDetailsTab/EnhancedDetailsTab.jsx:37-55` - Navigation with debounce
- `src/components/EnhancedDetailsTab/EnhancedDetailsTab.jsx:57-66` - Empty state handling

## Architecture Documentation

### Current Architecture Pattern

**State-Driven SPA**: FilmDrop UI follows a Redux-centric architecture where:
1. All navigation is Redux state changes (`tabSelected`)
2. All data flows through Redux store
3. Components are pure presentational, reading from Redux via `useSelector`
4. Services dispatch actions directly to Redux store
5. No URL routing - browser URL never changes

**Component Communication**: Components don't pass props for data sharing. All communication happens through Redux:
```
Service → Redux Store → Component (useSelector)
Component → Redux Store (dispatch) → Other Components (useSelector)
```

### Router Integration Strategy

**Hybrid Approach**: Add TanStack Router while maintaining Redux as source of truth:

1. **Router Role**: URL management and History API only
2. **Redux Role**: Application state and component data (unchanged)
3. **Integration Point**: Route loaders/components dispatch Redux actions
4. **Component Changes**: None required - components continue using Redux

**Benefits**:
- Minimal refactoring
- Existing components work without changes
- Redux patterns remain consistent
- Router adds URL capabilities on top

**Route Loader Pattern**:
```javascript
// Item route loader
export const itemRoute = createRoute({
  path: '/item/$collectionId/$itemId',
  loader: async ({ params }) => {
    // 1. Validate collection
    const config = getCollectionConfig(params.collectionId, 'sceneMinZoom')
    if (!config) {
      showApplicationAlert('info', 'Collection not configured')
      return
    }
    
    // 2. Fetch item from STAC API
    const item = await GetItemService(params.collectionId, params.itemId)
    
    // 3. Populate Redux state (triggers component re-render)
    store.dispatch(setClickResults([item]))
    store.dispatch(setselectedPopupResultIndex(0))
    store.dispatch(setCurrentPopupResult(item))
    store.dispatch(settabSelected('details'))
    
    // 4. Trigger visualization
    clearMapSelection()
    debounceTitilerOverlay(item)
    zoomToItemExtent(item)
  }
})
```

### URL Encoding Pattern

**Item IDs with Special Characters**: STAC item IDs often contain colons, slashes, dots (e.g., `S2A_17SNB_20230617:0/L2A.tif`).

**Encoding Required**:
```javascript
// When constructing URLs
const itemUrl = `/item/${collectionId}/${encodeURIComponent(itemId)}`

// When parsing route params (TanStack Router handles this automatically)
const itemId = decodeURIComponent(params.itemId)
```

**TanStack Router**: Modern router libraries handle encoding/decoding automatically for path parameters, but explicit encoding is still good practice when constructing links.

### TiTiler Integration Pattern

**Collection-Specific Configuration**: Each collection in `config.json` has `sceneTilerParams` defining:
```json
{
  "sentinel-2-l2a": {
    "sceneTilerParams": {
      "assets": "visual",
      "color_formula": "gamma RGB 3.5",
      "nodata": 0
    }
  }
}
```

**URL Construction**: TiTiler URLs follow pattern:
```
{SCENE_TILER_URL}/stac/tiles/{z}/{x}/{y}@2x.png?url={itemSelfLink}&assets=visual&color_formula=gamma%20RGB%203.5
```

**Automatic Retry**: TiTiler tile layer includes error handler - `mapHelper.js:413-416`:
```javascript
.on('tileerror', function () {
  store.dispatch(setimageOverlayLoading(false))
  console.log('Tile Error')
})
```

## Open Questions

1. **Route Protection Granularity**: Should route protection be configurable per-collection or global? Spec mentions configuration-driven flag but doesn't specify location in `config.json`.

2. **Post-Authentication Redirect**: How should TanStack Router preserve target URL for redirect after login? Standard pattern is query parameter (e.g., `?from=/item/collection/id`) but needs integration with existing Login component.

3. **Browser History Management**: When user navigates from search results → item → back button, should it restore search results or just previous item? Current spec says "preserve search state" but needs clarification on history stack structure.

4. **Error Banner Persistence**: Spec says 404 errors should display persistent banners (no auto-hide). Should other error types (network failures, auth errors) also be persistent or use duration?

5. **Multiple Items from Direct Link**: Currently direct links are single-item only. Should there be support for `/items?ids=id1,id2,id3` pattern to load multiple items? Out of scope but may inform architecture.

6. **Collection ID Case Sensitivity**: Are collection IDs case-sensitive in routing? STAC spec allows any string. Should router normalize or preserve case?

7. **Legacy Config Migration**: `normalizeCollectionsConfig()` runs on startup to migrate legacy config. Does this happen before router initialization, or could there be a race condition?

8. **Map Initialization Timing**: Router may load before map is initialized (`state.mainSlice.map` is empty object initially). Should route loader wait for map or proceed without visualization?

9. **Mosaic View Compatibility**: Spec focuses on scene view. Should item routes be accessible when app is in mosaic view mode (`viewMode: 'mosaic'`), or redirect to scene view?

10. **Cart Integration**: When loading item from direct link, should router check if item is already in cart and display that state? Or treat routed items as separate from cart workflow?
