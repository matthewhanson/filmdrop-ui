/**
 * FIELD GROUPING MODULE
 * Handles semantic grouping and filtering of STAC fields
 */

/**
 * SEMANTIC FIELD GROUPING
 *
 * Groups STAC item properties by their extension prefix into semantic categories,
 * enabling organized display of related fields in the UI. This follows STAC extension
 * conventions where fields are prefixed with their extension namespace.
 *
 * @param {Record<string, any>} properties - The STAC item properties object
 * @param {Function} filterPredicate - Optional predicate to filter fields before grouping
 * @returns {Record<string, Record<string, any>>} Grouped properties by extension prefix
 *
 * GROUPING STRATEGY:
 *
 * 1. EXTENSION PREFIX DETECTION: Identifies STAC extension prefixes in field names
 *    - Fields with ":" separator: "proj:epsg" → "proj" group
 *    - Fields without ":" separator: "datetime" → "core" group
 *
 * 2. SEMANTIC CATEGORIZATION: Groups related fields by their extension namespace
 *    - "proj:" → Projection and coordinate system fields
 *    - "eo:" → Earth Observation fields (cloud cover, sun angles, etc.)
 *    - "s2:" → Sentinel-2 specific fields
 *    - "landsat:" → Landsat specific fields
 *    - "mgrs:" → Military Grid Reference System fields
 *    - "core" → Core STAC fields (datetime, platform, etc.)
 *
 * 3. OPTIONAL FILTERING: Applies filter predicate before grouping
 *    - Allows field-level filtering based on configuration
 *    - Enables collection-specific field display
 *    - Supports dynamic field selection
 *
 * COMMON STAC EXTENSIONS:
 *
 * - proj: Projection and coordinate system information
 * - eo: Earth Observation metadata (cloud cover, sun angles, etc.)
 * - view: Viewing geometry (sun elevation, azimuth, etc.)
 * - s2: Sentinel-2 specific metadata
 * - landsat: Landsat specific metadata
 * - mgrs: Military Grid Reference System
 * - sar: Synthetic Aperture Radar metadata
 * - sat: Satellite orbit and state information
 * - sci: Scientific metadata (DOIs, citations, etc.)
 * - processing: Processing and algorithm information
 * - quality: Quality assessment and metrics
 *
 * OUTPUT STRUCTURE:
 * {
 *   "proj": { "proj:epsg": 32614, "proj:centroid": [lat, lon] },
 *   "eo": { "eo:cloud_cover": 0.15, "eo:sun_elevation": 45.2 },
 *   "core": { "datetime": "2023-01-01T00:00:00Z", "platform": "sentinel-2a" }
 * }
 */
export function groupFieldsSemantically(properties, filterPredicate = null) {
  const groups = {}
  if (!properties || typeof properties !== 'object') return groups

  for (const [key, value] of Object.entries(properties)) {
    // STEP 1: OPTIONAL FILTERING - Apply filter predicate if provided
    // This allows collection-specific field filtering before grouping
    if (filterPredicate && !filterPredicate(key, { properties })) {
      continue
    }

    // STEP 2: EXTENSION PREFIX DETECTION - Extract extension prefix from field name
    // Fields with ":" separator use the prefix, others go to "core" group
    const extension = key.includes(':') ? key.split(':')[0] : 'core'

    // STEP 3: GROUP CREATION - Create group if it doesn't exist and add field
    if (!groups[extension]) groups[extension] = {}
    groups[extension][key] = value
  }

  return groups
}

/**
 * ENHANCED DISPLAY FIELD FILTER
 * Collection-specific field lists.
 * Uses specific STAC field names for configuration.
 *
 * COMMON STAC FIELD EXAMPLES:
 * - Project: "collection", "mission", "constellation", "title", "description"
 * - Vendor: "platform", "instruments", "constellation", "mission"
 * - Product Type: "landsat:correction", "s2:product_type", "s2:processing_baseline", "collection_category"
 * - Time: "datetime", "created", "updated", "landsat:product_generated"
 * - Spatial/Area: "proj:epsg", "proj:centroid", "bbox"
 * - Grid Systems: "mgrs:utm_zone", "mgrs:latitude_band", "mgrs:grid_square", "landsat:wrs_path", "landsat:wrs_row", "grid:code"
 * - Quality: "eo:cloud_cover", "landsat:cloud_cover_land"
 * - Instrument: "sar:instrument_mode", "sar:polarizations", "sar:frequency_band", "sat:orbit_state"
 * - Extras: "gsd", "processing:software", "earthsearch:payload_id"
 *
 * @param {string} collectionId - The collection ID (e.g., 'sentinel-2-l2a')
 * @param {object} appConfig - The application configuration object
 * @returns {Function} A predicate function that filters fields based on config
 */
export function createEnhancedDisplayFieldPredicate(collectionId, appConfig) {
  // Get the configured fields for this collection
  const configuredFields = appConfig?.ENHANCED_DISPLAY_FIELDS?.[collectionId]

  if (!configuredFields) {
    // If no config exists for this collection, show all fields (fallback to auto-discovery)
    return () => true
  }

  // Create a Set for O(1) lookup performance
  const allowedFields = new Set(configuredFields)

  return function predicate(field) {
    return allowedFields.has(field)
  }
}

/**
 * Builds a zero-config, best-effort ordered list of display fields from item properties
 * @param {object} item - The STAC item
 * @returns {string[]} Array of field names in display order
 */
export function buildAutoDisplayFieldList(item) {
  if (!item || !item.properties) return []
  const props = item.properties
  const keys = Object.keys(props)

  // Import here to avoid circular dependency
  const { getCollectionFieldPriorities } = require('./fieldPriorities.js')
  const priorities = getCollectionFieldPriorities(item)

  // Start with dynamic priorities scored per item
  const prioritized = priorities.filter((k) => keys.includes(k))

  // Heuristic skip rules (non-hardcoded to specific fields, only structural exclusions)
  const structuralPrefixes = ['geometry', 'links', 'assets']

  const rest = keys.filter((k) => {
    if (prioritized.includes(k)) return false
    const lower = k.toLowerCase()
    if (structuralPrefixes.some((p) => lower.startsWith(p))) return false
    // Exclude very large object shapes by default (still visible in Enhanced modal)
    const v = props[k]
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const size = Object.keys(v).length
      if (size > 20) return false
    }
    return true
  })

  return [...prioritized, ...rest]
}
