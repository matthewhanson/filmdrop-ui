import { store } from '../redux/store'
import {
  DEFAULT_SCENE_MIN_ZOOM,
  DEFAULT_API_MAX_ITEMS,
  DEFAULT_MOSAIC_MAX_ITEMS,
  DEFAULT_DATE_RANGE
} from '../components/defaults'
import {
  getCurrentMapZoomLevel,
  clearAllLayers,
  clearLayer,
  bboxFromMapBounds,
  clampAndRoundBbox,
  clearMapSelection
} from './mapHelper'
import { getCollectionConfig } from './configHelper'
import { convertDateForURL, convertDate } from './datetime'
import { SearchService } from '../services/get-search-service'
import { AggregateSearchService } from '../services/get-aggregate-service'
import {
  setSearchLoading,
  setSearchType,
  setShowZoomNotice,
  setZoomLevelNeeded,
  setSearchResults,
  setShowPopupModal,
  setSearchDateRangeValue,
  setQueryableFilters,
  setmappedScenes,
  setselectedPopupResultIndex,
  setsearchGeojsonBoundary,
  setisDrawingEnabled,
  setpaginationNextLink,
  setpaginationPrevLink,
  setcurrentPage,
  settotalPages,
  setpaginationHistory,
  incrementDetailsResetKey
} from '../redux/slices/mainSlice'
import * as h3 from 'h3-js'
import debounce from './debounce'
import { AddMosaicService } from '../services/post-mosaic-service'
import { router, getPathParams } from '../router'
import { appendStacHeaderCookies } from '../utils/stacRequest'
import { serializeQueryableFiltersForUrl } from './urlParamHelper'

/**
 * Convert queryable filters from Redux state into STAC Query Extension format
 * @param {Object} queryableFilters - Filter values from Redux (fieldName -> value)
 * @returns {Object} Query object in STAC Query Extension format
 */
export function buildQueryFromFilters(queryableFilters) {
  const query = {}

  Object.entries(queryableFilters).forEach(([fieldName, value]) => {
    if (value === null || value === undefined) {
      return
    }

    // Handle range values (object with min and/or max)
    if (
      typeof value === 'object' &&
      !Array.isArray(value) &&
      ('min' in value || 'max' in value)
    ) {
      const queryVal = {}
      if ('min' in value) queryVal.gte = value.min
      if ('max' in value) queryVal.lte = value.max
      if (Object.keys(queryVal).length > 0) {
        query[fieldName] = queryVal
      }
      return
    }

    // Handle array values (multi-select, can be any type including numbers)
    if (Array.isArray(value)) {
      if (value.length > 0) {
        query[fieldName] = { in: value }
      }
      return
    }

    // Handle boolean and single values
    query[fieldName] = { eq: value }
  })

  return query
}

export function newSearch(options = {}) {
  const { viewMode: overrideViewMode, preserveItem = false } = options

  // Snapshot all needed Redux state upfront, before any dispatches or URL writes.
  const _state = store.getState().mainSlice
  const _selectedCollection = _state.selectedCollectionData
  const viewMode = overrideViewMode || _state.viewMode
  const dateRange = _state.searchDateRangeValue
  const dt =
    dateRange && dateRange[0] && dateRange[1]
      ? `${dateRange[0]}/${dateRange[1]}`
      : ''

  clearMapSelection()
  clearAllLayers()
  store.dispatch(setSearchResults(null))
  store.dispatch(setShowZoomNotice(false))
  store.dispatch(setSearchLoading(false))

  // Reset pagination state for new search
  store.dispatch(setpaginationNextLink(null))
  store.dispatch(setpaginationPrevLink(null))
  store.dispatch(setcurrentPage(1))
  store.dispatch(settotalPages(null))
  store.dispatch(setpaginationHistory([]))

  // Commit current search state to URL (replace — no history entry)
  const collectionId = _selectedCollection?.id || ''
  const currentPathParams = getPathParams()
  const currentItemId = preserveItem ? currentPathParams.itemId || '' : ''

  router.navigate({
    to: currentItemId
      ? '/$collectionId/$itemId'
      : collectionId
        ? '/$collectionId'
        : '/',
    params: currentItemId
      ? { collectionId, itemId: currentItemId }
      : collectionId
        ? { collectionId }
        : {},
    search: (prev) => ({
      // Only preserve immediate/map params — don't spread all of prev,
      // which would carry stale queryable filters from a previous collection.
      tab: prev.tab,
      z: prev.z,
      c: prev.c,
      dt,
      view: viewMode || 'scene',
      viz: _state.selectedVisualization || '',
      ...serializeQueryableFiltersForUrl(_state.queryableFilters)
    }),
    replace: true
  })

  // Get minimum zoom level for scene/mosaic views
  const sceneMinZoom =
    getCollectionConfig(_selectedCollection.id, 'sceneMinZoom') ||
    DEFAULT_SCENE_MIN_ZOOM

  const currentMapZoomLevel = getCurrentMapZoomLevel()

  // Check for both new (stac-server >= 3.6.0) and old (deprecated) aggregation names
  const includesGeoHex = _selectedCollection.aggregations?.some(
    (el) =>
      el.name === 'centroid_geohex_grid_frequency' ||
      el.name === 'grid_geohex_frequency'
  )
  const includesGridCode = _selectedCollection.aggregations?.some(
    (el) => el.name === 'grid_code_frequency'
  )

  // Handle mosaic mode
  if (viewMode === 'mosaic') {
    if (currentMapZoomLevel < sceneMinZoom) {
      store.dispatch(setZoomLevelNeeded(sceneMinZoom))
      store.dispatch(setShowZoomNotice(true))
      return
    }
    newMosaicSearch()
    return
  }

  // Handle user-selected view mode
  if (viewMode === 'scene') {
    // User wants scene view - check zoom level
    if (currentMapZoomLevel < sceneMinZoom) {
      store.dispatch(setZoomLevelNeeded(sceneMinZoom))
      store.dispatch(setShowZoomNotice(true))
      return
    }
    const searchScenesParams = buildSearchScenesParams()
    store.dispatch(setSearchType('scene'))
    store.dispatch(setSearchLoading(true))
    SearchService(searchScenesParams, 'scene')
    return
  } else if (viewMode === 'hex' && includesGeoHex) {
    // User wants hex view - no zoom restriction
    const searchAggregateParams = buildSearchAggregateParams('hex')
    store.dispatch(setSearchLoading(true))
    store.dispatch(setSearchType('hex'))
    AggregateSearchService(searchAggregateParams, 'hex')
    return
  } else if (viewMode === 'grid-code' && includesGridCode) {
    // User wants grid-code view - no zoom restriction
    const searchAggregateParams = buildSearchAggregateParams('grid-code')
    store.dispatch(setSearchType('grid-code'))
    store.dispatch(setSearchLoading(true))
    AggregateSearchService(searchAggregateParams, 'grid-code')
    return
  }

  // Fallback: if no valid selection, default to scene view if zoom allows
  if (currentMapZoomLevel >= sceneMinZoom) {
    const searchScenesParams = buildSearchScenesParams()
    store.dispatch(setSearchType('scene'))
    store.dispatch(setSearchLoading(true))
    SearchService(searchScenesParams, 'scene')
  } else {
    store.dispatch(setZoomLevelNeeded(sceneMinZoom))
    store.dispatch(setShowZoomNotice(true))
  }
}

export function clearSearch() {
  // Clear map layers: selection highlights, imagery overlays, search results
  clearMapSelection()
  clearAllLayers()
  clearLayer('drawBoundsLayer')

  // Clear drawn AOI boundary
  store.dispatch(setsearchGeojsonBoundary(null))
  store.dispatch(setisDrawingEnabled(false))

  // Clear search results and related state
  store.dispatch(setSearchResults(null))
  store.dispatch(setSearchLoading(false))
  store.dispatch(setSearchType(null))
  store.dispatch(setShowZoomNotice(false))
  store.dispatch(setmappedScenes([]))
  store.dispatch(setShowPopupModal(false))
  store.dispatch(setselectedPopupResultIndex(0))

  // Reset pagination
  store.dispatch(setpaginationNextLink(null))
  store.dispatch(setpaginationPrevLink(null))
  store.dispatch(setcurrentPage(1))
  store.dispatch(settotalPages(null))
  store.dispatch(setpaginationHistory([]))

  // Reset filters to defaults
  store.dispatch(setSearchDateRangeValue(DEFAULT_DATE_RANGE))
  store.dispatch(setQueryableFilters({}))

  // Reset item details accordion state
  store.dispatch(incrementDetailsResetKey())

  // Update URL: preserve collection path, view, viz, z, c; clear dt, item, queryable filters
  const currentPathParams = getPathParams()
  const collectionId = currentPathParams.collectionId || ''

  router.navigate({
    to: collectionId ? '/$collectionId' : '/',
    params: collectionId ? { collectionId } : {},
    search: (prev) => ({
      dt: '',
      view: prev.view,
      viz: prev.viz,
      tab: 'search',
      z: prev.z,
      c: prev.c
    }),
    replace: true
  })
}

function buildSearchScenesParams(gridCodeToSearchIn) {
  const _selectedCollection = store.getState().mainSlice.selectedCollectionData
  const bbox = buildUrlParamFromBBOX()
  const _dateTimeRange = convertDateForURL(
    store.getState().mainSlice.searchDateRangeValue
  )
  const limit =
    store.getState().mainSlice.appConfig.API_MAX_ITEMS || DEFAULT_API_MAX_ITEMS
  const collections = _selectedCollection.id
  const _searchGeojsonBoundary =
    store.getState().mainSlice.searchGeojsonBoundary

  const searchParams = new Map([
    ['datetime', _dateTimeRange],
    ['limit', limit],
    ['collections', collections]
  ])
  if (_searchGeojsonBoundary) {
    searchParams.set(
      'intersects',
      encodeURIComponent(JSON.stringify(_searchGeojsonBoundary.geometry))
    )
  } else if (bbox) {
    searchParams.set('bbox', bbox)
  }

  // Build query from queryable filters
  const queryableFilters = store.getState().mainSlice.queryableFilters
  const query = buildQueryFromFilters(queryableFilters)

  // Add grid:code filter if provided
  if (gridCodeToSearchIn) {
    query['grid:code'] = { in: gridCodeToSearchIn }
  }

  if (Object.keys(query).length > 0) {
    searchParams.set('query', encodeURIComponent(JSON.stringify(query)))
  }

  return [...searchParams]
    .reduce((obj, x) => {
      obj.push(x.join('='))
      return obj
    }, [])
    .join('&')
}

function buildSearchAggregateParams(gridType) {
  const _selectedCollection = store.getState().mainSlice.selectedCollectionData
  const bbox = buildUrlParamFromBBOX()
  const _dateTimeRange = convertDateForURL(
    store.getState().mainSlice.searchDateRangeValue
  )
  const _searchGeojsonBoundary =
    store.getState().mainSlice.searchGeojsonBoundary
  const collections = _selectedCollection.id

  let aggregations
  if (gridType === 'hex') {
    const currentMapZoomLevel = getCurrentMapZoomLevel()
    let precision
    switch (true) {
      case currentMapZoomLevel === 0:
        precision = 1
        break
      case currentMapZoomLevel >= 1 && currentMapZoomLevel <= 3:
        precision = 2
        break
      case currentMapZoomLevel >= 4 && currentMapZoomLevel <= 6:
        precision = 3
        break
      case currentMapZoomLevel >= 7 && currentMapZoomLevel <= 8:
        precision = 4
        break
      case currentMapZoomLevel >= 9:
        precision = 5
        break
    }

    // Determine which aggregation name to use (prefer new, fallback to old for backwards compatibility)
    const hasNewAggregation = _selectedCollection.aggregations?.some(
      (el) => el.name === 'centroid_geohex_grid_frequency'
    )
    const aggregationName = hasNewAggregation
      ? 'centroid_geohex_grid_frequency'
      : 'grid_geohex_frequency'
    aggregations = `${aggregationName},total_count&${aggregationName}_precision=${precision}`
  } else {
    aggregations = `grid_code_frequency,total_count`
  }

  const searchParams = new Map([
    ['datetime', _dateTimeRange],
    ['collections', collections],
    ['aggregations', aggregations]
  ])
  if (_searchGeojsonBoundary) {
    searchParams.set(
      'intersects',
      encodeURIComponent(JSON.stringify(_searchGeojsonBoundary.geometry))
    )
  } else if (bbox) {
    searchParams.set('bbox', bbox)
  }

  // Build query from queryable filters
  const queryableFilters = store.getState().mainSlice.queryableFilters
  const query = buildQueryFromFilters(queryableFilters)

  if (Object.keys(query).length > 0) {
    searchParams.set('query', encodeURIComponent(JSON.stringify(query)))
  }

  return [...searchParams]
    .reduce((obj, x) => {
      obj.push(x.join('='))
      return obj
    }, [])
    .join('&')
}

export function buildUrlParamFromBBOX() {
  const viewportBounds = bboxFromMapBounds()
  if (!viewportBounds) return ''
  const bbox = clampAndRoundBbox(viewportBounds)
  if (!bbox) return ''
  return [bbox[0], bbox[1], bbox[2], bbox[3]].join(',')
}

export function mapHexGridFromJson(json) {
  let largestRatio = 0
  let largestFrequency = 0

  // Check for both new (stac-server >= 3.6.0) and old (deprecated) aggregation names
  const hexAggregation = json.aggregations?.find(
    (el) =>
      el.name === 'centroid_geohex_grid_frequency' ||
      el.name === 'grid_geohex_frequency'
  )

  const buckets = hexAggregation?.buckets
  const numberMatched = json?.aggregations?.find(
    (el) => el.name === 'total_count'
  )?.value
  const overflow = hexAggregation?.overflow

  const convertedItems = buckets.map((feature) => {
    const hexBoundary = h3.cellToBoundary(feature.key, true)

    // fix coordinates that cross anti-meridian
    const fixedBoundaries = fixAntiMeridianPoints(hexBoundary)

    // calculate heat map color ratio
    const colorRatio = (feature.frequency / numberMatched) * 5000
    // capture largest ratio value to set the total number of color variations in colormap
    largestRatio = colorRatio > largestRatio ? colorRatio : largestRatio
    // capture largest frequency value to use in the legend and colormap
    largestFrequency =
      feature.frequency > largestFrequency
        ? feature.frequency
        : largestFrequency

    return {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [fixedBoundaries]
      },
      properties: { frequency: feature.frequency, colorRatio, largestRatio }
    }
  })

  return {
    type: 'FeatureCollection',
    features: convertedItems,
    numberMatched,
    searchType: 'AggregatedResults',
    properties: { largestRatio, largestFrequency, overflow }
  }
}

function fixAntiMeridianPoints(hexBoundary) {
  // Example: [-170.6193233947984, -161.63482061718392, -165.41674992858836, -176.05696384421353, 175.98600155652952, 177.51613498805204, -170.6193233947984]
  const longArray = hexBoundary.map((element) => element[0])

  // get general location of polygon points east or west of antimeridian
  const lessThanNegative100 = longArray.filter((lng) => lng < -100)
  const greaterThanPositive100 = longArray.filter((lng) => lng > 100)
  const hasMorePositive =
    greaterThanPositive100.length > lessThanNegative100.length

  // adjust coordinate to join the rest of the polygon on the same side of the meridian
  for (const n in hexBoundary) {
    if (
      !hasMorePositive &&
      greaterThanPositive100.length > 0 &&
      hexBoundary[n][0] > -100
    ) {
      hexBoundary[n][0] = hexBoundary[n][0] - 360
      if (hexBoundary[n][0] < -180) {
        hexBoundary[n][0] = -180
      }
    } else if (
      hasMorePositive &&
      lessThanNegative100.length > 0 &&
      hexBoundary[n][0] < -100
    ) {
      hexBoundary[n][0] = hexBoundary[n][0] + 360
      if (hexBoundary[n][0] > 180) {
        hexBoundary[n][0] = 180
      }
    }
  }
  return hexBoundary
}

export function mapGridCodeFromJson(json) {
  const _gridCellData = store.getState().mainSlice.localGridData
  const buckets = json.aggregations?.find(
    (el) => el.name === 'grid_code_frequency'
  ).buckets
  const numberMatched = json?.aggregations?.find(
    (el) => el.name === 'total_count'
  )?.value
  const overflow = json?.aggregations.find(
    (el) => el.name === 'grid_code_frequency'
  ).overflow

  const mappedKeysToGrid = buckets
    .map((feature) => {
      const keyParts = feature.key.split('-', 2)
      const pattern = /^[A-Z0-9]+-[-_.A-Za-z0-9]+$/

      if (keyParts.length !== 2 || !pattern.test(feature.key)) {
        return null
      }

      const prefix = keyParts[0]
      const cell = keyParts[1]

      const gridToMapInto = _gridCellData[prefix]

      if (!gridToMapInto) {
        return null
      }

      const type = gridToMapInto.type
      const coordinates = gridToMapInto.cells[cell]

      return {
        geometry: {
          type,
          coordinates
        },
        type: 'Feature',
        properties: {
          'grid:code': feature.key,
          frequency: feature.frequency
        }
      }
    })
    .filter((feature) => feature && feature.geometry.coordinates)

  return {
    type: 'FeatureCollection',
    features: mappedKeysToGrid,
    numberMatched,
    searchType: 'AggregatedResults',
    properties: { overflow }
  }
}

export function searchGridCodeScenes(gridCodeToSearchIn) {
  const searchScenesParams = buildSearchScenesParams(gridCodeToSearchIn)
  SearchService(searchScenesParams, 'grid-code')
}

export const debounceNewSearch = debounce(() => newSearch(), 300)

export { buildSearchScenesParams, buildSearchAggregateParams }

function newMosaicSearch() {
  clearAllLayers()
  store.dispatch(setSearchResults(null))
  store.dispatch(setShowZoomNotice(false))
  store.dispatch(setSearchLoading(true))
  const _selectedCollectionData =
    store.getState().mainSlice.selectedCollectionData
  const datetime = convertDate(store.getState().mainSlice.searchDateRangeValue)
  const _searchGeojsonBoundary =
    store.getState().mainSlice.searchGeojsonBoundary
  let bboxFromMap = bboxFromMapBounds()
  if (bboxFromMap) {
    bboxFromMap = clampAndRoundBbox(bboxFromMap)
  }

  const createMosaicBody = {
    stac_api_root: store.getState().mainSlice.appConfig.STAC_API_URL,
    asset_name: constructMosaicAssetVal(_selectedCollectionData.id),
    collections: [_selectedCollectionData.id],
    datetime,
    max_items:
      store.getState().mainSlice.appConfig.MOSAIC_MAX_ITEMS ||
      DEFAULT_MOSAIC_MAX_ITEMS
  }
  if (_searchGeojsonBoundary) {
    createMosaicBody.intersects = _searchGeojsonBoundary.geometry
  } else if (bboxFromMap) {
    createMosaicBody.bbox = bboxFromMap
  }

  // Add queryable filters from Redux state
  const queryableFilters = store.getState().mainSlice.queryableFilters
  const query = buildQueryFromFilters(queryableFilters)
  if (Object.keys(query).length > 0) {
    createMosaicBody.query = query
  }

  const requestHeaders = new Headers()
  appendStacHeaderCookies(requestHeaders)
  requestHeaders.append(
    'Content-Type',
    'application/vnd.titiler.stac-api-query+json'
  )
  const requestOptions = {
    method: 'POST',
    headers: requestHeaders,
    body: JSON.stringify(createMosaicBody),
    credentials:
      store.getState().mainSlice.appConfig.FETCH_CREDENTIALS || 'same-origin'
  }

  AddMosaicService(requestOptions)
}

const constructMosaicAssetVal = (collection) => {
  const mosaicTilerParams = getCollectionConfig(collection, 'mosaicTilerParams')
  const assets = mosaicTilerParams?.assets
  if (!assets) {
    console.log(`Assets not defined for ${collection}`)
    return null
  }
  // Handle both string and array formats without mutation
  if (Array.isArray(assets)) {
    return assets[assets.length - 1]
  }
  return assets
}
