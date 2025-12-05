import {
  createRouter,
  createRootRoute,
  createRoute
} from '@tanstack/react-router'
import App from './App'

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

// Item route (placeholder, will be implemented in Phase 3)
const itemRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/item/$collectionId/$itemId',
  component: () => <div>Item Route Placeholder</div>
})

const routeTree = rootRoute.addChildren([indexRoute, itemRoute])

export const router = createRouter({ routeTree })
