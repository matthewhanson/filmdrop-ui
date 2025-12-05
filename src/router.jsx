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
import { getCollectionConfig } from './utils/configHelper'
import { showApplicationAlert } from './utils/alertHelper'
import { store } from './redux/store'
import {
  setClickResults,
  setCurrentPopupResult,
  setselectedPopupResultIndex,
  settabSelected,
  setSelectedCollectionData,
  setSelectedCollection
} from './redux/slices/mainSlice'
import { LoadConfigIntoStateService } from './services/get-config-service'
import { GetCollectionsService } from './services/get-collections-service'

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
    try {
      // TanStack Router automatically decodes path parameters
      const { collectionId, itemId } = params

      // Ensure config is loaded - trigger load if not already loading
      let appConfig = store.getState().mainSlice.appConfig

      if (!appConfig || !appConfig.STAC_API_URL) {
        console.log(
          'Router: Config not loaded, triggering LoadConfigIntoStateService'
        )
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
          console.log('Router: Config loaded successfully')
          break
        }

        await new Promise((resolve) => setTimeout(resolve, 50))
      }

      if (!appConfig || !appConfig.STAC_API_URL) {
        console.error('Router: Configuration failed to load within timeout')
        showApplicationAlert('error', 'Configuration failed to load')
        return
      }

      // Ensure collections data is loaded
      let collectionsData = store.getState().mainSlice.collectionsData

      if (!collectionsData || collectionsData.length === 0) {
        console.log(
          'Router: Collections not loaded, triggering GetCollectionsService'
        )
        await GetCollectionsService()
      }

      // Wait for collections data to be loaded
      startTime = Date.now()
      while (Date.now() - startTime < maxWaitTime) {
        collectionsData = store.getState().mainSlice.collectionsData

        if (collectionsData && collectionsData.length > 0) {
          console.log('Router: Collections loaded successfully')
          break
        }

        await new Promise((resolve) => setTimeout(resolve, 50))
      }

      if (!collectionsData || collectionsData.length === 0) {
        console.error('Router: Collections failed to load within timeout')
        showApplicationAlert('error', 'Collections data failed to load')
        return
      }

      // Validate collection exists in configuration
      console.log(
        'Router: Validating collection',
        collectionId,
        'for item',
        itemId
      )
      const collectionConfig = getCollectionConfig(collectionId, 'sceneMinZoom')
      console.log('Router: Collection config result:', collectionConfig)

      if (!collectionConfig) {
        console.warn('Router: Collection not found in config', collectionId)
        showApplicationAlert(
          'info',
          `Collection "${collectionId}" is not configured in this deployment`
        )
        return
      }

      // Fetch item from STAC API
      console.log('Router: Fetching item from STAC API')
      const result = await GetItemService(collectionId, itemId)
      console.log(
        'Router: Item fetch result:',
        result.error ? 'ERROR' : 'SUCCESS'
      )

      if (result.error) {
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
        console.log(
          'Router: Setting selected collection:',
          selectedCollection.id
        )
        store.dispatch(setSelectedCollection(selectedCollection.id))
        store.dispatch(setSelectedCollectionData(selectedCollection))
      } else {
        console.warn(
          'Router: Collection data not found for:',
          result.collection
        )
      }

      // Populate Redux states to trigger component rendering
      console.log('Router: Populating Redux state with item')
      store.dispatch(setClickResults([result]))
      store.dispatch(setselectedPopupResultIndex(0))
      store.dispatch(setCurrentPopupResult(result))
      store.dispatch(settabSelected('details'))
      console.log('Router: Item loaded successfully')
    } catch (error) {
      // Catch any unexpected errors
      console.error('Unexpected error in item route loader:', error)
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
