import {
  createRouter,
  createRootRoute,
  createRoute
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
  loader: async ({ params }) => {
    const { collectionId, itemId } = params

    // Validate collection exists in configuration
    const collectionConfig = getCollectionConfig(collectionId, 'sceneMinZoom')
    if (!collectionConfig) {
      showApplicationAlert('info', 'Collection not configured')
      return
    }

    // Fetch item from STAC API
    const result = await GetItemService(collectionId, itemId)

    if (result.error) {
      if (result.status === 404) {
        showApplicationAlert('error', 'Item not found')
      } else {
        showApplicationAlert('error', 'Unable to load item. Please try again.')
      }
      return
    }

    // Populate Redux states to trigger component rendering
    store.dispatch(setClickResults([result]))
    store.dispatch(setselectedPopupResultIndex(0))
    store.dispatch(setCurrentPopupResult(result))
    store.dispatch(settabSelected('details'))
  },
  component: () => null // App.jsx handles rendering via Redux state
})

const routeTree = rootRoute.addChildren([indexRoute, itemRoute])

export const router = createRouter({ routeTree })
