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
  settabSelected
} from './redux/slices/mainSlice'

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

      // Validate collection exists in configuration
      const collectionConfig = getCollectionConfig(collectionId, 'sceneMinZoom')
      if (!collectionConfig) {
        showApplicationAlert(
          'info',
          `Collection "${collectionId}" is not configured in this deployment`
        )
        return
      }

      // Fetch item from STAC API
      const result = await GetItemService(collectionId, itemId)

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

      // Populate Redux states to trigger component rendering
      store.dispatch(setClickResults([result]))
      store.dispatch(setselectedPopupResultIndex(0))
      store.dispatch(setCurrentPopupResult(result))
      store.dispatch(settabSelected('details'))
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
