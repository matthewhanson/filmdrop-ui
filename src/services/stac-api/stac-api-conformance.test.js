import { describe, it, expect } from 'vitest'
import {
  STAC_API_CORE,
  STAC_API_EXTENSIONS,
  STAC_API_EXTENSIONS_COMMUNITY,
  ALL_CONFORMANCE_CLASSES,
  getConformanceName
} from './stac-api-conformance'

describe('STAC API Conformance Constants', () => {
  describe('STAC_API_CORE', () => {
    it('should have core STAC API conformance classes', () => {
      expect(STAC_API_CORE.CORE).toBe('https://api.stacspec.org/v1.0.0/core')
      expect(STAC_API_CORE.COLLECTIONS).toBe(
        'https://api.stacspec.org/v1.0.0/collections'
      )
      expect(STAC_API_CORE.ITEM_SEARCH).toBe(
        'https://api.stacspec.org/v1.0.0/item-search'
      )
    })

    it('should have OGC API Features conformance classes', () => {
      expect(STAC_API_CORE.OGCAPI_FEATURES).toBe(
        'http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/core'
      )
      expect(STAC_API_CORE.OGCAPI_FEATURES_GEOJSON).toBe(
        'http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/geojson'
      )
    })
  })

  describe('STAC_API_EXTENSIONS', () => {
    it('should have common STAC API extension conformance classes', () => {
      expect(STAC_API_EXTENSIONS.QUERY).toContain('query')
      expect(STAC_API_EXTENSIONS.FIELDS).toContain('fields')
      expect(STAC_API_EXTENSIONS.SORT).toContain('sort')
      expect(STAC_API_EXTENSIONS.CONTEXT).toContain('context')
      expect(STAC_API_EXTENSIONS.FILTER).toContain('filter')
      expect(STAC_API_EXTENSIONS.AGGREGATION).toContain('aggregation')
    })
  })

  describe('STAC_API_EXTENSIONS_COMMUNITY', () => {
    it('should have community extension conformance classes', () => {
      expect(STAC_API_EXTENSIONS_COMMUNITY.FREE_TEXT).toContain('free-text')
      expect(STAC_API_EXTENSIONS_COMMUNITY.BROWSEABLE).toContain('browseable')
      expect(STAC_API_EXTENSIONS_COMMUNITY.CHILDREN).toContain('children')
      expect(STAC_API_EXTENSIONS_COMMUNITY.COLLECTION_SEARCH).toContain(
        'collection-search'
      )
    })
  })

  describe('ALL_CONFORMANCE_CLASSES', () => {
    it('should include all core, extension, and community conformance classes', () => {
      // Should include core classes
      expect(ALL_CONFORMANCE_CLASSES.CORE).toBe(STAC_API_CORE.CORE)
      expect(ALL_CONFORMANCE_CLASSES.COLLECTIONS).toBe(
        STAC_API_CORE.COLLECTIONS
      )

      // Should include extension classes
      expect(ALL_CONFORMANCE_CLASSES.QUERY).toBe(STAC_API_EXTENSIONS.QUERY)
      expect(ALL_CONFORMANCE_CLASSES.AGGREGATION).toBe(
        STAC_API_EXTENSIONS.AGGREGATION
      )

      // Should include community classes
      expect(ALL_CONFORMANCE_CLASSES.FREE_TEXT).toBe(
        STAC_API_EXTENSIONS_COMMUNITY.FREE_TEXT
      )
    })

    it('should have unique values', () => {
      const values = Object.values(ALL_CONFORMANCE_CLASSES)
      const uniqueValues = [...new Set(values)]
      expect(values.length).toBe(uniqueValues.length)
    })
  })

  describe('getConformanceName', () => {
    it('should return the name for a known conformance URI', () => {
      expect(getConformanceName(STAC_API_CORE.CORE)).toBe('CORE')
      expect(getConformanceName(STAC_API_CORE.ITEM_SEARCH)).toBe('ITEM_SEARCH')
      expect(getConformanceName(STAC_API_EXTENSIONS.QUERY)).toBe('QUERY')
      expect(getConformanceName(STAC_API_EXTENSIONS.AGGREGATION)).toBe(
        'AGGREGATION'
      )
    })

    it('should return null for an unknown conformance URI', () => {
      expect(
        getConformanceName('https://unknown.example.com/conformance')
      ).toBe(null)
    })
  })
})
