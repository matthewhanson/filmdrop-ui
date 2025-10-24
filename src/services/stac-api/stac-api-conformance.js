/**
 * STAC API Conformance Classes
 *
 * Standard conformance URIs for STAC API specifications and extensions.
 * See: https://github.com/radiantearth/stac-api-spec
 * See: https://stac-api-extensions.github.io/
 */

/**
 * Core STAC API conformance classes
 * These are the foundational specifications for STAC APIs
 */
export const STAC_API_CORE = {
  /** STAC API - Core (required for all STAC APIs) */
  CORE: 'https://api.stacspec.org/v1.0.0/core',

  /** STAC API - Collections endpoint */
  COLLECTIONS: 'https://api.stacspec.org/v1.0.0/collections',

  /** STAC API - Item Search endpoint */
  ITEM_SEARCH: 'https://api.stacspec.org/v1.0.0/item-search',

  /** OGC API - Features Core conformance */
  OGCAPI_FEATURES:
    'http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/core',

  /** OGC API - Features Geospatial Data (GeoJSON) */
  OGCAPI_FEATURES_GEOJSON:
    'http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/geojson',

  /** OGC API - Features OpenAPI 3.0 */
  OGCAPI_FEATURES_OAS30:
    'http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/oas30'
}

/**
 * STAC API Extensions
 * Optional extensions that add additional capabilities to STAC APIs
 */
export const STAC_API_EXTENSIONS = {
  /** Query extension - Enhanced filtering capabilities */
  QUERY: 'https://api.stacspec.org/v1.0.0/item-search#query',

  /** Fields extension - Select specific fields to return */
  FIELDS: 'https://api.stacspec.org/v1.0.0/item-search#fields',

  /** Sort extension - Sort search results */
  SORT: 'https://api.stacspec.org/v1.0.0/item-search#sort',

  /** Context extension - Additional metadata about search results */
  CONTEXT: 'https://api.stacspec.org/v1.0.0/item-search#context',

  /** Filter extension - CQL2 filtering */
  FILTER: 'https://api.stacspec.org/v1.0.0/item-search#filter',

  /** Aggregation extension - Aggregate search results */
  AGGREGATION: 'https://api.stacspec.org/v1.0.0-rc.1/aggregation',

  /** Transaction extension - Create/Update/Delete items */
  TRANSACTION:
    'https://api.stacspec.org/v1.0.0-rc.1/ogcapi-features/extensions/transaction'
}

/**
 * Additional STAC API Extensions commonly used
 */
export const STAC_API_EXTENSIONS_COMMUNITY = {
  /** Free-text search extension */
  FREE_TEXT: 'https://api.stacspec.org/v1.0.0-rc.1/item-search#free-text',

  /** Browseable extension - Browse by datetime */
  BROWSEABLE: 'https://github.com/stac-api-extensions/browseable',

  /** Children extension - List child catalogs/collections */
  CHILDREN: 'https://api.stacspec.org/v1.0.0-rc.1/children',

  /** Collection search extension */
  COLLECTION_SEARCH: 'https://api.stacspec.org/v1.0.0-rc.1/collection-search'
}

/**
 * All conformance classes grouped together
 * Useful for checking multiple conformance classes at once
 */
export const ALL_CONFORMANCE_CLASSES = {
  ...STAC_API_CORE,
  ...STAC_API_EXTENSIONS,
  ...STAC_API_EXTENSIONS_COMMUNITY
}

/**
 * Helper to get conformance class name from URI
 * @param {string} uri - The conformance URI
 * @returns {string|null} The name of the conformance class or null if not found
 */
export function getConformanceName(uri) {
  for (const [name, value] of Object.entries(ALL_CONFORMANCE_CLASSES)) {
    if (value === uri) {
      return name
    }
  }
  return null
}
