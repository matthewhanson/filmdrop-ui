import { getStacFieldType } from './fieldDiscovery.js'

/**
 * FIELD PRIORITIES MODULE
 * Handles field priority management and sorting for display order
 */

/**
 * Sort fields by priority for display
 * @param {Object} fields - Object of field names to values
 * @param {Array} fieldPriorities - Array of field names in priority order
 * @returns {Array} Sorted array of [field, value] tuples
 */
export function sortFieldsByPriority(fields, fieldPriorities) {
  return Object.entries(fields).sort(([a], [b]) => {
    const aIndex = fieldPriorities.indexOf(a)
    const bIndex = fieldPriorities.indexOf(b)
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b)
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1
    return aIndex - bIndex
  })
}

/**
 * DYNAMIC FIELD PRIORITY GENERATION
 *
 * Generates field priorities for display order using dynamic scoring based on field types,
 * presence, and semantic importance. This enables intelligent field ordering without
 * hardcoded priority lists, adapting to different STAC collections and data structures.
 *
 * @param {string|Object} collection - Collection ID string or STAC item object
 * @returns {Array} Array of field names in priority order (highest to lowest priority)
 *
 * PRIORITY GENERATION STRATEGY:
 *
 * 1. INPUT VALIDATION: Handles both collection ID strings and STAC item objects
 *    - Collection ID: Returns generic priority list
 *    - STAC Item: Computes dynamic priorities from actual data
 *
 * 2. DYNAMIC SCORING: Scores fields based on multiple factors
 *    - Field Type Importance: Grid, coordinate, and percentage fields get higher scores
 *    - Field Presence: Fields with actual values get priority over missing fields
 *    - Semantic Importance: Core STAC fields (datetime, platform) get base priority
 *    - Value Complexity: Simple scalar values preferred over complex objects
 *
 * 3. SCORING ALGORITHM: Each field receives a score based on:
 *    - Base score: 100 for core fields, 50 for extension fields
 *    - Type bonus: +50 for grid/coordinate/percentage fields
 *    - Presence bonus: +25 for fields with actual values
 *    - Complexity penalty: -25 for complex objects/arrays
 *
 * 4. SORTING: Fields sorted by score (highest first), then alphabetically
 *
 * FIELD TYPE SCORING:
 *
 * HIGH PRIORITY (+50 bonus):
 * - grid: MGRS, WRS, UTM grid systems
 * - coordinate: Geographic coordinates, bounding boxes
 * - percentage: Cloud cover, quality metrics
 *
 * MEDIUM PRIORITY (base score):
 * - shape: Dimensions, sizes
 * - processing: Algorithm information
 * - boolean: True/false flags
 *
 * LOW PRIORITY (base score):
 * - standard: General text, numbers
 * - transform: Transformation matrices
 *
 * CORE STAC FIELDS (always prioritized):
 * - datetime: Acquisition time
 * - platform: Satellite/platform name
 * - instruments: Instrument specifications
 * - eo:cloud_cover: Cloud coverage percentage
 * - gsd: Ground sample distance
 * - proj:epsg: Coordinate system
 * - proj:centroid: Geographic center
 *
 * OUTPUT: Array of field names ordered by priority for optimal display
 */
export function getCollectionFieldPriorities(collection) {
  // Backward-compatible signature: allow either an item object or a collection id
  // If an item with properties is provided, compute priorities dynamically from the data
  try {
    const item =
      collection && typeof collection === 'object' && collection.properties
        ? collection
        : null

    if (!item) {
      // Fallback generic order when only a collection id string is available
      return [
        'datetime',
        'platform',
        'instruments',
        'eo:cloud_cover',
        'gsd',
        'proj:epsg',
        'proj:centroid'
      ]
    }

    const properties = item.properties || {}
    const keys = Object.keys(properties)

    // DYNAMIC SCORING: Assign scores based on discovered type and general usefulness
    const fieldScores = new Map()

    const scoreFor = (field, value) => {
      const fieldLower = field.toLowerCase()
      let score = 10 // Base score for unknown fields

      // STEP 1: CORE STAC FIELDS - Highest priority for essential metadata
      // These fields are universally important across all STAC collections
      if (fieldLower === 'datetime') score = 100 // Acquisition time (most important)
      if (fieldLower === 'platform') score = Math.max(score, 90) // Satellite/platform name
      if (fieldLower === 'instruments') score = Math.max(score, 85) // Instrument specifications
      if (fieldLower === 'gsd') score = Math.max(score, 80) // Ground sample distance
      if (fieldLower === 'proj:epsg') score = Math.max(score, 78) // Coordinate system
      if (fieldLower === 'proj:centroid') score = Math.max(score, 75) // Geographic center

      // STEP 2: TYPE-BASED SCORING - Use universal type discovery for dynamic scoring
      // This enables intelligent scoring across ANY collection without hardcoded lists
      try {
        const t = getStacFieldType(field, value, item)
        switch (t) {
          case 'grid': // Grid systems (MGRS, WRS, UTM) - very important for spatial reference
            score = Math.max(score, 88)
            break
          case 'coordinate': // Geographic coordinates - important for spatial context
            score = Math.max(score, 82)
            break
          case 'percentage': // Cloud cover, quality metrics - important for data quality
            score = Math.max(score, 77)
            break
          case 'shape': // Dimensions, sizes - moderately important
            score = Math.max(score, 60)
            break
          case 'transform': // Transformation matrices - technical, lower priority
            score = Math.max(score, 58)
            break
          case 'processing':
            score = Math.max(score, 50)
            break
          case 'boolean':
            score = Math.max(score, 40)
            break
          default:
            break
        }
      } catch (_) {}

      // Prefer concise scalar values over large objects/arrays for overview
      if (
        typeof value === 'number' ||
        typeof value === 'string' ||
        typeof value === 'boolean'
      ) {
        score += 5
      }

      return score
    }

    keys.forEach((k) => fieldScores.set(k, scoreFor(k, properties[k])))

    return keys
      .sort((a, b) => {
        const sa = fieldScores.get(a) || 0
        const sb = fieldScores.get(b) || 0
        if (sb !== sa) return sb - sa
        return a.localeCompare(b)
      })
      .slice(0, keys.length)
  } catch (_) {
    return [
      'datetime',
      'platform',
      'instruments',
      'eo:cloud_cover',
      'gsd',
      'proj:epsg',
      'proj:centroid'
    ]
  }
}
