/**
 * DEFAULT FIELD GROUPING MODULE
 * Handles default grouping of STAC fields by extension when no config is provided
 */

import StacFields from '@radiantearth/stac-fields'

/**
 * Get all extension prefixes from stac-fields registry
 * @returns {Array} Array of extension prefixes found in stac-fields
 */
function getExtensionPrefixes() {
  try {
    const allFields = Object.keys(StacFields.Registry.fields.metadata)
    const extensionFields = allFields.filter((field) => field.includes(':'))
    const prefixes = [
      ...new Set(extensionFields.map((field) => field.split(':')[0]))
    ]
    return prefixes
  } catch (error) {
    // If stac-fields fails, return empty array
    console.warn(
      'Failed to get extension prefixes from stac-fields:',
      error.message
    )
    return []
  }
}

/**
 * Generate intelligent extension name from prefix
 * @param {string} prefix - The extension prefix (e.g., 'proj', 'eo')
 * @returns {string} Human-readable extension name
 */
function generateExtensionName(prefix) {
  // Generate intelligent name from prefix
  return prefix
    .replace(/_/g, ' ') // Replace underscores with spaces
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space before capital letters
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Get core STAC fields from stac-fields registry
 * @returns {Array} Array of core field names in registry order
 */
function getCoreFields() {
  try {
    return Object.keys(StacFields.Registry.fields.metadata).filter(
      (field) => !field.includes(':')
    )
  } catch (error) {
    // If stac-fields fails, return empty array
    console.warn('Failed to get core fields from stac-fields:', error.message)
    return []
  }
}

/**
 * Get extension name from field name
 * @param {string} fieldName - The field name (e.g., 'proj:epsg', 'datetime')
 * @returns {string} Extension name or 'Core Fields'
 */
function getExtensionName(fieldName) {
  if (!fieldName.includes(':')) {
    return 'Core Fields'
  }

  const prefix = fieldName.split(':')[0]
  return generateExtensionName(prefix)
}

/**
 * Check if a field is a custom property
 * @param {string} fieldName - The field name
 * @returns {boolean} True if custom property
 */
function isCustomProperty(fieldName) {
  // Check if field is not in stac-fields registry
  try {
    const spec = StacFields.Registry.getSpecification(fieldName)
    if (spec && Object.keys(spec).length > 0) {
      return false
    }
  } catch (error) {
    // Field not found in registry
  }

  // Check if field has unknown extension prefix
  if (fieldName.includes(':')) {
    const prefix = fieldName.split(':')[0]
    const knownPrefixes = getExtensionPrefixes()
    if (!knownPrefixes.includes(prefix)) {
      return true
    }
  }

  return false
}

/**
 * Group STAC properties by extension with default ordering
 * @param {Object} properties - STAC item properties
 * @returns {Array} Array of group objects with name, fields, and order
 */
export function groupPropertiesByExtension(properties) {
  if (!properties || typeof properties !== 'object') {
    return []
  }

  const groups = new Map()

  // Process each property
  Object.entries(properties).forEach(([fieldName, value]) => {
    // Skip structural fields
    if (['geometry', 'links', 'assets'].includes(fieldName)) {
      return
    }

    // Skip very large objects
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const size = Object.keys(value).length
      if (size > 20) {
        return
      }
    }

    const extensionName = getExtensionName(fieldName)
    const isCustom = isCustomProperty(fieldName)

    if (!groups.has(extensionName)) {
      groups.set(extensionName, {
        name: extensionName,
        fields: [],
        order: getGroupOrder(extensionName),
        isCustom
      })
    }

    groups.get(extensionName).fields.push({
      name: fieldName,
      value,
      order: getFieldOrder(fieldName, extensionName)
    })
  })

  // Sort fields within each group
  groups.forEach((group) => {
    group.fields.sort((a, b) => a.order - b.order)
  })

  // Convert to array and sort by group order
  return Array.from(groups.values()).sort((a, b) => a.order - b.order)
}

/**
 * Get group display order
 * @param {string} groupName - The group name
 * @returns {number} Order number (lower = higher priority)
 */
function getGroupOrder(groupName) {
  // Core fields always come first
  if (groupName === 'Core Fields') {
    return 1
  }

  return 100
}

/**
 * Get field display order within a group
 * @param {string} fieldName - The field name
 * @param {string} groupName - The group name
 * @returns {number} Order number (lower = higher priority)
 */
function getFieldOrder(fieldName, groupName) {
  // Core fields have specific ordering from stac-fields registry
  if (groupName === 'Core Fields') {
    const coreFields = getCoreFields()
    const index = coreFields.indexOf(fieldName)
    return index !== -1 ? index : 1000
  }

  // For extension fields, use alphabetical ordering
  return 1000
}

/**
 * Get field label with fallback hierarchy
 * @param {string} fieldName - The field name
 * @returns {string} Display label
 */
export function getFieldLabel(fieldName) {
  try {
    const spec = StacFields.Registry.getSpecification(fieldName)
    if (spec && spec.label) {
      return spec.label
    }
  } catch (error) {
    // Field not found in registry
  }

  // Fallback: generate label from field name
  return fieldName
    .replace(
      /^(eo|sar|proj|s2|landsat|sat|view|storage|processing|raster|file|nodata|grid|label|forecast|goes|noaa_mrms_qpe|openeo|anon|classification|cube):/,
      ''
    )
    .replace(/[-_:]/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .trim()
}

/**
 * Check if a field is supported by stac-fields
 * @param {string} fieldName - The field name
 * @returns {boolean} True if supported
 */
export function isFieldSupported(fieldName) {
  try {
    const spec = StacFields.Registry.getSpecification(fieldName)
    return !!(spec && Object.keys(spec).length > 0)
  } catch (error) {
    return false
  }
}
