/**
 * Utilities for determining which queryable fields should be excluded from rendering.
 * Handles both config-based pattern exclusions and schema-based renderability checks.
 */

/**
 * Check if a queryable field name matches an exclusion pattern.
 * Supports exact matches and prefix patterns (ending with '*').
 *
 * @param {string} fieldName - The queryable field name to check
 * @param {string} pattern - The pattern to match against (can use '*' suffix for prefix matching)
 * @returns {boolean} - True if the field matches the pattern
 *
 * @example
 * matchesExclusionPattern('proj:epsg', 'proj:*') // true
 * matchesExclusionPattern('proj:epsg', 'proj:epsg') // true
 * matchesExclusionPattern('datetime', 'datetime') // true
 * matchesExclusionPattern('eo:cloud_cover', 'proj:*') // false
 */
function matchesExclusionPattern(fieldName, pattern) {
  if (!fieldName || !pattern) {
    return false
  }

  // Check for wildcard pattern (ends with *)
  if (pattern.endsWith('*')) {
    const prefix = pattern.slice(0, -1) // Remove the *
    return fieldName.startsWith(prefix)
  }

  // Exact match
  return fieldName === pattern
}

/**
 * Check if a queryable field name matches any exclusion patterns from config.
 *
 * @param {string} fieldName - The queryable field name to check
 * @param {string[]} exclusionPatterns - Array of patterns from EXCLUDED_QUERYABLES config
 * @returns {boolean} - True if the field matches any exclusion pattern
 *
 * @example
 * matchesAnyExclusionPattern('proj:epsg', ['datetime', 'proj:*']) // true
 * matchesAnyExclusionPattern('eo:cloud_cover', ['datetime', 'proj:*']) // false
 */
function matchesAnyExclusionPattern(fieldName, exclusionPatterns) {
  if (!fieldName || !Array.isArray(exclusionPatterns)) {
    return false
  }

  return exclusionPatterns.some((pattern) =>
    matchesExclusionPattern(fieldName, pattern)
  )
}

/**
 * Determine the render order for a queryable schema based on its component type.
 * Returns a numeric order for supported schemas, or null for unsupported schemas.
 *
 * Order: RangeSliderWithInputs (0), MultiSelect (1), Dropdown (2), TextField (3), Checkbox (4)
 *
 * @param {Object} schema - The JSON Schema for the queryable field
 * @returns {number | null} - Render order (0-4) for supported types, null for unsupported
 *
 * @example
 * getQueryableRenderOrder({ type: 'number', minimum: 0, maximum: 100 }) // 0 (RangeSlider)
 * getQueryableRenderOrder({ type: 'boolean' }) // 4 (Checkbox)
 * getQueryableRenderOrder({ type: 'object' }) // null (unsupported)
 */
export function getQueryableRenderOrder(schema) {
  if (!schema || typeof schema !== 'object') {
    return null
  }

  // Exclude complex schema patterns (anyOf, oneOf, allOf)
  if (schema.anyOf || schema.oneOf || schema.allOf) {
    return null
  }

  // Exclude union types (multiple types like ["string", "null"])
  if (Array.isArray(schema.type)) {
    return null
  }

  // RangeSliderWithInputs: numeric with both min and max
  if (
    (schema.type === 'number' || schema.type === 'integer') &&
    schema.minimum !== undefined &&
    schema.maximum !== undefined
  ) {
    return 0
  }

  // MultiSelect: array of string enums
  if (
    schema.type === 'array' &&
    schema.items?.enum &&
    schema.items?.type === 'string'
  ) {
    return 1
  }

  // Dropdown: string enum
  if (schema.type === 'string' && schema.enum) {
    return 2
  }

  // TextField: numeric without both min/max
  if (schema.type === 'number' || schema.type === 'integer') {
    return 3
  }

  // Checkbox: boolean
  if (schema.type === 'boolean') {
    return 4
  }

  // All other types are unsupported (objects, arrays of non-enums, etc.)
  return null
}

/**
 * Determine if a queryable field should be rendered.
 * Checks both config-based exclusion patterns and schema complexity.
 *
 * @param {string} fieldName - The queryable field name
 * @param {Object} schema - The JSON Schema for the queryable field
 * @param {string[]} exclusionPatterns - Array of patterns from EXCLUDED_QUERYABLES config
 * @returns {boolean} - True if the queryable should be rendered, false if excluded
 *
 * @example
 * isQueryableRenderable('eo:cloud_cover', { type: 'number' }, []) // true
 * isQueryableRenderable('proj:epsg', { type: 'string' }, ['proj:*']) // false
 * isQueryableRenderable('metadata', { type: 'object', properties: {} }, []) // false
 */
export function isQueryableRenderable(fieldName, schema, exclusionPatterns) {
  // Check config-based exclusion patterns
  if (matchesAnyExclusionPattern(fieldName, exclusionPatterns)) {
    return false
  }

  // Check if schema is supported (getQueryableRenderOrder returns null for unsupported)
  return getQueryableRenderOrder(schema) !== null
}
