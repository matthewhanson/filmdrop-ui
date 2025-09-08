import StacFields from '@radiantearth/stac-fields'

/**
 * FIELD DISCOVERY MODULE
 * Handles field type detection, metadata discovery, and field specification lookup
 */

/**
 * UNIVERSAL FIELD TYPE DISCOVERY
 *
 * Automatically determines the semantic type of a STAC field based on heuristic analysis
 * of the field name, value content, and item context. This enables dynamic formatting
 * without hardcoded field lists.
 *
 * @param {string} field - The field name (e.g., 'eo:cloud_cover', 'proj:centroid')
 * @param {any} value - The field value to analyze
 * @param {Object} item - The STAC item containing the field
 * @returns {string} The discovered field type: 'grid', 'coordinate', 'shape', 'transform', 'processing', 'boolean', 'percentage', or 'standard'
 *
 * DISCOVERY LOGIC:
 *
 * 1. GRID SYSTEMS: Detects reference system fields like MGRS, WRS, UTM
 *    - Field names: 'mgrs:utm_zone', 'landsat:wrs_path', 'grid:code'
 *    - Value patterns: 'MGRS-14R-NU', 'WRS-2: Path: 027 Row: 039'
 *    - Used for: Military Grid Reference System, Worldwide Reference System, UTM zones
 *
 * 2. COORDINATES: Detects spatial coordinate and geometry fields
 *    - Field names: 'proj:centroid', 'proj:bbox', 'geometry:coordinates'
 *    - Value patterns: [lat, lon] arrays, [minX, minY, maxX, maxY] bounding boxes
 *    - Used for: Geographic coordinates, bounding boxes, geometry centers
 *
 * 3. SHAPES: Detects dimensional and shape-related fields
 *    - Field names: 'proj:shape', 'raster:bands', 'dimensions'
 *    - Value patterns: [width, height] arrays, pixel dimensions
 *    - Used for: Image dimensions, raster shapes, spatial extents
 *
 * 4. TRANSFORMS: Detects geometric transformation fields
 *    - Field names: 'proj:transform', 'affine:matrix', 'geotransform'
 *    - Value patterns: Transformation matrices, affine parameters
 *    - Used for: Coordinate transformations, geometric corrections
 *
 * 5. PROCESSING: Detects algorithm and processing-related fields
 *    - Field names: 's2:processing_baseline', 'algorithm:name', 'method:type'
 *    - Value patterns: Version strings, algorithm identifiers
 *    - Used for: Processing versions, algorithm specifications
 *
 * 6. BOOLEAN: Detects true/false fields
 *    - Value type: boolean (true/false)
 *    - Used for: Flags, toggles, presence indicators
 *
 * 7. PERCENTAGE: Detects percentage and ratio fields
 *    - Field names: 'eo:cloud_cover', 'quality:percentage', 'coverage:ratio'
 *    - Value patterns: Numbers between 0-1, percentage strings
 *    - Used for: Cloud cover, quality metrics, coverage ratios
 *
 * 8. STANDARD: Default fallback for unrecognized fields
 *    - Used for: General text, numbers, dates, unknown formats
 */
function discoverFieldType(field, value, item) {
  const fieldLower = field.toLowerCase()
  const valueStr = String(value)

  // GRID SYSTEMS: Military Grid Reference System (MGRS), Worldwide Reference System (WRS), UTM
  // These systems use specific naming conventions and value patterns for spatial referencing
  if (
    fieldLower.includes('grid') || // Generic grid references
    fieldLower.includes('mgrs') || // Military Grid Reference System
    fieldLower.includes('wrs') || // Worldwide Reference System (Landsat)
    fieldLower.includes('utm') || // Universal Transverse Mercator
    fieldLower.includes('tile') || // Tile identifiers
    fieldLower.includes('zone') || // UTM zones, grid zones
    fieldLower.includes('path') || // WRS path numbers
    fieldLower.includes('row') || // WRS row numbers
    valueStr.includes('MGRS') || // MGRS grid codes in values
    valueStr.includes('WRS') || // WRS identifiers in values
    valueStr.includes('UTM') || // UTM references in values
    valueStr.includes('Path:') || // WRS path notation
    valueStr.includes('Row:') // WRS row notation
  ) {
    return 'grid'
  }

  // COORDINATES: Geographic coordinates, bounding boxes, geometry centers
  // Check field name first, then fall back to array length patterns
  if (
    fieldLower.includes('centroid') || // Geometric center points
    fieldLower.includes('bbox') || // Bounding boxes
    fieldLower.includes('lat') || // Latitude references
    fieldLower.includes('lon') || // Longitude references
    fieldLower.includes('coordinate') || // Generic coordinate fields
    fieldLower.includes('geometry') || // Geometry-related fields
    fieldLower.includes('location') // Location fields
  ) {
    return 'coordinate'
  }

  // Additional coordinate detection for arrays (only if not already identified as shape)
  if (
    Array.isArray(value) &&
    (value.length === 2 || value.length === 4) &&
    !fieldLower.includes('shape') && // Exclude shape fields
    !fieldLower.includes('size') && // Exclude size fields
    !fieldLower.includes('dimension') // Exclude dimension fields
  ) {
    return 'coordinate'
  }

  // SHAPES: Image dimensions, raster shapes, spatial extents
  // Typically represent width/height or other dimensional properties
  // Check field name first for explicit shape indicators
  if (
    fieldLower.includes('shape') || // Shape definitions
    fieldLower.includes('size') || // Size specifications
    fieldLower.includes('dimension') || // Dimensional properties
    fieldLower.includes('width') || // Width measurements
    fieldLower.includes('height') || // Height measurements
    fieldLower.includes('pixel') || // Pixel-related dimensions
    fieldLower.includes('resolution') // Resolution specifications
  ) {
    return 'shape'
  }

  // TRANSFORMS: Geometric transformations, affine matrices, coordinate transformations
  // Used for converting between coordinate systems or applying geometric corrections
  if (
    fieldLower.includes('transform') || // Transformation matrices
    fieldLower.includes('matrix') || // Transformation matrices
    fieldLower.includes('affine') || // Affine transformations
    fieldLower.includes('projection') || // Projection parameters
    fieldLower.includes('epsg') || // EPSG coordinate system codes
    (Array.isArray(value) && value.length === 6) // 6-element transformation arrays
  ) {
    return 'transform'
  }

  // PROCESSING: Algorithm specifications, processing versions, method descriptions
  // Indicates how data was processed or which algorithms were used
  if (
    fieldLower.includes('processing') || // Processing information
    fieldLower.includes('software') || // Software specifications
    fieldLower.includes('algorithm') || // Algorithm specifications
    fieldLower.includes('workflow') || // Processing workflows
    fieldLower.includes('version') || // Version information
    (typeof value === 'object' && value !== null && value.name) // Named objects
  ) {
    return 'processing'
  }

  // BOOLEAN: True/false values for flags, toggles, presence indicators
  // Simple type check for boolean values
  if (typeof value === 'boolean') {
    return 'boolean'
  }

  // PERCENTAGE: Cloud cover, quality metrics, coverage ratios
  // Numbers between 0-1 or fields with percentage-related names
  if (
    fieldLower.includes('percentage') || // Explicit percentage fields
    fieldLower.includes('cover') || // Cloud cover, snow cover, etc.
    (typeof value === 'number' && value >= 0 && value <= 1) // Normalized values (0-1)
  ) {
    return 'percentage'
  }

  // STANDARD: Default fallback for unrecognized fields
  // Used for general text, numbers, dates, and unknown formats
  return 'standard'
}

/**
 * Public wrapper to discover a field's high-level type for UI logic
 */
export function getStacFieldType(field, value, item) {
  try {
    return discoverFieldType(field, value, item)
  } catch (_) {
    return 'standard'
  }
}

/**
 * Get field specification from STAC registry
 */
export function getFieldSpec(field, item) {
  try {
    return StacFields.Registry.getSpecification(field)
  } catch (error) {
    return null
  }
}

/**
 * Get comprehensive field metadata including tooltip information
 */
export function getFieldMetadata(field, item = null) {
  try {
    const spec = StacFields.Registry.getSpecification(field)
    const tooltipContent =
      spec?.description || spec?.explain || spec?.title || null
    const hasTooltip = !!tooltipContent

    return {
      hasTooltip,
      tooltipContent,
      tooltipSource: hasTooltip ? 'registry' : null
    }
  } catch (error) {
    return {
      hasTooltip: false,
      tooltipContent: null,
      tooltipSource: null
    }
  }
}

/**
 * Get tooltip information for a field
 */
export function getFieldTooltipInfo(field, item = null) {
  const metadata = getFieldMetadata(field, item)
  return metadata.hasTooltip
    ? {
        content: metadata.tooltipContent,
        shouldShow: true,
        source: metadata.tooltipSource
      }
    : null
}

/**
 * Check if a field is supported by the STAC registry
 */
export function isFieldSupported(field) {
  try {
    const spec = StacFields.Registry.getSpecification(field)
    return !!spec
  } catch (error) {
    return false
  }
}

/**
 * Discover field metadata for a given field and collection
 */
export function discoverFieldMetadata(field, collection) {
  try {
    const spec = StacFields.Registry.getSpecification(field)
    return {
      label: spec?.label || getFallbackFieldLabel(field),
      unit: spec?.unit || null,
      description: spec?.description || null,
      type: spec?.type || 'string'
    }
  } catch (error) {
    return {
      label: getFallbackFieldLabel(field),
      unit: null,
      description: null,
      type: 'string'
    }
  }
}

/**
 * Generate a fallback label for unknown fields
 */
export function getFallbackFieldLabel(field) {
  return field
    .replace(/^(eo|sar|proj|s2|landsat|sat|view|storage|processing):/, '')
    .replace(/[-_:]/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .trim()
}
