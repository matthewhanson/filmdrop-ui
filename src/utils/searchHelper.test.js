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
import { newSearch } from './searchHelper'
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
