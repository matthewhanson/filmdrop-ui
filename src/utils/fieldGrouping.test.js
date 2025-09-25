import {
  groupFieldsSemantically,
  createEnhancedDisplayFieldPredicate
} from './fieldGrouping.js'

describe('fieldGrouping', () => {
  describe('groupFieldsSemantically', () => {
    it('should group fields by extension prefix', () => {
      const properties = {
        'eo:cloud_cover': 22.959924,
        'proj:centroid': [30.23598, -98.42964],
        'mgrs:utm_zone': 14
      }
      const result = groupFieldsSemantically(properties)
      expect(result.eo).toBeDefined()
      expect(result.proj).toBeDefined()
      expect(result.mgrs).toBeDefined()
    })

    it('should group fields with filter predicate', () => {
      const properties = {
        'eo:cloud_cover': 22.959924,
        'proj:centroid': [30.23598, -98.42964],
        'mgrs:utm_zone': 14,
        'unwanted:field': 'should be filtered'
      }
      const filterPredicate = (field) => !field.startsWith('unwanted:')
      const result = groupFieldsSemantically(properties, filterPredicate)
      expect(result.eo).toBeDefined()
      expect(result.proj).toBeDefined()
      expect(result.mgrs).toBeDefined()
      expect(result.unwanted).toBeUndefined()
    })

    it('should handle fields without prefixes', () => {
      const properties = {
        datetime: '2025-08-26T17:25:46.656000Z',
        platform: 'sentinel-2c',
        'eo:cloud_cover': 22.959924
      }
      const result = groupFieldsSemantically(properties)
      expect(result.core).toBeDefined()
      expect(result.core.datetime).toBe('2025-08-26T17:25:46.656000Z')
      expect(result.core.platform).toBe('sentinel-2c')
      expect(result.eo).toBeDefined()
    })

    it('should handle empty properties', () => {
      const result = groupFieldsSemantically({})
      expect(result).toEqual({})
    })

    it('should handle null properties', () => {
      const result = groupFieldsSemantically(null)
      expect(result).toEqual({})
    })
  })

  describe('createEnhancedDisplayFieldPredicate', () => {
    it('should create predicate that allows configured fields from ENHANCED_DISPLAY_CONFIG', () => {
      const appConfig = {
        ENHANCED_DISPLAY_CONFIG: {
          'sentinel-2-l2a': {
            property_groups: [
              {
                name: 'Core Fields',
                fields: [{ name: 'datetime' }, { name: 'platform' }]
              },
              {
                name: 'Data Quality',
                fields: [{ name: 'eo:cloud_cover' }]
              }
            ]
          }
        }
      }
      const predicate = createEnhancedDisplayFieldPredicate(
        'sentinel-2-l2a',
        appConfig
      )

      expect(predicate('datetime')).toBe(true)
      expect(predicate('platform')).toBe(true)
      expect(predicate('eo:cloud_cover')).toBe(true)
      expect(predicate('unwanted:field')).toBe(false)
    })

    it('should return allow-all predicate when property_groups is missing', () => {
      const appConfig = {
        ENHANCED_DISPLAY_CONFIG: {
          'sentinel-2-l2a': {
            // Missing property_groups
            asset_groups: []
          }
        }
      }
      const predicate = createEnhancedDisplayFieldPredicate(
        'sentinel-2-l2a',
        appConfig
      )

      expect(predicate('any:field')).toBe(true)
    })

    it('should return allow-all predicate when no config exists', () => {
      const appConfig = {}
      const predicate = createEnhancedDisplayFieldPredicate(
        'unknown-collection',
        appConfig
      )

      expect(predicate('any:field')).toBe(true)
      expect(predicate('another:field')).toBe(true)
    })

    it('should return allow-all predicate when collection not in config', () => {
      const appConfig = {
        ENHANCED_DISPLAY_CONFIG: {
          'other-collection': {
            property_groups: [{ name: 'Test', fields: [{ name: 'datetime' }] }]
          }
        }
      }
      const predicate = createEnhancedDisplayFieldPredicate(
        'sentinel-2-l2a',
        appConfig
      )

      expect(predicate('any:field')).toBe(true)
    })
  })
})
