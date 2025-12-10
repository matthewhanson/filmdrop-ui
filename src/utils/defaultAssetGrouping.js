/**
 * Default Asset Grouping Logic
 * Handles default grouping of STAC assets by type when no config is provided
 */

/**
 * Standard STAC roles used for asset classification
 * @type {Object}
 */
export const STANDARD_ROLES = {
  DATA: 'data',
  METADATA: 'metadata',
  THUMBNAIL: 'thumbnail',
  VISUAL: 'visual'
}

/**
 * File type abbreviations for compact display
 * Maps from getFileType() output to abbreviation
 * @type {Object}
 */
export const FILE_TYPE_ABBREVIATIONS = {
  GeoTIFF: 'COG',
  JPEG: 'JPG',
  JPEG2000: 'JP2',
  PNG: 'PNG',
  NetCDF: 'NC',
  HDF: 'HDF',
  Zarr: 'Zarr',
  XML: 'XML',
  JSON: 'JSON',
  Data: 'BIN'
}

/**
 * Get the primary standard role from an asset
 * @param {Object} asset - STAC asset object
 * @returns {string|null} Standard role or null if none found
 */
export function getStandardRole(asset) {
  if (!asset?.roles || !Array.isArray(asset.roles)) return null
  const roleValues = Object.values(STANDARD_ROLES)
  return asset.roles.find((role) => roleValues.includes(role)) || null
}

/**
 * Get custom (non-standard) roles from an asset
 * @param {Object} asset - STAC asset object
 * @returns {string[]} Array of custom roles
 */
export function getCustomRoles(asset) {
  if (!asset?.roles || !Array.isArray(asset.roles)) return []
  const standardRoleValues = Object.values(STANDARD_ROLES)
  return asset.roles.filter((role) => !standardRoleValues.includes(role))
}

/**
 * Get abbreviated file type for display
 * @param {string} fileType - File type from getFileType()
 * @returns {string} Abbreviated file type
 */
export function getFileTypeAbbreviation(fileType) {
  if (!fileType) return ''
  return (
    FILE_TYPE_ABBREVIATIONS[fileType] || fileType.substring(0, 4).toUpperCase()
  )
}

/**
 * Determine asset group name based on STAC roles with MIME type fallback
 * @param {Object} asset - STAC asset object
 * @returns {string} Group name for display
 */
export function getRoleBasedGroup(asset) {
  // Try role-based grouping first
  const standardRole = getStandardRole(asset)
  if (standardRole) {
    // Capitalize and pluralize for display
    if (standardRole === STANDARD_ROLES.THUMBNAIL) return 'Thumbnails'
    return standardRole.charAt(0).toUpperCase() + standardRole.slice(1)
  }

  // Fallback to MIME type detection for legacy items without roles
  const fileType = getFileType(asset.type || asset.href)
  return fileType === 'Data' ? 'Data' : `${fileType} Files`
}

/**
 * Determine file type from MIME type or URL
 * @param {string} typeOrUrl - MIME type or URL
 * @returns {string} File type category
 */
export function getFileType(typeOrUrl) {
  if (!typeOrUrl) return 'Data'

  const lower = typeOrUrl.toLowerCase()

  // Check MIME type first
  if (lower.includes('image/tiff') || lower.includes('geotiff')) {
    return 'GeoTIFF'
  }
  if (lower.includes('image/jpeg') || lower.includes('image/jpg')) {
    return 'JPEG'
  }
  if (lower.includes('application/xml') || lower.includes('text/xml')) {
    return 'XML'
  }
  if (lower.includes('application/json')) {
    return 'JSON'
  }
  if (lower.includes('image/png')) {
    return 'PNG'
  }
  if (lower.includes('image/jp2') || lower.includes('image/jpeg2000')) {
    return 'JPEG2000'
  }

  // Check file extension
  if (lower.includes('.tif') || lower.includes('.tiff')) {
    return 'GeoTIFF'
  }
  if (lower.includes('.jpg') || lower.includes('.jpeg')) {
    return 'JPEG'
  }
  if (lower.includes('.xml')) {
    return 'XML'
  }
  if (lower.includes('.json')) {
    return 'JSON'
  }
  if (lower.includes('.png')) {
    return 'PNG'
  }
  if (lower.includes('.jp2')) {
    return 'JPEG2000'
  }
  if (lower.includes('.nc') || lower.includes('.netcdf')) {
    return 'NetCDF'
  }
  if (lower.includes('.hdf') || lower.includes('.hdf5')) {
    return 'HDF'
  }
  if (lower.includes('.zarr')) {
    return 'Zarr'
  }

  return 'Data'
}

/**
 * Determine if an asset is a thumbnail/preview
 * @param {string} key - Asset key
 * @param {Object} asset - Asset object
 * @returns {boolean} True if asset is a thumbnail
 */
export function isThumbnail(key, asset) {
  // Check roles first
  if (asset?.roles?.includes(STANDARD_ROLES.THUMBNAIL)) return true

  // Fallback to heuristic detection for legacy items
  const lowerKey = key.toLowerCase()
  const lowerTitle = (asset?.title || '').toLowerCase()

  return (
    lowerKey.includes('thumbnail') ||
    lowerKey.includes('preview') ||
    lowerKey.includes('thumb') ||
    lowerTitle.includes('thumbnail') ||
    lowerTitle.includes('preview') ||
    lowerTitle.includes('thumb')
  )
}

/**
 * Get asset group name based on asset characteristics
 * @param {string} key - Asset key
 * @param {Object} asset - Asset object
 * @returns {string} Group name
 */
function getAssetGroupName(key, asset) {
  return getRoleBasedGroup(asset)
}

/**
 * Get group display order
 * @param {string} groupName - The group name
 * @returns {number} Order number (lower = higher priority)
 */
function getGroupOrder(groupName) {
  const orderMap = {
    Data: 1,
    Visual: 2,
    Metadata: 3,
    Thumbnails: 4,
    'GeoTIFF Files': 5,
    'JPEG Files': 6,
    'JPG Files': 6,
    'PNG Files': 7,
    'JP2 Files': 8,
    'JPEG2000 Files': 8,
    'NetCDF Files': 9,
    'NC Files': 9,
    'HDF Files': 10,
    'Zarr Files': 11,
    'XML Files': 12,
    'JSON Files': 12,
    'Data Files': 100
  }

  return orderMap[groupName] || 100
}

/**
 * Group assets by type
 * @param {Object} assets - STAC assets object
 * @returns {Array} Array of grouped assets
 */
export function groupAssetsByType(assets) {
  if (!assets || Object.keys(assets).length === 0) {
    return []
  }

  const groups = new Map()

  Object.entries(assets).forEach(([key, asset]) => {
    const groupName = getAssetGroupName(key, asset)

    if (!groups.has(groupName)) {
      groups.set(groupName, {
        name: groupName,
        assets: [],
        order: getGroupOrder(groupName)
      })
    }

    groups.get(groupName).assets.push({
      key,
      ...asset
    })
  })

  // Convert to array and sort by group order
  return Array.from(groups.values()).sort((a, b) => a.order - b.order)
}

/**
 * Get asset display label
 * @param {string} key - Asset key
 * @param {Object} asset - Asset object
 * @returns {string} Display label
 */
export function getAssetLabel(key, asset) {
  if (asset.title && asset.title !== key) {
    return asset.title
  }

  // Clean up the key by replacing underscores and dashes with spaces
  const cleaned = key.replace(/[_-]/g, ' ').replace(/\s+/g, ' ').trim()

  // Convert to title case (capitalize first letter of each word)
  return cleaned
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Get file extension from URL
 * @param {string} url - Asset URL
 * @returns {string} File extension
 */
export function getFileExtension(url) {
  if (!url) return ''
  const match = url.match(/\.([^./]+)$/)
  return match ? match[1].toUpperCase() : 'FILE'
}
