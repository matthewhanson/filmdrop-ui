import {
  sortFieldsByPriority,
  getCollectionFieldPriorities
} from './fieldPriorities.js'

// Mock STAC item for testing
const mockStacItem = {
  id: 'test-item',
  collection: 'sentinel-2-l2a',
  properties: {
    datetime: '2025-08-26T17:25:46.656000Z',
    platform: 'sentinel-2c',
    'eo:cloud_cover': 22.959924,
    'view:sun_elevation': 64.1772473903606,
    'proj:epsg': 32614,
    's2:processing_baseline': '05.11',
    's2:product_type': 'S2MSI2A',
    'proj:centroid': [30.23598, -98.42964],
    'proj:shape': [10980, 10980],
    'mgrs:utm_zone': 14,
    'mgrs:latitude_band': 'R',
    'mgrs:grid_square': 'NU'
  }
}

describe('fieldPriorities', () => {
  describe('sortFieldsByPriority', () => {
    it('should sort fields by priority order', () => {
      const fields = {
        platform: 'sentinel-2c',
        datetime: '2025-08-26T17:25:46.656000Z',
        'eo:cloud_cover': 22.959924
      }
      const priorities = ['datetime', 'platform', 'eo:cloud_cover']
      const result = sortFieldsByPriority(fields, priorities)

      expect(result[0][0]).toBe('datetime')
      expect(result[1][0]).toBe('platform')
      expect(result[2][0]).toBe('eo:cloud_cover')
    })

    it('should handle fields not in priority list', () => {
      const fields = {
        platform: 'sentinel-2c',
        'unknown:field': 'value',
        datetime: '2025-08-26T17:25:46.656000Z'
      }
      const priorities = ['datetime', 'platform']
      const result = sortFieldsByPriority(fields, priorities)

      expect(result[0][0]).toBe('datetime')
      expect(result[1][0]).toBe('platform')
      expect(result[2][0]).toBe('unknown:field')
    })

    it('should sort unknown fields alphabetically', () => {
      const fields = {
        'zebra:field': 'value',
        'apple:field': 'value',
        datetime: '2025-08-26T17:25:46.656000Z'
      }
      const priorities = ['datetime']
      const result = sortFieldsByPriority(fields, priorities)

      expect(result[0][0]).toBe('datetime')
      expect(result[1][0]).toBe('apple:field')
      expect(result[2][0]).toBe('zebra:field')
    })

    it('should handle empty priority list', () => {
      const fields = {
        'zebra:field': 'value',
        'apple:field': 'value'
      }
      const priorities = []
      const result = sortFieldsByPriority(fields, priorities)

      expect(result[0][0]).toBe('apple:field')
      expect(result[1][0]).toBe('zebra:field')
    })
  })

  describe('getCollectionFieldPriorities', () => {
    it('should return default priorities for unknown collections', () => {
      const result = getCollectionFieldPriorities('unknown-collection')
      expect(result).toContain('datetime')
      expect(result).toContain('platform')
      expect(result).toContain('instruments')
      expect(result).toContain('eo:cloud_cover')
      expect(result).toContain('gsd')
      expect(result).toContain('proj:epsg')
      expect(result).toContain('proj:centroid')
    })

    it('should return dynamic priorities for STAC items', () => {
      const result = getCollectionFieldPriorities(mockStacItem)
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should prioritize important fields in dynamic scoring', () => {
      const result = getCollectionFieldPriorities(mockStacItem)

      // Important fields should appear early in the list
      const datetimeIndex = result.indexOf('datetime')
      const platformIndex = result.indexOf('platform')

      if (datetimeIndex !== -1 && platformIndex !== -1) {
        expect(datetimeIndex).toBeLessThan(result.length / 2)
        expect(platformIndex).toBeLessThan(result.length / 2)
      }
    })

    it('should handle items with grid fields', () => {
      const result = getCollectionFieldPriorities(mockStacItem)

      // Grid fields should be prioritized
      const gridFields = result.filter(
        (field) =>
          field.includes('mgrs') ||
          field.includes('utm') ||
          field.includes('grid')
      )
      expect(gridFields.length).toBeGreaterThan(0)
    })

    it('should handle items with coordinate fields', () => {
      const result = getCollectionFieldPriorities(mockStacItem)

      // Coordinate fields should be prioritized
      const coordFields = result.filter(
        (field) => field.includes('centroid') || field.includes('bbox')
      )
      expect(coordFields.length).toBeGreaterThan(0)
    })

    it('should handle items with percentage fields', () => {
      const result = getCollectionFieldPriorities(mockStacItem)

      // Percentage fields should be prioritized
      const percentageFields = result.filter(
        (field) => field.includes('cloud_cover') || field.includes('cover')
      )
      expect(percentageFields.length).toBeGreaterThan(0)
    })

    it('should prefer scalar values over complex objects', () => {
      const itemWithComplexFields = {
        ...mockStacItem,
        properties: {
          ...mockStacItem.properties,
          'simple:field': 'value',
          'complex:field': {
            nested: 'object',
            with: 'many',
            properties: 'that',
            make: 'it',
            large: 'and',
            complex: 'to',
            display: 'in',
            overview: 'mode'
          }
        }
      }

      const result = getCollectionFieldPriorities(itemWithComplexFields)
      const simpleIndex = result.indexOf('simple:field')
      const complexIndex = result.indexOf('complex:field')

      if (simpleIndex !== -1 && complexIndex !== -1) {
        expect(simpleIndex).toBeLessThan(complexIndex)
      }
    })

    it('should handle errors gracefully', () => {
      const result = getCollectionFieldPriorities(null)
      expect(result).toContain('datetime')
      expect(result).toContain('platform')
    })
  })
})
