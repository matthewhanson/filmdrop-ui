/**
 * Utility functions for serializing/deserializing queryable filters to/from URL search params.
 * Used by the URL state sync system (useUrlStateSync hook) and newSearch().
 */

/**
 * Serialize queryable filters to a plain object for use with TanStack Router's
 * search option. Returns key-value pairs suitable for spreading into search params.
 * @param {Object} filters - The queryableFilters object from Redux
 * @returns {Object} Plain object with string values
 */
export function serializeQueryableFiltersForUrl(filters) {
  const result = {}

  Object.entries(filters).forEach(([fieldName, value]) => {
    if (value === null || value === undefined) {
      return
    }

    // Handle range values (objects with min/max from RangeSlider)
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      'min' in value &&
      'max' in value
    ) {
      result[`${fieldName}_min`] = String(value.min)
      result[`${fieldName}_max`] = String(value.max)
      return
    }

    // Handle array values (multi-select)
    if (Array.isArray(value)) {
      if (value.length > 0) {
        result[fieldName] = value.join(',')
      }
      return
    }

    // Handle boolean values
    if (typeof value === 'boolean') {
      result[fieldName] = String(value)
      return
    }

    // Handle number and string values
    result[fieldName] = String(value)
  })

  return result
}

/**
 * Deserialize queryable filter params to Redux filter object.
 * @param {Object} params - Plain object of filter key-value pairs
 * @param {Object} queryables - The queryables schema to determine types
 * @returns {Object} Queryable filters object
 */
export function deserializeQueryableFiltersFromURL(params, queryables) {
  const filters = {}

  if (!queryables || !queryables.properties) {
    return filters
  }

  const processedRangeFields = new Set()

  for (const [key, value] of Object.entries(params)) {
    // Check if this is a range field (ends with _min or _max)
    const minMatch = key.match(/^(.+)_min$/)
    const maxMatch = key.match(/^(.+)_max$/)

    if (minMatch) {
      const fieldName = minMatch[1]
      if (processedRangeFields.has(fieldName)) continue
      processedRangeFields.add(fieldName)

      const minValue = params[`${fieldName}_min`]
      const maxValue = params[`${fieldName}_max`]

      if (minValue && maxValue) {
        const schema = queryables.properties[fieldName]
        if (schema && (schema.type === 'number' || schema.type === 'integer')) {
          filters[fieldName] = {
            min:
              schema.type === 'integer'
                ? parseInt(minValue)
                : parseFloat(minValue),
            max:
              schema.type === 'integer'
                ? parseInt(maxValue)
                : parseFloat(maxValue)
          }
        }
      }
      continue
    }

    if (maxMatch) {
      // Already processed with _min
      continue
    }

    // Not a range field, process as regular field
    const schema = queryables.properties[key]
    if (!schema) continue

    // Enum fields are rendered as multi-selects, so always deserialize as arrays
    if (schema.enum) {
      // Parse array based on the schema type
      if (schema.type === 'number') {
        filters[key] = value.split(',').filter(Boolean).map(parseFloat)
      } else if (schema.type === 'integer') {
        filters[key] = value
          .split(',')
          .filter(Boolean)
          .map((v) => parseInt(v, 10))
      } else {
        filters[key] = value.split(',').filter(Boolean)
      }
      continue
    }

    // Handle based on schema type for single values
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
  }

  return filters
}
