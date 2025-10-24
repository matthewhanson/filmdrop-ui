/**
 * STAC API Client Library
 *
 * A modular client for interacting with STAC APIs.
 * Provides functions for fetching catalogs, collections, and checking conformance.
 */

// Export all client functions
export {
  getRootCatalog,
  getCollections,
  getCollection,
  supportsConformance,
  getConformance,
  checkConformance
} from './stac-api-client'

// Export all conformance constants
export {
  STAC_API_CORE,
  STAC_API_EXTENSIONS,
  STAC_API_EXTENSIONS_COMMUNITY,
  ALL_CONFORMANCE_CLASSES,
  getConformanceName
} from './stac-api-conformance'
