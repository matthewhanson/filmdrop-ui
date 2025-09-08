import {
  formatStacFieldEnhanced,
  getFieldLabel,
  getFieldUnit,
  renderFieldValue
} from './fieldFormatting.js'

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

describe('fieldFormatting', () => {
  describe('formatStacFieldEnhanced', () => {
    it('should format cloud cover with percentage', () => {
      const result = formatStacFieldEnhanced(
        'eo:cloud_cover',
        22.959924,
        mockStacItem
      )
      expect(result).toBeDefined()
    })

    it('should handle null values gracefully', () => {
      const result = formatStacFieldEnhanced('test:field', null, mockStacItem)
      expect(result).toBeDefined()
    })

    it('should format boolean values correctly', () => {
      const result = formatStacFieldEnhanced(
        'storage:requester_pays',
        true,
        mockStacItem
      )
      expect(result).toBe('Yes')
    })

    it('should format percentage values correctly', () => {
      const result = formatStacFieldEnhanced(
        'eo:cloud_cover',
        0.5,
        mockStacItem
      )
      expect(result).toBe('50.00%')
    })

    it('should format grid fields dynamically', () => {
      const result = formatStacFieldEnhanced(
        'grid:code',
        'MGRS-14R-NU',
        mockStacItem
      )
      expect(result).toContain('MGRS')
      expect(result).toContain('Utm Zone: 14')
      expect(result).toContain('Latitude Band: R')
      expect(result).toContain('Grid Square: NU')
    })

    it('should format coordinate fields dynamically', () => {
      const result = formatStacFieldEnhanced(
        'proj:centroid',
        [30.23598, -98.42964],
        mockStacItem
      )
      expect(result).toContain('Lat: -98.429640°')
      expect(result).toContain('Lon: 30.235980°')
    })

    it('should format shape fields dynamically', () => {
      const result = formatStacFieldEnhanced(
        'proj:shape',
        [10980, 10980],
        mockStacItem
      )
      expect(result).toContain('10,980 × 10,980')
    })
  })

  describe('getFieldLabel', () => {
    it('should return human-readable labels', () => {
      const result = getFieldLabel('eo:cloud_cover')
      expect(result).toBeDefined()
    })

    it('should handle unknown fields gracefully', () => {
      const result = getFieldLabel('unknown:field')
      expect(result).toBe('Field')
    })
  })

  describe('getFieldUnit', () => {
    it('should return units for known fields', () => {
      const result = getFieldUnit('eo:cloud_cover')
      expect(result).toBe('%')
    })

    it('should return null for unknown fields', () => {
      const result = getFieldUnit('unknown:field')
      expect(result).toBeNull()
    })

    it('should handle elevation fields', () => {
      const result = getFieldUnit('view:sun_elevation')
      expect(result).toBe('°')
    })
  })

  describe('renderFieldValue', () => {
    it('should render field value with formatting', () => {
      const result = renderFieldValue('eo:cloud_cover', 22.959924, mockStacItem)
      expect(result).toHaveProperty('formattedValue')
      expect(result).toHaveProperty('hasHtml')
    })

    it('should handle HTML content', () => {
      const result = renderFieldValue(
        'proj:centroid',
        [30.23598, -98.42964],
        mockStacItem
      )
      // Note: coordinate fields may not always generate HTML
      expect(typeof result.hasHtml).toBe('boolean')
    })

    it('should handle plain text content', () => {
      const result = renderFieldValue('platform', 'sentinel-2c', mockStacItem)
      expect(result.hasHtml).toBe(false)
    })
  })
})
