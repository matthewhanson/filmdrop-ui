import {
  groupPropertiesByExtension,
  getFieldLabel,
  isFieldSupported
} from './defaultFieldGrouping.js'

describe('Default Field Grouping', () => {
  const mockProperties = {
    // Core fields
    id: 'S2A_MSIL2A_20230101T000000_N0509_R030_T14QPA_20230101T000000',
    datetime: '2023-01-01T00:00:00Z',
    platform: 'sentinel-2a',
    instruments: ['MSI'],
    title: 'Sentinel-2 L2A',

    // Projection fields
    'proj:epsg': 32614,
    'proj:centroid': [-93.5, 45.2],
    'proj:shape': [10980, 10980],

    // Earth Observation fields
    'eo:cloud_cover': 0.15,
    'eo:sun_elevation': 45.2,
    'eo:sun_azimuth': 180.5,

    // MGRS fields
    'mgrs:utm_zone': 14,
    'mgrs:latitude_band': 'R',
    'mgrs:grid_square': 'NU',

    // Landsat fields
    'landsat:correction': 'L2',
    'landsat:collection_category': 'T1',

    // Custom fields
    'ursa:special_property': 'custom_value',
    'custom:unknown_field': 'unknown_value'
  }

  test('groups properties by extension', () => {
    const groups = groupPropertiesByExtension(mockProperties)

    expect(groups).toHaveLength(7) // Core, Projection, Earth Observation, MGRS, Landsat, Custom

    // Check Core Fields group
    const coreGroup = groups.find((g) => g.name === 'Core Fields')
    expect(coreGroup).toBeDefined()
    expect(coreGroup.fields).toHaveLength(5)
    expect(coreGroup.fields.map((f) => f.name)).toContain('id')
    expect(coreGroup.fields.map((f) => f.name)).toContain('datetime')
    expect(coreGroup.fields.map((f) => f.name)).toContain('platform')

    // Check Projection group
    const projGroup = groups.find((g) => g.name === 'Proj')
    expect(projGroup).toBeDefined()
    expect(projGroup.fields).toHaveLength(3)
    expect(projGroup.fields.map((f) => f.name)).toContain('proj:epsg')
    expect(projGroup.fields.map((f) => f.name)).toContain('proj:centroid')

    // Check Earth Observation group
    const eoGroup = groups.find((g) => g.name === 'Eo')
    expect(eoGroup).toBeDefined()
    expect(eoGroup.fields).toHaveLength(3)
    expect(eoGroup.fields.map((f) => f.name)).toContain('eo:cloud_cover')

    // Check Landsat group
    const landsatGroup = groups.find((g) => g.name === 'Landsat')
    expect(landsatGroup).toBeDefined()
    expect(landsatGroup.fields).toHaveLength(2)
    expect(landsatGroup.fields.map((f) => f.name)).toContain(
      'landsat:correction'
    )
  })

  test('orders groups correctly', () => {
    const groups = groupPropertiesByExtension(mockProperties)

    const groupNames = groups.map((g) => g.name)
    expect(groupNames[0]).toBe('Core Fields')
    expect(groupNames[1]).toBe('Proj')
    expect(groupNames[2]).toBe('Eo')
  })

  test('orders fields within groups correctly', () => {
    const groups = groupPropertiesByExtension(mockProperties)

    const coreGroup = groups.find((g) => g.name === 'Core Fields')
    const fieldNames = coreGroup.fields.map((f) => f.name)

    // Core fields should be ordered by stac-fields registry order
    expect(fieldNames[0]).toBe('id')
    expect(fieldNames[1]).toBe('datetime')
    expect(fieldNames[2]).toBe('title')
  })

  test('identifies custom properties', () => {
    const groups = groupPropertiesByExtension(mockProperties)

    // Should have a custom group
    const customGroup = groups.find((g) => g.isCustom)
    expect(customGroup).toBeDefined()
    expect(customGroup.fields.map((f) => f.name)).toContain(
      'ursa:special_property'
    )
  })

  test('getFieldLabel returns correct labels', () => {
    // Test stac-fields label
    expect(getFieldLabel('proj:epsg')).toBe('EPSG Code')

    // Test fallback label
    expect(getFieldLabel('custom:unknown_field')).toBe('Custom Unknown Field')
    expect(getFieldLabel('ursa:special_property')).toBe('Ursa Special Property')
  })

  test('isFieldSupported works correctly', () => {
    expect(isFieldSupported('proj:epsg')).toBe(true)
    expect(isFieldSupported('datetime')).toBe(true)
    expect(isFieldSupported('custom:unknown_field')).toBe(false)
    expect(isFieldSupported('ursa:special_property')).toBe(false)
  })
})
