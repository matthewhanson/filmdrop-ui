/**
 * TanStack Router configuration for FilmDrop UI
 *
 * This file implements client-side routing as a minimal overlay on the existing
 * Redux-driven architecture. The router manages URL patterns and the History API
 * while continuing to populate Redux states that trigger existing component rendering.
 *
 * Key architectural pattern:
 * - Route loaders fetch data and dispatch Redux actions
 * - Existing components read from Redux via useSelector hooks
 * - No component refactoring required - they remain Redux-native
 *
 * Routes:
 * - / (index): Home path, no specific component
 * - /item/:collectionId/:itemId: Direct link to STAC items
 */
import {
  createRouter,
  createRootRoute,
  createRoute,
  redirect
} from '@tanstack/react-router'
import App from './App'
import { GetItemService } from './services/get-item-service'
import {
  getCollectionConfig,
  getCollectionVisualizations
} from './utils/configHelper'
import { showApplicationAlert } from './utils/alertHelper'
import { store } from './redux/store'
import {
  setClickResults,
  setCurrentPopupResult,
  setselectedPopupResultIndex,
  settabSelected,
  setSelectedCollectionData,
  setSelectedCollection,
  setSearchResults,
  setmappedScenes,
  setSelectedVisualization
} from './redux/slices/mainSlice'
import { LoadConfigIntoStateService } from './services/get-config-service'
import { GetCollectionsService } from './services/get-collections-service'
import { addDataToLayer, footprintLayerStyle } from './utils/mapHelper'
import { syncSelectionWithFetchedItem } from './utils/selectionSync'

/**
 * Clear Redux state to prevent inconsistencies when route loading fails.
 * If collections loaded but item fetch failed, we may have partially-set state.
 * This ensures a clean slate so the UI doesn't render stale/incorrect data.
 */
function clearItemRouteState() {
  store.dispatch(setSelectedCollection(''))
  store.dispatch(setSelectedCollectionData(null))
  store.dispatch(setClickResults([]))
  store.dispatch(setCurrentPopupResult(null))
  store.dispatch(setselectedPopupResultIndex(-1))
  store.dispatch(setSelectedVisualization(null))
  // Don't clear searchResults/mappedScenes - preserve existing search state
}

// Root route renders App component
const rootRoute = createRootRoute({
  component: App
})

// Index route for home path
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => null // No specific component, App handles state-driven rendering
})

// Item route with loader for fetching and displaying items
const itemRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/item/$collectionId/$itemId/{-$visualizationId}',
  beforeLoad: async ({ location }) => {
    // CRITICAL SECURITY: Ensure config is loaded BEFORE checking authentication
    // If config isn't loaded yet, APP_TOKEN_AUTH_ENABLED will be undefined/false,
    // creating a bypass where unauthenticated users can access protected routes
    let appConfig = store.getState().mainSlice.appConfig

    if (!appConfig || !appConfig.STAC_API_URL) {
      // Trigger config load if not already loading
      await LoadConfigIntoStateService()
    }

    // Wait for config to be loaded (with timeout)
    const maxWaitTime = 5000 // 5 seconds
    const startTime = Date.now()

    while (Date.now() - startTime < maxWaitTime) {
      appConfig = store.getState().mainSlice.appConfig

      // Config is ready if it has STAC_API_URL
      if (appConfig && appConfig.STAC_API_URL) {
        break
      }

      await new Promise((resolve) => setTimeout(resolve, 50))
    }

    // If config still not loaded after timeout, allow navigation to fail safely in loader
    // This is better than bypassing authentication
    if (!appConfig || !appConfig.STAC_API_URL) {
      console.warn(
        'Router beforeLoad: Config failed to load, proceeding to loader'
      )
      return
    }

    // Now safely read authentication config
    const JWT = localStorage.getItem('APP_AUTH_TOKEN')
    const authRequired = appConfig?.APP_TOKEN_AUTH_ENABLED ?? false

    if (authRequired && !JWT) {
      // Store target URL for post-auth redirect
      sessionStorage.setItem('POST_AUTH_REDIRECT_URL', location.href)
      throw redirect({ to: '/' })
    }
  },
  loader: async ({ params }) => {
    try {
      // TanStack Router automatically decodes path parameters
      const { collectionId, itemId, visualizationId } = params

      // Ensure config is loaded - trigger load if not already loading
      let appConfig = store.getState().mainSlice.appConfig

      if (!appConfig || !appConfig.STAC_API_URL) {
        // Router: Config not loaded, triggering LoadConfigIntoStateService
        await LoadConfigIntoStateService()
      }

      // Wait for appConfig to be loaded and normalized (with timeout)
      const maxWaitTime = 5000 // 5 seconds
      let startTime = Date.now()

      while (Date.now() - startTime < maxWaitTime) {
        appConfig = store.getState().mainSlice.appConfig

        // Config is ready if it has STAC_API_URL and either COLLECTIONS_CONFIG or legacy params
        const hasBasicConfig = appConfig && appConfig.STAC_API_URL
        const hasCollectionsConfig =
          appConfig &&
          (appConfig.COLLECTIONS_CONFIG ||
            appConfig.SEARCH_MIN_ZOOM_LEVELS ||
            appConfig.SCENE_TILER_PARAMS)

        if (hasBasicConfig && hasCollectionsConfig) {
          // Router: Config loaded successfully
          break
        }

        await new Promise((resolve) => setTimeout(resolve, 50))
      }

      if (!appConfig || !appConfig.STAC_API_URL) {
        console.error('Router: Configuration failed to load within timeout')
        clearItemRouteState()
        showApplicationAlert('error', 'Configuration failed to load')
        return
      }

      // Ensure collections data is loaded
      // On direct URL navigation, router loader runs before App.jsx mounts
      // We trigger collection load here if needed, App.jsx will skip if already loading
      let collectionsData = store.getState().mainSlice.collectionsData

      if (!collectionsData || collectionsData.length === 0) {
        // Trigger load (note: GetCollectionsService doesn't return a promise)
        try {
          await GetCollectionsService()
        } catch (err) {
          console.error('Router: Error loading collections', err)
        }
      }

      // Wait for collections to be populated in Redux state
      startTime = Date.now()
      const collectionsMaxWaitTime = 15000 // 15 seconds

      while (Date.now() - startTime < collectionsMaxWaitTime) {
        collectionsData = store.getState().mainSlice.collectionsData

        if (collectionsData && collectionsData.length > 0) {
          // Router: Collections loaded successfully
          break
        }

        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      if (!collectionsData || collectionsData.length === 0) {
        console.error('Router: Collections failed to load within timeout')
        clearItemRouteState()
        showApplicationAlert('error', 'Collections data failed to load')
        return
      }

      // Validate collection exists in configuration
      const collectionConfig = getCollectionConfig(collectionId, 'sceneMinZoom')

      if (!collectionConfig) {
        console.warn('Router: Collection not found in config', collectionId)
        clearItemRouteState()
        showApplicationAlert(
          'info',
          `Collection "${collectionId}" is not configured in this deployment`
        )
        return
      }

      // Fetch item from STAC API
      const result = await GetItemService(collectionId, itemId)

      if (result.error) {
        // Clear any partially-set state from earlier in the loader
        clearItemRouteState()

        if (result.status === 404) {
          showApplicationAlert(
            'error',
            `Item "${itemId}" not found in collection "${collectionId}"`
          )
        } else if (result.status === 403) {
          showApplicationAlert('warning', 'Authentication required')
        } else {
          showApplicationAlert(
            'error',
            'Unable to load item. Please check your network connection and try again.'
          )
        }
        console.error(`Failed to load item: ${collectionId}/${itemId}`, result)
        return
      }

      // Set selected collection data for map visualization
      const selectedCollection = collectionsData?.find(
        (c) => c.id === result.collection
      )
      if (selectedCollection) {
        store.dispatch(setSelectedCollection(selectedCollection.id))
        store.dispatch(setSelectedCollectionData(selectedCollection))
      } else {
        console.warn(
          'Router: Collection data not found for:',
          result.collection
        )
      }

      // Populate Redux states to trigger component rendering
      const searchResultsObject = {
        type: 'FeatureCollection',
        features: [result],
        searchType: 'Direct'
      }

      // Only set the item result in search results if item was loaded directly via link
      const searchResults = store.getState().mainSlice.searchResults
      if (
        !searchResults?.features ||
        searchResults?.searchType === 'direct-item'
      ) {
        store.dispatch(setSearchResults(searchResultsObject))
        store.dispatch(setmappedScenes(searchResultsObject.features))
        const options = {
          style: footprintLayerStyle
        }
        addDataToLayer(searchResultsObject, 'searchResultsLayer', options, true)
      }

      const existingClickResults = store.getState().mainSlice.clickResults
      const { clickResults, selectedIndex, currentResult } =
        syncSelectionWithFetchedItem(existingClickResults, result)

      store.dispatch(setClickResults(clickResults))
      store.dispatch(setselectedPopupResultIndex(selectedIndex))
      store.dispatch(setCurrentPopupResult(currentResult))
      store.dispatch(settabSelected('details'))

      // Handle visualization from URL
      const { visualizationKeys, hasVisualizations } =
        getCollectionVisualizations(collectionId)

      if (hasVisualizations) {
        // Collection has visualizations - process visualization from URL
        if (visualizationId && visualizationKeys.includes(visualizationId)) {
          // Valid visualization in URL
          store.dispatch(setSelectedVisualization(visualizationId))
        } else {
          // Missing or invalid visualization - use default (first available)
          const defaultVisualization = visualizationKeys[0]
          store.dispatch(setSelectedVisualization(defaultVisualization))
        }
      } else {
        // Collection has 0 visualizations - clear visualization state
        store.dispatch(setSelectedVisualization(null))
      }

      console.log('Router: Item loaded successfully')
    } catch (error) {
      // Catch any unexpected errors and ensure clean state
      console.error('Unexpected error in item route loader:', error)
      clearItemRouteState()
      showApplicationAlert(
        'error',
        'An unexpected error occurred while loading the item'
      )
    }
  },
  component: () => null // App.jsx handles rendering via Redux state
})

const routeTree = rootRoute.addChildren([indexRoute, itemRoute])

export const router = createRouter({ routeTree })
