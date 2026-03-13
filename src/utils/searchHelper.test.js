import { describe, it, expect, vi } from 'vitest'
import { store } from '../redux/store'
import {
  buildUrlParamFromBBOX,
  buildSearchScenesParams,
  buildSearchAggregateParams
} from './searchHelper'

function mockMapBounds(bbox) {
  const [minLng, minLat, maxLng, maxLat] = bbox
  return {
    _southWest: { lng: minLng, lat: minLat },
    _northEast: { lng: maxLng, lat: maxLat }
  }
}

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
