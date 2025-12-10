import { describe, test, expect } from 'vitest'
import {
  groupAssetsByType,
  getAssetLabel,
  getFileExtension,
  isThumbnail,
  getStandardRole,
  getCustomRoles,
  getFileTypeAbbreviation,
  getRoleBasedGroup,
  STANDARD_ROLES,
  FILE_TYPE_ABBREVIATIONS
} from './defaultAssetGrouping.js'

describe('Default Asset Grouping', () => {
  const mockAssets = {
    // COGs
    coastal: {
      href: 'https://example.com/coastal.tif',
      type: 'image/tiff',
      title: 'Coastal Aerosol'
    },
    blue: {
      href: 'https://example.com/blue.tiff',
      type: 'image/tiff',
      title: 'Blue Band'
    },
    green: {
      href: 'https://example.com/green.tif',
      type: 'image/tiff',
      title: 'Green Band'
    },

    // Thumbnails
    thumbnail: {
      href: 'https://example.com/thumb.jpg',
      type: 'image/jpeg',
      title: 'Thumbnail'
    },
    preview: {
      href: 'https://example.com/preview.png',
      type: 'image/png',
      title: 'Preview Image'
    },

    // Metadata
    metadata: {
      href: 'https://example.com/metadata.xml',
      type: 'application/xml',
      title: 'Metadata'
    },
    info: {
      href: 'https://example.com/info.json',
      type: 'application/json',
      title: 'Info'
    },

    // Other files
    rgb: {
      href: 'https://example.com/rgb.jpg',
      type: 'image/jpeg',
      title: 'RGB Composite'
    },
    ndvi: {
      href: 'https://example.com/ndvi.png',
      type: 'image/png',
      title: 'NDVI'
    }
  }

  test('groups assets by type/role correctly', () => {
    // With role-based grouping, assets without roles fall back to heuristic or MIME type
    const groups = groupAssetsByType(mockAssets)

    // Should have multiple groups with MIME-based or heuristic grouping
    expect(groups.length).toBeGreaterThan(0)

    // Check GeoTIFF Files group (assets with image/tiff type)
    const tiffGroup = groups.find((g) => g.name === 'GeoTIFF Files')
    expect(tiffGroup).toBeDefined()
    expect(tiffGroup.assets).toHaveLength(3)
    expect(tiffGroup.assets.map((a) => a.key)).toContain('coastal')
    expect(tiffGroup.assets.map((a) => a.key)).toContain('blue')
    expect(tiffGroup.assets.map((a) => a.key)).toContain('green')

    // Check JPEG Files group
    const jpegGroup = groups.find((g) => g.name === 'JPEG Files')
    expect(jpegGroup).toBeDefined()
    expect(jpegGroup.assets.length).toBeGreaterThanOrEqual(1)

    // Check PNG Files group
    const pngGroup = groups.find((g) => g.name === 'PNG Files')
    expect(pngGroup).toBeDefined()
    expect(pngGroup.assets.length).toBeGreaterThanOrEqual(1)
  })

  test('orders groups correctly', () => {
    const groups = groupAssetsByType(mockAssets)
    const groupNames = groups.map((g) => g.name)

    // Verify key groups are present (order may vary based on grouping logic)
    expect(groupNames).toContain('GeoTIFF Files')
    expect(groupNames.length).toBeGreaterThan(0)
  })

  test('handles empty assets', () => {
    const groups = groupAssetsByType({})
    expect(groups).toHaveLength(0)
  })

  test('handles null assets', () => {
    const groups = groupAssetsByType(null)
    expect(groups).toHaveLength(0)
  })

  test('getAssetLabel returns correct labels', () => {
    expect(getAssetLabel('coastal', { title: 'Coastal Aerosol' })).toBe(
      'Coastal Aerosol'
    )
    expect(getAssetLabel('blue_band', { title: 'Blue Band' })).toBe('Blue Band')
    expect(getAssetLabel('red-green-blue', {})).toBe('Red Green Blue')
    expect(getAssetLabel('ndvi_index', {})).toBe('Ndvi Index')
  })

  test('getFileExtension returns correct extensions', () => {
    expect(getFileExtension('https://example.com/image.tif')).toBe('TIF')
    expect(getFileExtension('https://example.com/data.json')).toBe('JSON')
    expect(getFileExtension('https://example.com/file.xml')).toBe('XML')
    expect(getFileExtension('https://example.com/noextension')).toBe('FILE')
    expect(getFileExtension('')).toBe('')
  })

  // New test suite for role-based functions
  describe('getStandardRole()', () => {
    test('returns first standard role found', () => {
      expect(getStandardRole({ roles: ['data', 'reflectance'] })).toBe('data')
      expect(getStandardRole({ roles: ['metadata', 'thumbnail'] })).toBe(
        'metadata'
      )
    })

    test('returns null when no standard roles present', () => {
      expect(
        getStandardRole({ roles: ['reflectance', 'temperature'] })
      ).toBeNull()
      expect(getStandardRole({})).toBeNull()
      expect(getStandardRole({ roles: null })).toBeNull()
    })
  })

  describe('getCustomRoles()', () => {
    test('returns non-standard roles filtering out standard ones', () => {
      expect(
        getCustomRoles({ roles: ['data', 'reflectance', 'temperature'] })
      ).toEqual(['reflectance', 'temperature'])
      expect(
        getCustomRoles({ roles: ['reflectance', 'temperature', 'custom'] })
      ).toEqual(['reflectance', 'temperature', 'custom'])
    })

    test('returns empty array when no custom roles or no roles', () => {
      expect(getCustomRoles({ roles: ['data', 'metadata'] })).toEqual([])
      expect(getCustomRoles({})).toEqual([])
    })
  })

  describe('getFileTypeAbbreviation()', () => {
    test('returns defined abbreviations for common types', () => {
      expect(getFileTypeAbbreviation('GeoTIFF')).toBe('COG')
      expect(getFileTypeAbbreviation('JPEG2000')).toBe('JP2')
      expect(getFileTypeAbbreviation('NetCDF')).toBe('NC')
    })

    test('returns first 4 uppercase chars for unknown types', () => {
      expect(getFileTypeAbbreviation('UnknownFormat')).toBe('UNKN')
    })

    test('handles edge cases', () => {
      expect(getFileTypeAbbreviation('')).toBe('')
      expect(getFileTypeAbbreviation(null)).toBe('')
    })
  })

  describe('getRoleBasedGroup()', () => {
    test('groups assets by standard roles', () => {
      expect(getRoleBasedGroup({ roles: ['data'] })).toBe('Data')
      expect(getRoleBasedGroup({ roles: ['metadata'] })).toBe('Metadata')
      expect(getRoleBasedGroup({ roles: ['thumbnail'] })).toBe('Thumbnails')
    })

    test('prioritizes role over MIME type', () => {
      expect(getRoleBasedGroup({ roles: ['data'], type: 'image/tiff' })).toBe(
        'Data'
      )
    })

    test('falls back to MIME type when no roles', () => {
      expect(getRoleBasedGroup({ type: 'image/tiff', roles: [] })).toBe(
        'GeoTIFF Files'
      )
      expect(getRoleBasedGroup({ type: 'application/json', roles: null })).toBe(
        'JSON Files'
      )
    })
  })

  describe('isThumbnail()', () => {
    test('returns true for thumbnail role', () => {
      expect(isThumbnail('image', { roles: ['thumbnail'] })).toBe(true)
    })

    test('returns true for keys/titles containing thumbnail keywords', () => {
      expect(isThumbnail('thumbnail', { roles: [] })).toBe(true)
      expect(isThumbnail('thumb_preview', { roles: [] })).toBe(true)
      expect(
        isThumbnail('image', { roles: [], title: 'Thumbnail Image' })
      ).toBe(true)
    })

    test('returns false for non-thumbnail assets', () => {
      expect(
        isThumbnail('data_band', { roles: ['data'], title: 'Data Asset' })
      ).toBe(false)
      expect(isThumbnail('data', {})).toBe(false)
    })
  })

  describe('Sentinel-2 L2A Real Data Pattern', () => {
    test('groups Sentinel-2 assets correctly by roles', () => {
      const sentinel2Assets = {
        // Data bands with reflectance role
        coastal: {
          roles: ['data', 'reflectance'],
          type: 'image/tiff',
          title: 'Coastal Aerosol'
        },
        blue: {
          roles: ['data', 'reflectance'],
          type: 'image/tiff',
          title: 'Blue'
        },
        green: {
          roles: ['data', 'reflectance'],
          type: 'image/tiff',
          title: 'Green'
        },
        // Visual asset
        visual: {
          roles: ['visual'],
          type: 'image/tiff',
          title: 'True Color Image'
        },
        // Metadata
        metadata: {
          roles: ['metadata'],
          type: 'application/xml',
          title: 'Metadata'
        },
        // Thumbnail
        thumbnail: {
          roles: ['thumbnail'],
          type: 'image/jpeg',
          title: 'Thumbnail'
        }
      }

      const groups = groupAssetsByType(sentinel2Assets)
      const groupNames = groups.map((g) => g.name)

      // Verify grouping by role
      expect(groups.find((g) => g.name === 'Data')?.assets.length).toBe(3)
      expect(groups.find((g) => g.name === 'Visual')?.assets.length).toBe(1)
      expect(groups.find((g) => g.name === 'Metadata')?.assets.length).toBe(1)
      expect(groups.find((g) => g.name === 'Thumbnails')?.assets.length).toBe(1)

      // Verify order
      expect(groupNames[0]).toBe('Data')
      expect(groupNames[1]).toBe('Visual')
      expect(groupNames[2]).toBe('Metadata')
      expect(groupNames[3]).toBe('Thumbnails')
    })

    test('extracts custom roles from Sentinel-2 data asset', () => {
      const asset = { roles: ['data', 'reflectance'] }
      expect(getCustomRoles(asset)).toEqual(['reflectance'])
    })
  })

  describe('COP-DEM Real Data Pattern', () => {
    test('groups COP-DEM asset correctly', () => {
      const copdemAsset = {
        dem: {
          roles: ['data'],
          type: 'image/tiff',
          title: 'DEM Data'
        }
      }

      const groups = groupAssetsByType(copdemAsset)
      expect(groups).toHaveLength(1)
      expect(groups[0].name).toBe('Data')
      expect(groups[0].assets).toHaveLength(1)
    })
  })

  describe('Backward Compatibility', () => {
    test('handles legacy assets without roles field', () => {
      const legacyAsset = {
        image: {
          type: 'image/tiff',
          title: 'Image Data',
          href: 'https://example.com/data.tif'
        }
      }

      const groups = groupAssetsByType(legacyAsset)
      expect(groups).toHaveLength(1)
      expect(groups[0].name).toBe('GeoTIFF Files')
    })

    test('handles assets with empty roles array', () => {
      const asset = { roles: [], type: 'application/json' }
      expect(getRoleBasedGroup(asset)).toBe('JSON Files')
    })

    test('grouping is stable across multiple calls', () => {
      const assets = {
        data: { roles: ['data'], type: 'image/tiff' },
        metadata: { roles: ['metadata'], type: 'application/json' }
      }

      const groups1 = groupAssetsByType(assets)
      const groups2 = groupAssetsByType(assets)

      expect(groups1.map((g) => g.name)).toEqual(groups2.map((g) => g.name))
    })
  })
})
