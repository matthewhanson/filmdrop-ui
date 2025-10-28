import {
  DEFAULT_APP_NAME,
  DEFAULT_BASEMAP,
  DEFAULT_THEME_SWITCHING_ENABLED,
  DEFAULT_EXPORT_ENABLED,
  DEFAULT_SHOW_ITEM_AUTO_ZOOM,
  DEFAULT_SEARCH_BY_GEOM_ENABLED,
  DEFAULT_API_MAX_ITEMS,
  DEFAULT_MOSAIC_MAX_ITEMS,
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  DEFAULT_MAP_ZOOM_MAX,
  DEFAULT_COLORMAP
} from '../components/defaults'
import { store } from '../redux/store'
import { DoesFaviconExistService } from '../services/get-config-service'
import { setappName, setreferenceLayers } from '../redux/slices/mainSlice'
import { showApplicationAlert } from './alertHelper'

function loadAppTitle() {
  if (!store.getState().mainSlice.appConfig.APP_NAME) {
    document.title = DEFAULT_APP_NAME
    store.dispatch(setappName(DEFAULT_APP_NAME))
    return
  }
  document.title = store.getState().mainSlice.appConfig.APP_NAME
  store.dispatch(setappName(store.getState().mainSlice.appConfig.APP_NAME))
}

async function loadAppFavicon() {
  if (!store.getState().mainSlice.appConfig.APP_FAVICON) {
    return
  }
  const doesFaviconFileExist = await DoesFaviconExistService()
  if (!doesFaviconFileExist) {
    return
  }
  if (
    store
      .getState()
      .mainSlice.appConfig.APP_FAVICON.toLowerCase()
      .endsWith('.png') ||
    store
      .getState()
      .mainSlice.appConfig.APP_FAVICON.toLowerCase()
      .endsWith('.ico')
  ) {
    const faviconFromConfig =
      '/config/' +
      store.getState().mainSlice.appConfig.APP_FAVICON +
      `?_cb=${Date.now()}`
    const newFaviconLink = document.querySelector("link[rel~='icon']")
    newFaviconLink.href = faviconFromConfig
  }
}

async function parseLayerListConfig(config) {
  try {
    if (
      !store.getState().mainSlice.appConfig ||
      !store.getState().mainSlice.appConfig.LAYER_LIST_SERVICES
    ) {
      throw new Error(
        'Invalid configuration format: LAYER_LIST_SERVICES is missing.'
      )
    }
    return store
      .getState()
      .mainSlice.appConfig.LAYER_LIST_SERVICES.flatMap((service) => {
        if (!service.layers || !Array.isArray(service.layers)) {
          throw new Error(
            `Invalid configuration format for service '${service.name}': 'layers' is missing or not an array.`
          )
        }

        return service.layers
          .map((layer) => {
            if (!layer.name) {
              throw new Error(
                `Invalid configuration format for layer in service '${service.name}': 'name' is missing.`
              )
            }

            const validCRS = ['EPSG:4326', 'EPSG:3857']
            const shouldAddLayer = !layer.crs || validCRS.includes(layer.crs)

            if (shouldAddLayer) {
              return {
                combinedLayerName: `${service.name.replace(
                  / /g,
                  '_'
                )}_${layer.name.replace(/ /g, '_')}`,
                layerName: layer.name,
                layerAlias: layer.alias || layer.name,
                visibility: layer.default_visibility || false,
                crs: layer.crs || 'EPSG:3857',
                url: service.url,
                type: service.type
              }
            }

            console.error(
              'Error adding layer: ' +
                `${service.name.replace(/ /g, '_')}_${layer.name.replace(
                  / /g,
                  '_'
                )}` +
                ': unsupported crs'
            )
            return null // Skip adding the layer if error
          })
          .filter((layer) => layer !== null) // Filter out null layers
      })
  } catch (error) {
    console.error('Error loading reference layers', error.message)
    showApplicationAlert('warning', 'Error loading reference layers', 5000)
    return []
  }
}

async function loadReferenceLayers() {
  if (
    !store.getState().mainSlice.appConfig.LAYER_LIST_SERVICES ||
    store.getState().mainSlice.appConfig.LAYER_LIST_SERVICES.length === 0
  ) {
    return
  }
  const LayerListFromConfig = await parseLayerListConfig()
  if (LayerListFromConfig.length === 0) {
    return
  }

  store.dispatch(setreferenceLayers(LayerListFromConfig))
}

/**
 * Normalizes config to support both old (separate params) and new (COLLECTIONS_CONFIG) formats
 * @param {Object} config - The application config object
 * @returns {Object} - Normalized config with COLLECTIONS_CONFIG structure
 */
export function normalizeCollectionsConfig(config) {
  if (!config) return config

  // If COLLECTIONS_CONFIG already exists and is not empty, prioritize it
  if (
    config.COLLECTIONS_CONFIG &&
    Object.keys(config.COLLECTIONS_CONFIG).length > 0
  ) {
    // Still check for legacy params and warn if both exist
    const legacyParams = [
      'SCENE_TILER_PARAMS',
      'MOSAIC_TILER_PARAMS',
      'SEARCH_MIN_ZOOM_LEVELS',
      'POPUP_DISPLAY_FIELDS',
      'TILE_LAYER_PARAMS',
      'ENHANCED_DISPLAY_CONFIG'
    ]
    const hasLegacyParams = legacyParams.some((param) => config[param])
    if (hasLegacyParams) {
      console.warn(
        'Both COLLECTIONS_CONFIG and legacy collection parameters detected. ' +
          'COLLECTIONS_CONFIG takes precedence. Consider removing deprecated parameters: ' +
          legacyParams.join(', ')
      )
    }
    return config
  }

  // Build COLLECTIONS_CONFIG from legacy parameters
  const collectionsConfig = {}

  // Get all collection IDs from various sources
  const collectionIds = new Set()

  // Add collections from COLLECTIONS parameter
  // Handle both legacy array format and new object format
  if (config.COLLECTIONS) {
    if (Array.isArray(config.COLLECTIONS)) {
      // Legacy format: COLLECTIONS is an array of IDs
      config.COLLECTIONS.forEach((id) => collectionIds.add(id))
    } else if (
      typeof config.COLLECTIONS === 'object' &&
      config.COLLECTIONS.include &&
      Array.isArray(config.COLLECTIONS.include)
    ) {
      // New format: COLLECTIONS.include is an array of IDs
      config.COLLECTIONS.include.forEach((id) => collectionIds.add(id))
    }
  }

  if (config.SCENE_TILER_PARAMS) {
    Object.keys(config.SCENE_TILER_PARAMS).forEach((id) =>
      collectionIds.add(id)
    )
  }
  if (config.MOSAIC_TILER_PARAMS) {
    Object.keys(config.MOSAIC_TILER_PARAMS).forEach((id) =>
      collectionIds.add(id)
    )
  }
  if (config.SEARCH_MIN_ZOOM_LEVELS) {
    Object.keys(config.SEARCH_MIN_ZOOM_LEVELS).forEach((id) =>
      collectionIds.add(id)
    )
  }
  if (config.POPUP_DISPLAY_FIELDS) {
    Object.keys(config.POPUP_DISPLAY_FIELDS).forEach((id) =>
      collectionIds.add(id)
    )
  }
  if (config.TILE_LAYER_PARAMS) {
    Object.keys(config.TILE_LAYER_PARAMS).forEach((id) => collectionIds.add(id))
  }
  if (config.ENHANCED_DISPLAY_CONFIG) {
    Object.keys(config.ENHANCED_DISPLAY_CONFIG).forEach((id) =>
      collectionIds.add(id)
    )
  }

  // Build consolidated config for each collection
  collectionIds.forEach((collectionId) => {
    collectionsConfig[collectionId] = {}

    if (config.SCENE_TILER_PARAMS?.[collectionId]) {
      collectionsConfig[collectionId].sceneTilerParams =
        config.SCENE_TILER_PARAMS[collectionId]
    }
    if (config.MOSAIC_TILER_PARAMS?.[collectionId]) {
      collectionsConfig[collectionId].mosaicTilerParams =
        config.MOSAIC_TILER_PARAMS[collectionId]
    }
    if (config.SEARCH_MIN_ZOOM_LEVELS?.[collectionId]) {
      // Legacy: convert old searchMinZoomLevels.high to new sceneMinZoom
      const legacyZoomLevels = config.SEARCH_MIN_ZOOM_LEVELS[collectionId]
      collectionsConfig[collectionId].sceneMinZoom =
        legacyZoomLevels?.high || legacyZoomLevels
    }
    if (config.POPUP_DISPLAY_FIELDS?.[collectionId]) {
      collectionsConfig[collectionId].popupDisplayFields =
        config.POPUP_DISPLAY_FIELDS[collectionId]
    }
    if (config.TILE_LAYER_PARAMS?.[collectionId]) {
      collectionsConfig[collectionId].tileLayerParams =
        config.TILE_LAYER_PARAMS[collectionId]
    }
    if (config.ENHANCED_DISPLAY_CONFIG?.[collectionId]) {
      collectionsConfig[collectionId].enhancedDisplayConfig =
        config.ENHANCED_DISPLAY_CONFIG[collectionId]
    }
  })

  // Add COLLECTIONS_CONFIG to the config
  if (Object.keys(collectionsConfig).length > 0) {
    config.COLLECTIONS_CONFIG = collectionsConfig
  }

  // Convert legacy COLLECTIONS array format to new object format
  // This ensures all downstream code works with the normalized object format
  if (config.COLLECTIONS && Array.isArray(config.COLLECTIONS)) {
    console.log(
      'Normalizing legacy COLLECTIONS array to object format with include filter'
    )
    config.COLLECTIONS = {
      include: config.COLLECTIONS
    }
  }

  // Also migrate DEFAULT_COLLECTION to COLLECTIONS.default
  if (
    config.DEFAULT_COLLECTION &&
    typeof config.DEFAULT_COLLECTION === 'string'
  ) {
    if (!config.COLLECTIONS || typeof config.COLLECTIONS !== 'object') {
      config.COLLECTIONS = {}
    }
    if (!config.COLLECTIONS.default) {
      console.log('Migrating DEFAULT_COLLECTION to COLLECTIONS.default')
      config.COLLECTIONS.default = config.DEFAULT_COLLECTION
    }
  }

  return config
}

/**
 * Gets collection-specific config parameter using new or legacy structure
 * @param {string} collectionId - The collection ID
 * @param {string} paramName - Parameter name ('sceneTilerParams', 'mosaicTilerParams', etc.)
 * @param {Object} config - Optional config object for testing (uses store if not provided)
 * @returns {*} - The parameter value or undefined
 */
export function getCollectionConfig(collectionId, paramName, config = null) {
  const appConfig = config || store.getState().mainSlice.appConfig
  if (!appConfig) return undefined

  // Try new structure first
  if (appConfig.COLLECTIONS_CONFIG?.[collectionId]?.[paramName]) {
    return appConfig.COLLECTIONS_CONFIG[collectionId][paramName]
  }

  // Fall back to legacy structure
  const legacyParamMap = {
    sceneTilerParams: 'SCENE_TILER_PARAMS',
    mosaicTilerParams: 'MOSAIC_TILER_PARAMS',
    sceneMinZoom: 'SEARCH_MIN_ZOOM_LEVELS',
    popupDisplayFields: 'POPUP_DISPLAY_FIELDS',
    tileLayerParams: 'TILE_LAYER_PARAMS',
    enhancedDisplayConfig: 'ENHANCED_DISPLAY_CONFIG'
  }

  const legacyParam = legacyParamMap[paramName]
  if (legacyParam && appConfig[legacyParam]?.[collectionId]) {
    const legacyValue = appConfig[legacyParam][collectionId]
    // Special handling for sceneMinZoom: extract 'high' value from legacy object
    if (paramName === 'sceneMinZoom' && typeof legacyValue === 'object') {
      return legacyValue.high || legacyValue
    }
    return legacyValue
  }

  return undefined
}

/**
 * Auto-configures collections from the STAC API
 * @param {string} apiUrl - The STAC API URL
 * @param {Object} config - The configuration object
 * @returns {Promise<Object>} - Config with auto-configured collections
 */
export async function autoConfigureCollections(apiUrl, config) {
  if (!apiUrl) {
    console.warn(
      'STAC_API_URL not provided, skipping collections auto-configuration'
    )
    return config
  }

  try {
    // Import dynamically to avoid circular dependencies
    const { getCollections } = await import('../services/stac-api')

    // Fetch collections from STAC API
    const response = await getCollections(apiUrl)

    if (!response.collections || !Array.isArray(response.collections)) {
      console.warn('No collections found in STAC API response')
      return config
    }

    let collections = response.collections

    // At this point, COLLECTIONS should already be normalized to object format
    // by normalizeCollectionsConfig(), so we can just use it directly
    const collectionsFilter = config.COLLECTIONS || {}

    // Apply include filter (whitelist) - if provided, only use these collections
    if (
      collectionsFilter.include &&
      Array.isArray(collectionsFilter.include) &&
      collectionsFilter.include.length > 0
    ) {
      collections = collections.filter((collection) =>
        collectionsFilter.include.includes(collection.id)
      )
      console.log(
        `Filtered collections to include only: ${collectionsFilter.include.join(', ')}`
      )
    }

    // Apply exclude filter (blacklist) - remove these collections
    if (
      collectionsFilter.exclude &&
      Array.isArray(collectionsFilter.exclude) &&
      collectionsFilter.exclude.length > 0
    ) {
      collections = collections.filter(
        (collection) => !collectionsFilter.exclude.includes(collection.id)
      )
      console.log(
        `Excluded collections: ${collectionsFilter.exclude.join(', ')}`
      )
    }

    if (collections.length === 0) {
      console.warn('No collections available after filtering')
      return config
    }

    // Build array of collection IDs
    const collectionIds = collections.map((c) => c.id).filter(Boolean)

    // Filter COLLECTIONS_CONFIG to only include collections that are being used
    let filteredCollectionsConfig = {}
    if (
      config.COLLECTIONS_CONFIG &&
      typeof config.COLLECTIONS_CONFIG === 'object'
    ) {
      const activeSet = new Set(collectionIds)
      for (const [collectionId, collectionConfig] of Object.entries(
        config.COLLECTIONS_CONFIG
      )) {
        if (activeSet.has(collectionId)) {
          filteredCollectionsConfig[collectionId] = collectionConfig
        } else {
          console.debug(
            `Ignoring COLLECTIONS_CONFIG for '${collectionId}' - collection not in active list`
          )
        }
      }
    }

    console.log(
      `Auto-configured ${collectionIds.length} collections from STAC API:`,
      collectionIds
    )

    return {
      ...config,
      // After auto-config, COLLECTIONS becomes an object with both metadata and IDs
      // This supports both the default selection and collection filtering
      COLLECTIONS: {
        ...collectionsFilter, // Preserve default, include, exclude metadata
        _ids: collectionIds // Array of collection IDs (for backward compat with get-collections-service)
      },
      COLLECTIONS_CONFIG: filteredCollectionsConfig,
      // Store the full collection objects for potential future use
      _STAC_COLLECTIONS: collections
    }
  } catch (error) {
    console.error('Error auto-configuring collections from STAC API:', error)
    // Return original config if auto-configuration fails
    return config
  }
}

/**
 * Auto-configures TiTiler assets for collections based on STAC item_assets metadata
 * @param {Object} config - The configuration object with _STAC_COLLECTIONS
 * @returns {Object} - Config with auto-configured sceneTilerParams
 */
export function autoConfigureAssets(config) {
  // If no collections were fetched, skip asset auto-configuration
  if (!config._STAC_COLLECTIONS || !Array.isArray(config._STAC_COLLECTIONS)) {
    return config
  }

  const collectionsConfig = { ...config.COLLECTIONS_CONFIG } || {}

  // Process each collection
  for (const collection of config._STAC_COLLECTIONS) {
    const collectionId = collection.id

    // Skip if user has already configured sceneTilerParams for this collection
    if (
      collectionsConfig[collectionId]?.sceneTilerParams?.assets &&
      Array.isArray(collectionsConfig[collectionId].sceneTilerParams.assets) &&
      collectionsConfig[collectionId].sceneTilerParams.assets.length > 0
    ) {
      console.debug(
        `Skipping asset auto-configuration for '${collectionId}' - already configured`
      )
      continue
    }

    // Get item_assets from collection
    const itemAssets = collection.item_assets
    if (!itemAssets || typeof itemAssets !== 'object') {
      console.debug(
        `No item_assets found for collection '${collectionId}', skipping asset auto-configuration`
      )
      continue
    }

    const assetKeys = Object.keys(itemAssets)
    if (assetKeys.length === 0) {
      continue
    }

    let selectedAssets = null
    let configSource = null

    // Rule 1: If there is an asset with key "visual", use that
    const visualAssets = assetKeys.filter((key) => key === 'visual')
    if (visualAssets.length > 0) {
      if (visualAssets.length > 1) {
        console.warn(
          `Collection '${collectionId}' has multiple 'visual' assets - using the first one`
        )
      }
      selectedAssets = [visualAssets[0]]
      configSource = "asset 'visual'"
    }

    // Rule 2: If there are assets with keys red, green, and blue, use those
    if (!selectedAssets) {
      const hasRed = assetKeys.includes('red')
      const hasGreen = assetKeys.includes('green')
      const hasBlue = assetKeys.includes('blue')

      if (hasRed && hasGreen && hasBlue) {
        selectedAssets = ['red', 'green', 'blue']
        configSource = 'RGB assets (red, green, blue)'
      }
    }

    // Rule 3: If there is only one asset with role "data", use that
    if (!selectedAssets) {
      const dataAssets = assetKeys.filter((key) => {
        const asset = itemAssets[key]
        return (
          asset.roles &&
          Array.isArray(asset.roles) &&
          asset.roles.includes('data')
        )
      })

      if (dataAssets.length === 1) {
        const assetKey = dataAssets[0]
        const asset = itemAssets[assetKey]

        // Check band count if available in raster:bands
        const rasterBands = asset['raster:bands']
        const bandCount = Array.isArray(rasterBands) ? rasterBands.length : null

        if (bandCount === 2) {
          console.error(
            `Collection '${collectionId}': Asset '${assetKey}' has 2 bands, which is not supported for auto-configuration. Please manually configure sceneTilerParams.`
          )
          continue
        }

        if (bandCount && bandCount > 3) {
          console.warn(
            `Collection '${collectionId}': Asset '${assetKey}' has ${bandCount} bands - using first 3 bands`
          )
          // Use asset with bidx to select first 3 bands
          selectedAssets = [assetKey]
          // We'll need to set asset_bidx in the config
          if (!collectionsConfig[collectionId]) {
            collectionsConfig[collectionId] = {}
          }
          if (!collectionsConfig[collectionId].sceneTilerParams) {
            collectionsConfig[collectionId].sceneTilerParams = {}
          }
          collectionsConfig[collectionId].sceneTilerParams.asset_bidx = [
            `${assetKey}|1,2,3`
          ]
          configSource = `single 'data' asset '${assetKey}' (using first 3 of ${bandCount} bands)`
        } else {
          selectedAssets = [assetKey]
          configSource = `single 'data' asset '${assetKey}'`
        }
      } else if (dataAssets.length > 1) {
        console.debug(
          `Collection '${collectionId}' has multiple assets with role 'data': ${dataAssets.join(', ')}. Auto-configuration skipped - please manually configure sceneTilerParams.`
        )
      }
    }

    // Apply the auto-configured assets
    if (selectedAssets) {
      if (!collectionsConfig[collectionId]) {
        collectionsConfig[collectionId] = {}
      }
      if (!collectionsConfig[collectionId].sceneTilerParams) {
        collectionsConfig[collectionId].sceneTilerParams = {}
      }
      collectionsConfig[collectionId].sceneTilerParams.assets = selectedAssets

      // Initialize tileLayerParams if not present to avoid warnings
      if (!collectionsConfig[collectionId].tileLayerParams) {
        collectionsConfig[collectionId].tileLayerParams = {}
      }

      console.log(
        `Auto-configured assets for collection '${collectionId}': ${selectedAssets.join(', ')} (source: ${configSource})`
      )
    }
  }

  return {
    ...config,
    COLLECTIONS_CONFIG: collectionsConfig
  }
}

/**
 * Applies default values to config for optional parameters
 * @param {Object} config - The configuration object
 * @returns {Object} - Config with defaults applied
 */
export function applyConfigDefaults(config) {
  return {
    ...config,
    // Basemap configuration
    BASEMAP: config.BASEMAP ?? DEFAULT_BASEMAP,
    // UI feature flags
    THEME_SWITCHING_ENABLED:
      config.THEME_SWITCHING_ENABLED ?? DEFAULT_THEME_SWITCHING_ENABLED,
    EXPORT_ENABLED: config.EXPORT_ENABLED ?? DEFAULT_EXPORT_ENABLED,
    SHOW_ITEM_AUTO_ZOOM:
      config.SHOW_ITEM_AUTO_ZOOM ?? DEFAULT_SHOW_ITEM_AUTO_ZOOM,
    SEARCH_BY_GEOM_ENABLED:
      config.SEARCH_BY_GEOM_ENABLED ?? DEFAULT_SEARCH_BY_GEOM_ENABLED,
    // API and search limits
    API_MAX_ITEMS: config.API_MAX_ITEMS ?? DEFAULT_API_MAX_ITEMS,
    MOSAIC_MAX_ITEMS: config.MOSAIC_MAX_ITEMS ?? DEFAULT_MOSAIC_MAX_ITEMS,
    // Map configuration
    MAP_CENTER: config.MAP_CENTER ?? DEFAULT_MAP_CENTER,
    MAP_ZOOM: config.MAP_ZOOM ?? DEFAULT_MAP_ZOOM,
    MAP_ZOOM_MAX: config.MAP_ZOOM_MAX ?? DEFAULT_MAP_ZOOM_MAX,
    CONFIG_COLORMAP: config.CONFIG_COLORMAP ?? DEFAULT_COLORMAP
  }
}

export function InitializeAppFromConfig() {
  loadAppTitle()
  loadAppFavicon()
  loadReferenceLayers()
}

// exports for testing purposes
export { loadAppTitle, loadAppFavicon }
