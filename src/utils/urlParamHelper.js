/**
 * Utility functions for serializing/deserializing queryable filters to/from URL search params
 */

/**
 * Serialize queryable filters to URL search params
 * @param {Object} filters - The queryableFilters object from Redux
 * @returns {URLSearchParams} URLSearchParams object
 */
export function serializeQueryableFiltersToURL(filters) {
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([fieldName, value]) => {
    if (value === null || value === undefined) {
      return
    }

    // Handle range values (objects with min/max from RangeSlider)
    if (value && typeof value === 'object' && !Array.isArray(value) && 'min' in value && 'max' in value) {
      params.set(`${fieldName}_min`, String(value.min))
      params.set(`${fieldName}_max`, String(value.max))
      return
    }

    // Handle array values (multi-select)
    if (Array.isArray(value)) {
      if (value.length > 0) {
        params.set(fieldName, value.join(','))
      }
      return
    }

    // Handle boolean values
    if (typeof value === 'boolean') {
      params.set(fieldName, String(value))
      return
    }

    // Handle number and string values
    params.set(fieldName, String(value))
  })

  return params
}

/**
 * Deserialize URL search params to queryable filters object
 * @param {URLSearchParams} params - URL search params
 * @param {Object} queryables - The queryables schema to determine types
 * @returns {Object} Queryable filters object
 */
export function deserializeQueryableFiltersFromURL(params, queryables) {
  const filters = {}

  if (!queryables || !queryables.properties) {
    return filters
  }

  const processedRangeFields = new Set()

  params.forEach((value, key) => {
    // Check if this is a range field (ends with _min or _max)
    const minMatch = key.match(/^(.+)_min$/)
    const maxMatch = key.match(/^(.+)_max$/)

    if (minMatch) {
      const fieldName = minMatch[1]
      if (processedRangeFields.has(fieldName)) return
      processedRangeFields.add(fieldName)

      const minValue = params.get(`${fieldName}_min`)
      const maxValue = params.get(`${fieldName}_max`)

      if (minValue && maxValue) {
        const schema = queryables.properties[fieldName]
        if (schema && (schema.type === 'number' || schema.type === 'integer')) {
          filters[fieldName] = {
            min: schema.type === 'integer' ? parseInt(minValue) : parseFloat(minValue),
            max: schema.type === 'integer' ? parseInt(maxValue) : parseFloat(maxValue)
          }
        }
      }
      return
    }

    if (maxMatch) {
      // Already processed with _min
      return
    }

    // Not a range field, process as regular field
    const schema = queryables.properties[key]
    if (!schema) return

    // Handle based on schema type
    if (schema.type === 'number') {
      filters[key] = parseFloat(value)
    } else if (schema.type === 'integer') {
      filters[key] = parseInt(value)
    } else if (schema.type === 'array') {
      // Multi-select values are comma-separated
      filters[key] = value.split(',').filter(Boolean)
    } else {
      // String value
      filters[key] = value
    }
  })

  return filters
}

/**
 * Merge queryable filters into current URL without navigation
 * @param {Object} filters - The queryableFilters object
 */
export function updateURLWithFilters(filters) {
  const url = new URL(window.location)
  const params = serializeQueryableFiltersToURL(filters)

  // Remove existing filter params
  const currentParams = new URLSearchParams(url.search)
  const nonFilterParams = new URLSearchParams()
  
  currentParams.forEach((value, key) => {
    // Keep non-filter params (like collection, datetime, etc.)
    if (!key.includes(':') && !key.endsWith('_min') && !key.endsWith('_max')) {
      nonFilterParams.set(key, value)
    }
  })

  // Merge with new filter params
  params.forEach((value, key) => {
    nonFilterParams.set(key, value)
  })

  url.search = nonFilterParams.toString()
  window.history.replaceState({}, '', url)
}

/**
 * Load queryable filters from URL params on page load
 * @param {Object} queryables - The queryables schema
 * @returns {Object} Queryable filters object
 */
export function loadFiltersFromURL(queryables) {
  const params = new URLSearchParams(window.location.search)
  return deserializeQueryableFiltersFromURL(params, queryables)
}
