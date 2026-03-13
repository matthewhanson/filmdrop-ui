import { describe, it, expect, vi, beforeEach } from 'vitest'
import { store } from '../redux/store'
import {
  setSelectedCollectionData,
  setSearchDateRangeValue,
  setQueryableFilters,
  setMosaicCache,
  setappConfig
} from '../redux/slices/mainSlice'
import {
  DEFAULT_DATE_RANGE,
  DEFAULT_MOSAIC_TOP_COMPARE_ITEMS
} from '../components/defaults'
import {
  newSearch,
  buildUrlParamFromBBOX,
  buildSearchScenesParams,
  buildSearchAggregateParams
} from './searchHelper'
import * as mapHelper from './mapHelper'
import { AddMosaicService } from '../services/post-mosaic-service'
import * as getSearchService from '../services/get-search-service'

vi.mock('../services/post-mosaic-service', () => ({
  AddMosaicService: vi.fn()
}))

vi.mock('./mapHelper', async () => {
  const actual = await vi.importActual('./mapHelper')
  return {
    ...actual,
    hasMosaicImageLayer: vi.fn(() => true)
  }
})

const mockCollection = {
  id: 'test-collection',
  aggregations: [],
  mosaicTilerParams: {
    assets: ['test-asset']
  }
}

function mockMapBounds(bbox) {
  const [minLng, minLat, maxLng, maxLat] = bbox
  return {
    _southWest: { lng: minLng, lat: minLat },
    _northEast: { lng: maxLng, lat: maxLat }
  }
}

describe('searchHelper newSearch', () => {
  beforeEach(() => {
    store.dispatch(
      setappConfig({
        STAC_API_URL: 'https://example.com/stac',
        MOSAIC_MAX_ITEMS: DEFAULT_MOSAIC_TOP_COMPARE_ITEMS,
        FETCH_CREDENTIALS: 'same-origin',
        APP_TOKEN_AUTH_ENABLED: false
      })
    )
    store.dispatch(
      setSelectedCollectionData({
        ...mockCollection
      })
    )
    store.dispatch(setSearchDateRangeValue(DEFAULT_DATE_RANGE))
    store.dispatch(setQueryableFilters({}))
    store.dispatch(
      setMosaicCache({
        lastMosaicRequestSignature: null,
        lastMosaicTopItemIds: null,
        lastMosaicCompareCount: null
      })
    )
    AddMosaicService.mockReset()
    vi.spyOn(getSearchService, 'fetchTopItemsForMosaic').mockReset()
    mapHelper.hasMosaicImageLayer.mockReset()
    mapHelper.hasMosaicImageLayer.mockReturnValue(true)
  })

  it('creates a mosaic when there is no cache (mosaic view)', async () => {
    vi.spyOn(getSearchService, 'fetchTopItemsForMosaic').mockResolvedValue({
      itemIds: null,
      effectiveLimit: 0
    })

    await newSearch({ viewMode: 'mosaic' })

    expect(AddMosaicService).toHaveBeenCalledTimes(1)
  })

  it('reuses mosaic when top-n items match previous cache', async () => {
    const itemIds = ['a', 'b', 'c']
    vi.spyOn(getSearchService, 'fetchTopItemsForMosaic').mockResolvedValue({
      itemIds,
      effectiveLimit: itemIds.length
    })

    await newSearch({ viewMode: 'mosaic' })

    expect(AddMosaicService).toHaveBeenCalledTimes(1)

    const [, firstCacheMetadata] = AddMosaicService.mock.calls[0]

    store.dispatch(
      setMosaicCache({
        lastMosaicRequestSignature: firstCacheMetadata.signature,
        lastMosaicTopItemIds: itemIds,
        // In the app, compareCount is the configured
        // comparison window size, not the number of
        // items returned in a given response.
        lastMosaicCompareCount: DEFAULT_MOSAIC_TOP_COMPARE_ITEMS
      })
    )

    AddMosaicService.mockClear()

    await newSearch({ viewMode: 'mosaic' })

    expect(AddMosaicService).toHaveBeenCalledTimes(0)
  })

  it('rebuilds mosaic when signature matches but mosaic layer is missing', async () => {
    const itemIds = ['a', 'b', 'c']
    vi.spyOn(getSearchService, 'fetchTopItemsForMosaic').mockResolvedValue({
      itemIds,
      effectiveLimit: itemIds.length
    })

    await newSearch({ viewMode: 'mosaic' })

    const [, firstCacheMetadata] = AddMosaicService.mock.calls[0]

    store.dispatch(
      setMosaicCache({
        lastMosaicRequestSignature: firstCacheMetadata.signature,
        lastMosaicTopItemIds: itemIds,
        lastMosaicCompareCount: itemIds.length
      })
    )

    AddMosaicService.mockClear()
    mapHelper.hasMosaicImageLayer.mockReturnValue(false)

    await newSearch({ viewMode: 'mosaic' })

    expect(AddMosaicService).toHaveBeenCalledTimes(1)
  })

  it('rebuilds mosaic when compare count changes even if top items match', async () => {
    const itemIds = ['a', 'b', 'c']
    vi.spyOn(getSearchService, 'fetchTopItemsForMosaic').mockResolvedValue({
      itemIds,
      effectiveLimit: itemIds.length
    })

    await newSearch({ viewMode: 'mosaic' })

    const [, firstCacheMetadata] = AddMosaicService.mock.calls[0]

    store.dispatch(
      setMosaicCache({
        lastMosaicRequestSignature: firstCacheMetadata.signature,
        lastMosaicTopItemIds: itemIds,
        lastMosaicCompareCount: itemIds.length - 1
      })
    )

    AddMosaicService.mockClear()

    await newSearch({ viewMode: 'mosaic' })

    expect(AddMosaicService).toHaveBeenCalledTimes(1)
  })

  it('caps compare count using DEFAULT_MOSAIC_TOP_COMPARE_ITEMS', async () => {
    const longList = Array.from(
      { length: DEFAULT_MOSAIC_TOP_COMPARE_ITEMS + 10 },
      (_, index) => `id-${index}`
    )

    vi.spyOn(getSearchService, 'fetchTopItemsForMosaic').mockResolvedValue({
      itemIds: longList,
      effectiveLimit: longList.length
    })

    await newSearch({ viewMode: 'mosaic' })

    const [, cacheMetadata] = AddMosaicService.mock.calls[0]
    expect(cacheMetadata.compareCount).toBe(DEFAULT_MOSAIC_TOP_COMPARE_ITEMS)
  })

  it('still creates mosaic when fetchTopItemsForMosaic rejects (fallback)', async () => {
    vi.spyOn(getSearchService, 'fetchTopItemsForMosaic').mockRejectedValue(
      new Error('Network error')
    )

    await newSearch({ viewMode: 'mosaic' })

    expect(AddMosaicService).toHaveBeenCalledTimes(1)
  })
})

describe('searchHelper bbox precision', () => {
  describe('buildUrlParamFromBBOX', () => {
    it('returns bbox string with coordinates rounded to 6 decimal places', () => {
      vi.spyOn(store, 'getState').mockReturnValue({
        mainSlice: {
          map: {
            getBounds: () =>
              mockMapBounds([
                -122.123456789012, 37.987654321098, -121.111222333444,
                38.555666777888
              ])
          }
        }
      })
      const result = buildUrlParamFromBBOX()
      expect(result).toBe('-122.123457,37.987654,-121.111222,38.555667')
    })

    it('clamps longitude to -180 and 180', () => {
      vi.spyOn(store, 'getState').mockReturnValue({
        mainSlice: {
          map: {
            getBounds: () => mockMapBounds([-190, 40, 200, 45])
          }
        }
      })
      const result = buildUrlParamFromBBOX()
      expect(result).toBe('-180,40,180,45')
    })

    it('returns empty string when viewport bounds are not available', () => {
      vi.spyOn(store, 'getState').mockReturnValue({
        mainSlice: { map: null }
      })
      expect(buildUrlParamFromBBOX()).toBe('')
    })

    it('keeps in-range longitudes rounded to 6 decimals', () => {
      vi.spyOn(store, 'getState').mockReturnValue({
        mainSlice: {
          map: {
            getBounds: () =>
              mockMapBounds([-122.123456789, 37.5, -121.999999999, 38.1])
          }
        }
      })
      const result = buildUrlParamFromBBOX()
      const parts = result.split(',')
      expect(parts).toHaveLength(4)
      expect(Number(parts[0])).toBe(-122.123457)
      expect(Number(parts[1])).toBe(37.5)
      expect(Number(parts[2])).toBe(-122)
      expect(Number(parts[3])).toBe(38.1)
    })
  })

  describe('search URL builders omit bbox when bounds are missing', () => {
    it('omits bbox in scene search params when viewport bounds are not available', () => {
      vi.spyOn(store, 'getState').mockReturnValue({
        mainSlice: {
          selectedCollectionData: { id: 'test-collection' },
          searchDateRangeValue: [
            '2020-01-01T00:00:00Z',
            '2020-01-02T00:00:00Z'
          ],
          appConfig: {},
          searchGeojsonBoundary: null,
          queryableFilters: {},
          map: null
        }
      })

      const result = buildSearchScenesParams()
      expect(result).not.toContain('bbox=')
    })

    it('omits bbox in aggregate search params when viewport bounds are not available', () => {
      vi.spyOn(store, 'getState').mockReturnValue({
        mainSlice: {
          selectedCollectionData: {
            id: 'test-collection',
            aggregations: [{ name: 'centroid_geohex_grid_frequency' }]
          },
          searchDateRangeValue: [
            '2020-01-01T00:00:00Z',
            '2020-01-02T00:00:00Z'
          ],
          appConfig: {},
          searchGeojsonBoundary: null,
          queryableFilters: {},
          map: null
        }
      })

      const result = buildSearchAggregateParams('hex')
      expect(result).not.toContain('bbox=')
    })
  })
})
