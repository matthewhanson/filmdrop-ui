/**
 * STAC API Client
 *
 * Provides methods for interacting with a STAC API catalog.
 * Currently supports fetching the root catalog and collections.
 */

import { STAC_API_CORE, STAC_API_EXTENSIONS } from './stac-api-conformance'

/**
 * Fetches the root catalog from a STAC API
 * @param {string} apiUrl - The base URL of the STAC API
 * @returns {Promise<Object>} The root catalog object
 * @throws {Error} If the fetch fails or returns non-OK response
 */
export async function getRootCatalog(apiUrl) {
  if (!apiUrl) {
    throw new Error('STAC API URL is required')
  }

  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(
      `Failed to fetch root catalog: ${response.status} ${response.statusText}`
    )
  }

  return response.json()
}

/**
 * Fetches all collections from a STAC API
 * @param {string} apiUrl - The base URL of the STAC API
 * @returns {Promise<Object>} The collections response object with collections array
 * @throws {Error} If the fetch fails or returns non-OK response
 */
export async function getCollections(apiUrl) {
  if (!apiUrl) {
    throw new Error('STAC API URL is required')
  }

  const collectionsUrl = `${apiUrl.replace(/\/$/, '')}/collections`

  const response = await fetch(collectionsUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(
      `Failed to fetch collections: ${response.status} ${response.statusText}`
    )
  }

  return response.json()
}

/**
 * Fetches a single collection by ID from a STAC API
 * @param {string} apiUrl - The base URL of the STAC API
 * @param {string} collectionId - The ID of the collection to fetch
 * @returns {Promise<Object>} The collection object
 * @throws {Error} If the fetch fails or returns non-OK response
 */
export async function getCollection(apiUrl, collectionId) {
  if (!apiUrl) {
    throw new Error('STAC API URL is required')
  }
  if (!collectionId) {
    throw new Error('Collection ID is required')
  }

  const collectionUrl = `${apiUrl.replace(/\/$/, '')}/collections/${collectionId}`

  const response = await fetch(collectionUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(
      `Failed to fetch collection ${collectionId}: ${response.status} ${response.statusText}`
    )
  }

  return response.json()
}

/**
 * Checks if the STAC API supports a specific conformance class.
 * The conformsTo array is available in the root catalog (landing page).
 *
 * @param {string} apiUrl - The base URL of the STAC API
 * @param {string} conformanceUri - The conformance URI to check for.
 *   You can use constants from stac-api-conformance.js (e.g., STAC_API_CORE.ITEM_SEARCH)
 *   or provide a custom URI string.
 * @returns {Promise<boolean>} True if the API supports the conformance class, false otherwise
 * @throws {Error} If the API URL or conformance URI is not provided, or if the request fails
 *
 * @example
 * // Check if API supports item search
 * import { STAC_API_CORE } from './stac-api-conformance'
 * const hasSearch = await supportsConformance(apiUrl, STAC_API_CORE.ITEM_SEARCH)
 *
 * @example
 * // Check if API supports aggregation extension
 * import { STAC_API_EXTENSIONS } from './stac-api-conformance'
 * const hasAggregation = await supportsConformance(apiUrl, STAC_API_EXTENSIONS.AGGREGATION)
 */
export async function supportsConformance(apiUrl, conformanceUri) {
  if (!apiUrl) {
    throw new Error('STAC API URL is required')
  }
  if (!conformanceUri) {
    throw new Error('Conformance URI is required')
  }

  const catalog = await getRootCatalog(apiUrl)

  if (!catalog.conformsTo || !Array.isArray(catalog.conformsTo)) {
    return false
  }

  return catalog.conformsTo.includes(conformanceUri)
}

/**
 * Gets all conformance classes supported by the STAC API.
 *
 * @param {string} apiUrl - The base URL of the STAC API
 * @returns {Promise<string[]>} Array of conformance URIs, or empty array if none found
 * @throws {Error} If the API URL is not provided or if the request fails
 *
 * @example
 * const conformance = await getConformance(apiUrl)
 * console.log('Supported conformance classes:', conformance)
 */
export async function getConformance(apiUrl) {
  if (!apiUrl) {
    throw new Error('STAC API URL is required')
  }

  const catalog = await getRootCatalog(apiUrl)

  if (!catalog.conformsTo || !Array.isArray(catalog.conformsTo)) {
    return []
  }

  return catalog.conformsTo
}

/**
 * Checks if the STAC API supports multiple conformance classes.
 * Returns an object mapping each conformance class to its support status.
 *
 * @param {string} apiUrl - The base URL of the STAC API
 * @param {string[]} conformanceUris - Array of conformance URIs to check
 * @returns {Promise<Object<string, boolean>>} Object mapping conformance URIs to support status
 * @throws {Error} If the API URL is not provided or if the request fails
 *
 * @example
 * import { STAC_API_CORE, checkConformance } from './stac-api-client'
 * const support = await checkConformance(apiUrl, [
 *   STAC_API_CORE.CORE,
 *   STAC_API_CORE.ITEM_SEARCH,
 *   STAC_API_CORE.COLLECTIONS
 * ])
 * console.log('Item Search supported:', support[STAC_API_CORE.ITEM_SEARCH])
 */
export async function checkConformance(apiUrl, conformanceUris) {
  if (!apiUrl) {
    throw new Error('STAC API URL is required')
  }

  const supported = await getConformance(apiUrl)
  const result = {}

  for (const uri of conformanceUris) {
    result[uri] = supported.includes(uri)
  }

  return result
}

// Re-export conformance constants for convenience
export { STAC_API_CORE, STAC_API_EXTENSIONS } from './stac-api-conformance'
