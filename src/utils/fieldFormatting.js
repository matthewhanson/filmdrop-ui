import StacFields from '@radiantearth/stac-fields'
import { getStacFieldType, getFieldSpec } from './fieldDiscovery.js'
import { sanitizeFieldValue, validateFieldSecurity } from './securityHelper.js'

/**
 * FIELD FORMATTING MODULE
 * Handles value formatting, component extraction, and HTML generation
 */

/**
 * Main entry point - automatically formats ANY STAC field
 * @param {string} field - The field name
 * @param {any} value - The field value
 * @param {object} item - The full STAC item
 * @returns {string} Formatted field value with HTML
 */
export function formatStacFieldEnhanced(field, value, item) {
  if (!item?.properties) {
    return formatStacField(field, value, item)
  }

  // SECURITY STEP: Validate input but preserve original types for processing
  const securityValidation = validateFieldSecurity(field, value)
  const sanitizedField = securityValidation.sanitizedField

  // Log security warnings in development (only for actual security issues)
  if (
    process.env.NODE_ENV === 'development' &&
    securityValidation.warnings.length > 0 &&
    securityValidation.warnings.some((w) => w.includes('dangerous HTML'))
  ) {
    console.warn(
      'Security warnings for field:',
      sanitizedField,
      securityValidation.warnings
    )
  }

  // Step 1: Discover field type automatically (using original values for type detection)
  const fieldType = getStacFieldType(field, value, item)

  // Step 2: Extract components using universal extractor (using original values)
  const components = extractFieldComponents(field, value, item, fieldType)

  // Step 3: Generate HTML using universal formatter (sanitization happens in HTML generation)
  if (components && components.length > 0) {
    return generateFieldHtml(fieldType, components, sanitizedField, item)
  }

  // Fallback to standard formatting (with sanitization)
  return formatStacField(sanitizedField, value, item)
}

/**
 * UNIVERSAL COMPONENT EXTRACTOR
 *
 * Extracts meaningful, displayable components from any STAC field type by delegating
 * to specialized extractors based on the discovered field type. This enables consistent
 * component extraction across all field types without hardcoded field lists.
 *
 * @param {string} field - The field name (e.g., 'eo:cloud_cover', 'proj:centroid')
 * @param {any} value - The field value to extract components from
 * @param {Object} item - The STAC item containing the field
 * @param {string} fieldType - The discovered field type from discoverFieldType()
 * @returns {Array} Array of component objects with {label, value, unit} properties
 *
 * COMPONENT EXTRACTION STRATEGY:
 *
 * Each specialized extractor follows a consistent pattern:
 * 1. Analyze the field name and value structure
 * 2. Break down complex values into logical subcomponents
 * 3. Apply appropriate formatting and units
 * 4. Return standardized component objects
 *
 * COMPONENT OBJECT STRUCTURE:
 * - label: Human-readable component name
 * - value: Formatted component value
 * - unit: Unit of measurement (if applicable)
 * - type: Component type for styling
 *
 * SPECIALIZED EXTRACTORS:
 * - extractGridComponents: Handles MGRS, WRS, UTM grid systems
 * - extractCoordinateComponents: Handles lat/lon, bbox coordinates
 * - extractShapeComponents: Handles dimensions, shapes, sizes
 * - extractTransformComponents: Handles transformation matrices
 * - extractProcessingComponents: Handles processing information
 * - extractBooleanComponents: Handles true/false values
 * - extractPercentageComponents: Handles percentages and ratios
 * - extractStandardComponents: Handles general text/numbers
 */
function extractFieldComponents(field, value, item, fieldType) {
  switch (fieldType) {
    case 'grid':
      return extractGridComponents(field, value, item)
    case 'coordinate':
      return extractCoordinateComponents(field, value, item)
    case 'shape':
      return extractShapeComponents(field, value, item)
    case 'transform':
      return extractTransformComponents(field, value, item)
    case 'processing':
      return extractProcessingComponents(field, value, item)
    case 'boolean':
      return extractBooleanComponents(field, value, item)
    case 'percentage':
      return extractPercentageComponents(field, value, item)
    default:
      return null
  }
}

/**
 * GRID COMPONENT EXTRACTOR
 *
 * Extracts individual components from grid reference systems (MGRS, WRS, UTM) by analyzing
 * the STAC item properties and breaking down complex grid values into displayable subcomponents.
 * This handles the complexity of grid systems that often contain multiple related fields.
 *
 * @param {string} field - The field name being processed
 * @param {any} value - The field value (may be complex or simple)
 * @param {Object} item - The STAC item containing all properties
 * @returns {Array} Array of grid component objects
 *
 * EXTRACTION STRATEGY:
 *
 * 1. PROPERTY SCANNING: Scans all item properties for grid-related fields
 *    - MGRS fields: utm_zone, latitude_band, grid_square
 *    - WRS fields: wrs_type, wrs_path, wrs_row
 *    - Generic: tile, zone, grid:code
 *
 * 2. COMPONENT CREATION: For each grid property found:
 *    - Generates human-readable label using generateDynamicLabel()
 *    - Infers grid system type using inferGridSystem()
 *    - Creates standardized component object
 *
 * 3. VALUE PARSING: If no properties found, attempts to parse the value string
 *    - Handles composite strings like "MGRS-14R-NU"
 *    - Breaks down into individual components
 *
 * GRID SYSTEMS HANDLED:
 *
 * - MGRS (Military Grid Reference System): UTM zones, latitude bands, grid squares
 * - WRS (Worldwide Reference System): Landsat path/row system
 * - UTM (Universal Transverse Mercator): Zone-based coordinate system
 * - Generic grid systems: Tile identifiers, zone codes
 *
 * COMPONENT OBJECT STRUCTURE:
 * - label: Human-readable component name (e.g., "Utm Zone", "Grid Square")
 * - value: The component value (e.g., 14, "R", "NU")
 * - system: Grid system type (e.g., "MGRS", "WRS", "UTM")
 * - source: Original property name for reference
 */
function extractGridComponents(field, value, item) {
  const components = []

  // STEP 1: PROPERTY SCANNING - Look for grid-related properties in the item
  // This handles cases where grid information is spread across multiple fields
  Object.entries(item.properties).forEach(([propName, propValue]) => {
    const propLower = propName.toLowerCase()

    // Identify grid-related properties by name patterns
    if (
      propLower.includes('utm_zone') || // MGRS UTM zone (e.g., 14)
      propLower.includes('latitude_band') || // MGRS latitude band (e.g., R)
      propLower.includes('grid_square') || // MGRS grid square (e.g., NU)
      propLower.includes('wrs_type') || // WRS system type (e.g., WRS-2)
      propLower.includes('wrs_path') || // WRS path number (e.g., 027)
      propLower.includes('wrs_row') || // WRS row number (e.g., 039)
      propLower.includes('tile') || // Generic tile identifiers
      propLower.includes('zone') || // Generic zone references
      propLower === 'grid:code' // Explicit grid code field
    ) {
      // SECURITY: Sanitize property name and value
      const sanitizedPropName = sanitizeFieldValue(propName, false)
      const sanitizedPropValue = sanitizeFieldValue(propValue, false)

      // Generate human-readable label from sanitized property name
      const label = generateDynamicLabel(sanitizedPropName)
      // Infer which grid system this belongs to (using sanitized values)
      const system = inferGridSystem(sanitizedPropName, sanitizedPropValue)

      components.push({
        label,
        value: sanitizedPropValue,
        system,
        source: sanitizedPropName
      })
    }
  })

  // STEP 2: VALUE PARSING - If no components found, try to parse the value itself
  // This handles cases where grid information is in a single composite string
  if (components.length === 0 && typeof value === 'string') {
    const parsed = parseGridValue(value)
    if (parsed) {
      components.push(...parsed)
    }
  }

  return components
}

/**
 * Extract coordinate components dynamically
 */
function extractCoordinateComponents(field, value, item) {
  const components = []

  if (field === 'proj:centroid' && value && typeof value === 'object') {
    const lat =
      value.lat ?? value.latitude ?? (Array.isArray(value) ? value[1] : null)
    const lon =
      value.lon ?? value.longitude ?? (Array.isArray(value) ? value[0] : null)
    if (typeof lat === 'number' && typeof lon === 'number') {
      components.push({ type: 'centroid', lat, lon, source: field })
    }
  } else if (
    field === 'proj:centroid' &&
    Array.isArray(value) &&
    value.length >= 2
  ) {
    components.push({
      type: 'centroid',
      lat: value[1],
      lon: value[0],
      source: field
    })
  } else if (field === 'bbox' && Array.isArray(value) && value.length >= 4) {
    const [minLon, minLat, maxLon, maxLat] = value
    components.push({
      type: 'bbox',
      minLat,
      minLon,
      maxLat,
      maxLon,
      centerLat: (minLat + maxLat) / 2,
      centerLon: (minLon + maxLon) / 2,
      source: field
    })
  }

  return components
}

/**
 * Extract shape components dynamically
 */
function extractShapeComponents(field, value, item) {
  const components = []

  if (field === 'proj:shape' && Array.isArray(value) && value.length >= 2) {
    components.push({
      type: 'shape',
      width: value[0],
      height: value[1],
      source: field
    })
  }

  return components
}

/**
 * Extract transform components dynamically
 */
function extractTransformComponents(field, value, item) {
  const components = []

  if (field === 'proj:transform' && Array.isArray(value) && value.length >= 6) {
    components.push({
      type: 'transform',
      pixelSizeX: value[0],
      rotationX: value[1],
      originX: value[2],
      rotationY: value[3],
      pixelSizeY: value[4],
      originY: value[5],
      source: field
    })
  }

  return components
}

/**
 * Extract processing components dynamically
 */
function extractProcessingComponents(field, value, item) {
  const components = []

  if (
    field === 'processing:software' &&
    value &&
    typeof value === 'object' &&
    value.name
  ) {
    components.push({
      type: 'software',
      name: value.name,
      version: value.version || 'Unknown',
      source: field
    })
    return components
  }

  if (
    field === 'processing:software' &&
    value &&
    typeof value === 'object' &&
    !Array.isArray(value)
  ) {
    for (const [k, v] of Object.entries(value)) {
      components.push({
        type: 'software',
        name: k,
        version: typeof v === 'string' ? v : String(v),
        source: field
      })
    }
    return components
  }

  return components
}

/**
 * Extract boolean components
 */
function extractBooleanComponents(field, value, item) {
  return [
    {
      type: 'boolean',
      value,
      source: field
    }
  ]
}

/**
 * Extract percentage components
 */
function extractPercentageComponents(field, value, item) {
  const fieldLower = field.toLowerCase()
  if (typeof value === 'number') {
    if (value >= 0 && value <= 1) {
      return [
        { type: 'percentage', value: (value * 100).toFixed(2), source: field }
      ]
    }
    if (
      (fieldLower.includes('cover') ||
        fieldLower.includes('cloud_cover') ||
        fieldLower.endsWith(':cloud_cover')) &&
      value >= 0 &&
      value <= 100
    ) {
      return [{ type: 'percentage', value: value.toFixed(2), source: field }]
    }
  }
  return null
}

/**
 * UNIVERSAL HTML GENERATOR
 *
 * Creates consistent, formatted HTML output for any STAC field type by delegating
 * to specialized HTML generators based on the discovered field type. This ensures
 * consistent formatting across all field types while allowing type-specific optimizations.
 *
 * @param {string} fieldType - The discovered field type from discoverFieldType()
 * @param {Array} components - Array of component objects from extractFieldComponents()
 * @param {string} field - The original field name
 * @param {Object} item - The STAC item containing the field
 * @returns {string} Formatted HTML string for display
 *
 * HTML GENERATION STRATEGY:
 *
 * 1. FIELD SPECIFICATION: Retrieves STAC field specification for metadata
 * 2. TYPE DELEGATION: Routes to specialized HTML generator based on field type
 * 3. CONSISTENT OUTPUT: Each generator returns standardized HTML format
 * 4. FALLBACK HANDLING: Falls back to standard formatting for unknown types
 *
 * SPECIALIZED GENERATORS:
 *
 * - generateGridHtml: Handles MGRS, WRS, UTM grid systems with subfield optimization
 * - generateCoordinateHtml: Handles lat/lon, bbox coordinates with proper formatting
 * - generateShapeHtml: Handles dimensions, shapes with size formatting
 * - generateTransformHtml: Handles transformation matrices with technical display
 * - generateProcessingHtml: Handles processing information with version display
 * - generateBooleanHtml: Handles true/false values with Yes/No formatting
 * - generatePercentageHtml: Handles percentages with proper unit display
 *
 * HTML OUTPUT FORMAT:
 * - Grid fields: Structured display with system identification
 * - Coordinate fields: Formatted lat/lon with degree symbols
 * - Shape fields: Dimension display with proper units
 * - Boolean fields: Human-readable Yes/No
 * - Percentage fields: Formatted percentages with % symbol
 * - Standard fields: Basic text formatting with units
 */
function generateFieldHtml(fieldType, components, field, item) {
  const spec = getFieldSpec(field, item)

  switch (fieldType) {
    case 'grid':
      return generateGridHtml(components, field, spec)
    case 'coordinate':
      return generateCoordinateHtml(components, spec)
    case 'shape':
      return generateShapeHtml(components, spec)
    case 'transform':
      return generateTransformHtml(components, spec)
    case 'processing':
      return generateProcessingHtml(components, spec)
    case 'boolean':
      return generateBooleanHtml(components, spec)
    case 'percentage':
      return generatePercentageHtml(components, spec)
    default:
      return formatStacField(field, components[0]?.value, item)
  }
}

/**
 * Generate grid text dynamically
 */
function generateGridHtml(components, currentField, spec) {
  if (components.length === 0) return ''
  const currentLower = (currentField || '').toLowerCase()

  // If the current field is a specific sub-field (path/row/type/utm/lat band/grid square/tile),
  // render ONLY that sub-value to avoid duplicate composite rows across related fields.
  const isSpecificGridSubfield = [
    'wrs_path',
    'wrs_row',
    'wrs_type',
    'utm_zone',
    'latitude_band',
    'grid_square',
    'tile',
    'zone',
    'grid:code'
  ].some((k) => currentLower.includes(k))

  if (isSpecificGridSubfield) {
    // Prefer exact source match, else best-effort include match
    let comp = components.find(
      (c) => (c.source || '').toLowerCase() === currentLower
    )
    if (!comp) {
      comp = components.find(
        (c) =>
          c.label &&
          currentLower.includes(c.label.replace(/\s+/g, '_').toLowerCase())
      )
    }
    if (comp) {
      // Minimal formatting: special case for wrs_type to show WRS-<type>
      if (currentLower.includes('wrs_type')) {
        return `WRS-${String(comp.value).toUpperCase()}`
      }
      if (currentLower === 'grid:code') {
        return String(comp.value)
      }
      return String(comp.value)
    }
  }

  // Otherwise, render a concise composite once (for fields like grid:code or general grid summaries)
  const systemName = sanitizeFieldValue(components[0]?.system || 'GRID', false)
  const seen = new Set()
  const parts = components
    .filter((c) => {
      const key = sanitizeFieldValue(c.label, false).toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .map((c) => {
      // SECURITY: Sanitize all text content
      const sanitizedLabel = sanitizeFieldValue(c.label, false)
      const sanitizedValue = sanitizeFieldValue(c.value, false)
      const text = String(sanitizedValue)
      const truncated = text.length > 64 ? `${text.slice(0, 61)}...` : text
      return `${sanitizedLabel}: ${truncated}`
    })
  return `${systemName}:<br/>${parts.join('<br/>')}`
}

/**
 * Generate coordinate text dynamically
 */
function generateCoordinateHtml(components, spec) {
  if (components.length === 0) return ''
  const c = components[0]
  if (c.type === 'centroid') {
    // SECURITY: Ensure numeric values are properly formatted
    const lat =
      typeof c.lat === 'number'
        ? c.lat.toFixed(6)
        : sanitizeFieldValue(c.lat, false)
    const lon =
      typeof c.lon === 'number'
        ? c.lon.toFixed(6)
        : sanitizeFieldValue(c.lon, false)
    return `Lat: ${lat}°, Lon: ${lon}°`
  }
  if (c.type === 'bbox') {
    // SECURITY: Ensure numeric values are properly formatted
    const minLon =
      typeof c.minLon === 'number'
        ? c.minLon.toFixed(6)
        : sanitizeFieldValue(c.minLon, false)
    const minLat =
      typeof c.minLat === 'number'
        ? c.minLat.toFixed(6)
        : sanitizeFieldValue(c.minLat, false)
    const maxLon =
      typeof c.maxLon === 'number'
        ? c.maxLon.toFixed(6)
        : sanitizeFieldValue(c.maxLon, false)
    const maxLat =
      typeof c.maxLat === 'number'
        ? c.maxLat.toFixed(6)
        : sanitizeFieldValue(c.maxLat, false)
    return `BBox: [${minLon}, ${minLat}] – [${maxLon}, ${maxLat}]`
  }
  return sanitizeFieldValue(c.value ?? '', false)
}

/**
 * Generate shape text dynamically
 */
function generateShapeHtml(components, spec) {
  if (components.length === 0) return ''
  const c = components[0]
  if (c.type === 'shape') {
    // SECURITY: Ensure numeric values are properly formatted and use safe multiplication symbol
    const width =
      typeof c.width === 'number'
        ? c.width.toLocaleString()
        : sanitizeFieldValue(c.width, false)
    const height =
      typeof c.height === 'number'
        ? c.height.toLocaleString()
        : sanitizeFieldValue(c.height, false)
    return `Shape: ${width} × ${height} px`
  }
  return sanitizeFieldValue(c.value ?? '', false)
}

/**
 * Generate transform text dynamically
 */
function generateTransformHtml(components, spec) {
  if (components.length === 0) return ''
  const c = components[0]
  if (c.type === 'transform') {
    return `Pixel Size: ${c.pixelSizeX} × ${Math.abs(c.pixelSizeY)} m; Origin: (${c.originX.toLocaleString()}, ${c.originY.toLocaleString()})`
  }
  return String(c.value ?? '')
}

/**
 * Generate processing text dynamically
 */
function generateProcessingHtml(components, spec) {
  if (components.length === 0) return ''
  const parts = components
    .filter((c) => c.type === 'software')
    .map((c) => `${c.name} (${c.version})`)
  return parts.join(', ')
}

/**
 * Generate boolean HTML
 */
function generateBooleanHtml(components, spec) {
  if (components.length === 0) return ''

  const value = components[0].value
  return value ? 'Yes' : 'No'
}

/**
 * Generate percentage HTML
 */
function generatePercentageHtml(components, spec) {
  if (components.length === 0) return ''

  return `${components[0].value}%`
}

/**
 * HELPER FUNCTIONS
 */

/**
 * Generate dynamic labels from field names
 */
function generateDynamicLabel(fieldName) {
  // Remove extension prefix if present
  const cleanName = fieldName.includes(':')
    ? fieldName.split(':')[1]
    : fieldName

  // Convert snake_case or kebab-case to Title Case
  return cleanName
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase())
}

/**
 * Infer grid system from field name and value
 */
function inferGridSystem(fieldName, value) {
  const fieldLower = fieldName.toLowerCase()
  const valueStr = String(value)

  if (fieldLower.includes('mgrs') || valueStr.includes('MGRS')) return 'MGRS'
  if (fieldLower.includes('wrs') || valueStr.includes('WRS')) return 'WRS-2'
  if (fieldLower.includes('utm') || valueStr.includes('UTM')) return 'UTM'
  if (fieldLower.includes('grid') || valueStr.includes('Grid')) return 'GRID'

  return 'GRID'
}

/**
 * Parse grid value string for components
 */
function parseGridValue(value) {
  // This is a fallback - in practice, we prefer STAC properties
  if (value.includes('MGRS')) {
    return [
      {
        label: 'Grid Code',
        value,
        system: 'MGRS',
        source: 'value'
      }
    ]
  }

  if (value.includes('WRS')) {
    return [
      {
        label: 'Grid Code',
        value,
        system: 'WRS-2',
        source: 'value'
      }
    ]
  }

  return null
}

/**
 * Standard stac-fields formatting fallback
 */
function formatStacField(field, value, item) {
  try {
    const formatted = StacFields.format(value, field, item)
    const result = typeof formatted === 'string' ? formatted : String(value)
    // SECURITY: Sanitize the final output
    return sanitizeFieldValue(result, true) // Allow safe HTML for formatting
  } catch (error) {
    // SECURITY: Sanitize fallback output
    return sanitizeFieldValue(String(value), true)
  }
}

/**
 * EXPORT ALL NECESSARY FUNCTIONS FOR BACKWARD COMPATIBILITY
 */

export { extractFieldComponents }

export function getFieldLabel(field, item = null) {
  try {
    return StacFields.label(field, item)
  } catch (error) {
    return field.replace(/[-_:]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  }
}

export function getFieldUnit(field, item = null) {
  try {
    const spec = StacFields.Registry.getSpecification(field)
    return spec?.unit || null
  } catch (error) {
    return null
  }
}

export function renderFieldValue(field, value, item) {
  const formattedValue = formatStacFieldEnhanced(field, value, item)
  const hasHtml = /<[^>]*>/.test(formattedValue)
  const cleanValue = hasHtml
    ? formattedValue.replace(/&nbsp;/g, ' ')
    : formattedValue

  return {
    formattedValue: cleanValue,
    hasHtml
  }
}
