import { describe, test, expect } from 'vitest'
import {
  groupAssetsByType,
  getAssetLabel,
  getFileExtension
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

  test('groups assets by type correctly', () => {
    const groups = groupAssetsByType(mockAssets)

    expect(groups).toHaveLength(5)

    // Check COGs group
    const cogsGroup = groups.find((g) => g.name === 'COGs')
    expect(cogsGroup).toBeDefined()
    expect(cogsGroup.assets).toHaveLength(3)
    expect(cogsGroup.assets.map((a) => a.key)).toContain('coastal')
    expect(cogsGroup.assets.map((a) => a.key)).toContain('blue')
    expect(cogsGroup.assets.map((a) => a.key)).toContain('green')

    // Check Thumbnails group
    const thumbnailsGroup = groups.find((g) => g.name === 'Thumbnails')
    expect(thumbnailsGroup).toBeDefined()
    expect(thumbnailsGroup.assets).toHaveLength(2)
    expect(thumbnailsGroup.assets.map((a) => a.key)).toContain('thumbnail')
    expect(thumbnailsGroup.assets.map((a) => a.key)).toContain('preview')

    // Check Metadata group
    const metadataGroup = groups.find((g) => g.name === 'Metadata')
    expect(metadataGroup).toBeDefined()
    expect(metadataGroup.assets).toHaveLength(2)
    expect(metadataGroup.assets.map((a) => a.key)).toContain('metadata')
    expect(metadataGroup.assets.map((a) => a.key)).toContain('info')

    // Check JPEG Files group
    const jpegGroup = groups.find((g) => g.name === 'JPEG Files')
    expect(jpegGroup).toBeDefined()
    expect(jpegGroup.assets).toHaveLength(1)
    expect(jpegGroup.assets.map((a) => a.key)).toContain('rgb')

    // Check PNG Files group
    const pngGroup = groups.find((g) => g.name === 'PNG Files')
    expect(pngGroup).toBeDefined()
    expect(pngGroup.assets).toHaveLength(1)
    expect(pngGroup.assets.map((a) => a.key)).toContain('ndvi')
  })

  test('orders groups correctly', () => {
    const groups = groupAssetsByType(mockAssets)
    const groupNames = groups.map((g) => g.name)

    expect(groupNames[0]).toBe('COGs')
    expect(groupNames[1]).toBe('JPEG Files')
    expect(groupNames[2]).toBe('PNG Files')
    expect(groupNames[3]).toBe('Metadata')
    expect(groupNames[4]).toBe('Thumbnails')
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
})
