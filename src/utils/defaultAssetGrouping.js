/**
 * Default Asset Grouping Logic
 * Handles default grouping of STAC assets by type when no config is provided
 */

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
function isThumbnail(key, asset) {
  const lowerKey = key.toLowerCase()
  const lowerTitle = (asset.title || '').toLowerCase()

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
 * Determine if an asset is metadata
 * @param {string} key - Asset key
 * @param {Object} asset - Asset object
 * @returns {boolean} True if asset is metadata
 */
function isMetadata(key, asset) {
  const lowerKey = key.toLowerCase()
  const lowerTitle = (asset.title || '').toLowerCase()
  const fileType = getFileType(asset.type || asset.href)

  return (
    lowerKey.includes('metadata') ||
    lowerKey.includes('meta') ||
    lowerKey.includes('info') ||
    lowerTitle.includes('metadata') ||
    lowerTitle.includes('meta') ||
    lowerTitle.includes('info') ||
    fileType === 'XML' ||
    fileType === 'JSON'
  )
}

/**
 * Determine if an asset is a COG (Cloud Optimized GeoTIFF)
 * @param {string} key - Asset key
 * @param {Object} asset - Asset object
 * @returns {boolean} True if asset is a COG
 */
function isCOG(key, asset) {
  const fileType = getFileType(asset.type || asset.href)

  // All GeoTIFFs are considered COGs by default
  return fileType === 'GeoTIFF'
}

/**
 * Get asset group name based on asset characteristics
 * @param {string} key - Asset key
 * @param {Object} asset - Asset object
 * @returns {string} Group name
 */
function getAssetGroupName(key, asset) {
  if (isThumbnail(key, asset)) {
    return 'Thumbnails'
  }

  if (isCOG(key, asset)) {
    return 'COGs'
  }

  if (isMetadata(key, asset)) {
    return 'Metadata'
  }

  const fileType = getFileType(asset.type || asset.href)
  return `${fileType} Files`
}

/**
 * Get group display order
 * @param {string} groupName - The group name
 * @returns {number} Order number (lower = higher priority)
 */
function getGroupOrder(groupName) {
  const orderMap = {
    COGs: 1,
    'GeoTIFF Files': 2,
    'JPEG Files': 3,
    'PNG Files': 4,
    'JPEG2000 Files': 5,
    'NetCDF Files': 6,
    'HDF Files': 7,
    'Zarr Files': 8,
    Metadata: 9,
    Thumbnails: 10,
    'Data Files': 11
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
