import {
  DEFAULT_APP_NAME,
  DEFAULT_BASEMAP,
  DEFAULT_THEME_SWITCHING_ENABLED,
  DEFAULT_EXPORT_ENABLED,
  DEFAULT_SHOW_ITEM_AUTO_ZOOM,
  DEFAULT_SEARCH_BY_GEOM_ENABLED,
  DEFAULT_STAC_LINK_ENABLED,
  DEFAULT_STAC_LINKS_SECTION_ENABLED,
  DEFAULT_RIGHT_SIDEBAR_ENABLED,
  DEFAULT_API_MAX_ITEMS,
  DEFAULT_MOSAIC_MAX_ITEMS,
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  DEFAULT_MAP_ZOOM_MAX,
  DEFAULT_COLORMAP
} from '../components/defaults'
import { DEFAULT_REL_TYPE_EXCLUDE_LIST } from './defaultLinkGrouping.js'
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
      // Upgrade old sceneTilerParams to visualizations dictionary
      collectionsConfig[collectionId].visualizations = {
        default: config.SCENE_TILER_PARAMS[collectionId]
      }
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
 * Gets collection-specific config parameter from COLLECTIONS_CONFIG
 * @param {string} collectionId - The collection ID
 * @param {string} paramName - Parameter name ('visualizations', 'mosaicTilerParams', etc.)
 * @param {Object} config - Optional config object for testing (uses store if not provided)
 * @returns {*} - The parameter value or undefined
 */
export function getCollectionConfig(collectionId, paramName, config = null) {
  const appConfig = config || store.getState().mainSlice.appConfig
  if (!appConfig) return undefined

  return appConfig.COLLECTIONS_CONFIG?.[collectionId]?.[paramName]
}

/**
 * Gets visualization keys for a collection and checks if it has visualizations
 * @param {string} collectionId - The collection ID
 * @param {Object} config - Optional config object for testing (uses store if not provided)
 * @returns {{visualizations: Object|null|undefined, visualizationKeys: string[], hasVisualizations: boolean}}
 */
export function getCollectionVisualizations(collectionId, config = null) {
  const visualizations = getCollectionConfig(
    collectionId,
    'visualizations',
    config
  )
  const visualizationKeys = visualizations ? Object.keys(visualizations) : []
  return {
    visualizations,
    visualizationKeys,
    hasVisualizations: visualizationKeys.length >= 1
  }
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
    const { appendStacHeaderCookies } = await import('../utils/stacRequest')

    const requestHeaders = new Headers()
    appendStacHeaderCookies(requestHeaders)

    // Fetch collections from STAC API
    const response = await getCollections(apiUrl, {
      headers: requestHeaders,
    })

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

    if (collectionIds.length === 0) {
      console.warn(
        'No valid collection IDs found after filtering - all collections have falsy IDs'
      )
      return config
    }

    // Filter COLLECTIONS_CONFIG to only include collections that are being used
    const filteredCollectionsConfig = {}
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
 * Auto-configures TiTiler rendering for collections based on STAC render extension
 * @param {Object} config - The configuration object with _STAC_COLLECTIONS
 * @returns {Object} - Config with auto-configured visualizations
 */
export function autoConfigureRendering(config) {
  // If no SCENE_TILER_URL is configured, skip rendering auto-configuration
  if (!config.SCENE_TILER_URL) {
    console.debug(
      'SCENE_TILER_URL not configured, skipping rendering auto-configuration'
    )
    return config
  }

  // If no collections were fetched, skip rendering auto-configuration
  if (!config._STAC_COLLECTIONS || !Array.isArray(config._STAC_COLLECTIONS)) {
    return config
  }

  const collectionsConfig = { ...config.COLLECTIONS_CONFIG } || {}

  // Process each collection
  for (const collection of config._STAC_COLLECTIONS) {
    const collectionId = collection.id

    // Skip if user has already configured visualizations for this collection
    if (
      collectionsConfig[collectionId]?.visualizations &&
      Object.keys(collectionsConfig[collectionId].visualizations).length > 0
    ) {
      console.debug(
        `Skipping rendering auto-configuration for '${collectionId}' - visualizations already configured`
      )
      continue
    }

    // Check for render extension
    const renders = collection.renders
    if (!renders || typeof renders !== 'object') {
      console.debug(
        `No 'renders' found for collection '${collectionId}', skipping rendering auto-configuration`
      )
      continue
    }

    const renderKeys = Object.keys(renders)
    if (renderKeys.length === 0) {
      console.debug(`Collection '${collectionId}' has empty 'renders' object`)
      continue
    }

    // Initialize collection config if needed
    if (!collectionsConfig[collectionId]) {
      collectionsConfig[collectionId] = {}
    }

    // Store all renders in the new "visualizations" field
    collectionsConfig[collectionId].visualizations = {}

    // Process all render definitions and store them
    for (const renderKey of renderKeys) {
      const renderDef = renders[renderKey]
      const processedRender = {}

      // Required: assets
      if (renderDef.assets && Array.isArray(renderDef.assets)) {
        processedRender.assets = renderDef.assets
      }

      // Optional: rescale
      if (renderDef.rescale && Array.isArray(renderDef.rescale)) {
        // Convert [[0,10000],[0,10000],[0,10000]] to "0,10000,0,10000,0,10000"
        const rescaleFlat = renderDef.rescale.flat().join(',')
        processedRender.rescale = [rescaleFlat]
      }

      // Optional: colormap_name
      if (renderDef.colormap_name) {
        processedRender.colormap_name = renderDef.colormap_name
      }

      // Optional: colormap
      if (renderDef.colormap) {
        processedRender.colormap = renderDef.colormap
      }

      // Optional: color_formula
      if (renderDef.color_formula) {
        processedRender.color_formula = renderDef.color_formula
      }

      // Optional: nodata
      if (renderDef.nodata !== undefined) {
        processedRender.nodata = renderDef.nodata
      }

      // Optional: expression
      if (renderDef.expression) {
        processedRender.expression = renderDef.expression
      }

      // Optional: resampling (map to TiTiler's resampling_method)
      if (renderDef.resampling) {
        processedRender.resampling = renderDef.resampling
      }

      // Optional: title (for UI display)
      if (renderDef.title) {
        processedRender.title = renderDef.title
      }

      collectionsConfig[collectionId].visualizations[renderKey] =
        processedRender
    }

    // The first visualization is used as the default
    const defaultRenderKey = renderKeys[0]

    console.log(
      `Auto-configured visualizations for collection '${collectionId}': stored ${renderKeys.length} visualization(s) (default: '${defaultRenderKey}')`
    )

    // Initialize tileLayerParams if not present to avoid warnings
    if (!collectionsConfig[collectionId].tileLayerParams) {
      collectionsConfig[collectionId].tileLayerParams = {}
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
    RIGHT_SIDEBAR_ENABLED:
      config.RIGHT_SIDEBAR_ENABLED ?? DEFAULT_RIGHT_SIDEBAR_ENABLED,
    // STAC Links configuration
    STAC_LINK_ENABLED: config.STAC_LINK_ENABLED ?? DEFAULT_STAC_LINK_ENABLED,
    STAC_LINKS_SECTION_ENABLED:
      config.STAC_LINKS_SECTION_ENABLED ?? DEFAULT_STAC_LINKS_SECTION_ENABLED,
    STAC_LINKS_EXCLUDE_LIST:
      config.STAC_LINKS_EXCLUDE_LIST ?? DEFAULT_REL_TYPE_EXCLUDE_LIST,
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
