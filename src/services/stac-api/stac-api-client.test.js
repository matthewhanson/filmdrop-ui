import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getRootCatalog,
  getCollections,
  getCollection,
  supportsConformance,
  getConformance,
  checkConformance,
  STAC_API_CORE,
  STAC_API_EXTENSIONS
} from './stac-api-client'

describe('STAC API Client', () => {
  const mockApiUrl = 'https://example.com/stac/v1'

  beforeEach(() => {
    global.fetch = vi.fn()
  })

  describe('getRootCatalog', () => {
    it('should fetch the root catalog successfully', async () => {
      const mockCatalog = {
        type: 'Catalog',
        id: 'example-catalog',
        description: 'Example STAC Catalog'
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCatalog
      })

      const result = await getRootCatalog(mockApiUrl)

      expect(global.fetch).toHaveBeenCalledWith(mockApiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      expect(result).toEqual(mockCatalog)
    })

    it('should throw error when API URL is not provided', async () => {
      await expect(getRootCatalog()).rejects.toThrow('STAC API URL is required')
    })

    it('should throw error when fetch fails', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: {
          get: () => null
        }
      })

      const error = await getRootCatalog(mockApiUrl).catch((e) => e)
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toBe('Server responded with an error')
      expect(error.status).toBe(404)
      expect(error.statusText).toBe('Not Found')
    })

    it('should support custom headers', async () => {
      const mockCatalog = {
        type: 'Catalog',
        id: 'test-catalog'
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCatalog
      })

      await getRootCatalog(mockApiUrl, {
        headers: { Authorization: 'Bearer test-token' }
      })

      expect(global.fetch).toHaveBeenCalledWith(mockApiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token'
        }
      })
    })

    it('should support custom credentials', async () => {
      const mockCatalog = {
        type: 'Catalog',
        id: 'test-catalog'
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCatalog
      })

      await getRootCatalog(mockApiUrl, {
        credentials: 'include'
      })

      expect(global.fetch).toHaveBeenCalledWith(mockApiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })
    })
  })

  describe('getCollections', () => {
    it('should fetch collections successfully', async () => {
      const mockCollections = {
        collections: [
          { id: 'collection-1', type: 'Collection' },
          { id: 'collection-2', type: 'Collection' }
        ]
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCollections
      })

      const result = await getCollections(mockApiUrl)

      expect(global.fetch).toHaveBeenCalledWith(`${mockApiUrl}/collections`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      expect(result).toEqual(mockCollections)
    })

    it('should handle trailing slash in API URL', async () => {
      const mockCollections = { collections: [] }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCollections
      })

      await getCollections(`${mockApiUrl}/`)

      expect(global.fetch).toHaveBeenCalledWith(`${mockApiUrl}/collections`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
    })

    it('should throw error when API URL is not provided', async () => {
      await expect(getCollections()).rejects.toThrow('STAC API URL is required')
    })

    it('should throw error when fetch fails', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: {
          get: () => null
        }
      })

      const error = await getCollections(mockApiUrl).catch((e) => e)
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toBe('Server responded with an error')
      expect(error.status).toBe(500)
      expect(error.statusText).toBe('Internal Server Error')
    })
  })

  describe('getCollection', () => {
    it('should fetch a single collection successfully', async () => {
      const mockCollection = {
        id: 'sentinel-2-l2a',
        type: 'Collection',
        title: 'Sentinel-2 L2A'
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCollection
      })

      const result = await getCollection(mockApiUrl, 'sentinel-2-l2a')

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockApiUrl}/collections/sentinel-2-l2a`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
      expect(result).toEqual(mockCollection)
    })

    it('should throw error when API URL is not provided', async () => {
      await expect(getCollection(null, 'collection-1')).rejects.toThrow(
        'STAC API URL is required'
      )
    })

    it('should throw error when collection ID is not provided', async () => {
      await expect(getCollection(mockApiUrl, null)).rejects.toThrow(
        'Collection ID is required'
      )
    })

    it('should throw error when fetch fails', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: {
          get: () => null
        }
      })

      const error = await getCollection(mockApiUrl, 'non-existent').catch(
        (e) => e
      )
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toBe('Server responded with an error')
      expect(error.status).toBe(404)
      expect(error.statusText).toBe('Not Found')
    })
  })

  describe('supportsConformance', () => {
    it('should return true when API supports the conformance class', async () => {
      const mockCatalog = {
        type: 'Catalog',
        id: 'test-catalog',
        conformsTo: [
          'https://api.stacspec.org/v1.0.0/core',
          'https://api.stacspec.org/v1.0.0/item-search',
          'https://api.stacspec.org/v1.0.0/collections'
        ]
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCatalog
      })

      const result = await supportsConformance(
        mockApiUrl,
        'https://api.stacspec.org/v1.0.0/item-search'
      )

      expect(result).toBe(true)
    })

    it('should return false when API does not support the conformance class', async () => {
      const mockCatalog = {
        type: 'Catalog',
        id: 'test-catalog',
        conformsTo: [
          'https://api.stacspec.org/v1.0.0/core',
          'https://api.stacspec.org/v1.0.0/collections'
        ]
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCatalog
      })

      const result = await supportsConformance(
        mockApiUrl,
        'https://api.stacspec.org/v1.0.0/item-search'
      )

      expect(result).toBe(false)
    })

    it('should return false when conformsTo is missing', async () => {
      const mockCatalog = {
        type: 'Catalog',
        id: 'test-catalog'
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCatalog
      })

      const result = await supportsConformance(
        mockApiUrl,
        'https://api.stacspec.org/v1.0.0/core'
      )

      expect(result).toBe(false)
    })

    it('should return false when conformsTo is not an array', async () => {
      const mockCatalog = {
        type: 'Catalog',
        id: 'test-catalog',
        conformsTo: 'https://api.stacspec.org/v1.0.0/core'
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCatalog
      })

      const result = await supportsConformance(
        mockApiUrl,
        'https://api.stacspec.org/v1.0.0/core'
      )

      expect(result).toBe(false)
    })

    it('should throw error when API URL is not provided', async () => {
      await expect(
        supportsConformance(null, 'https://api.stacspec.org/v1.0.0/core')
      ).rejects.toThrow('STAC API URL is required')
    })

    it('should throw error when conformance URI is not provided', async () => {
      await expect(supportsConformance(mockApiUrl, null)).rejects.toThrow(
        'Conformance URI is required'
      )
    })

    it('should throw error when root catalog fetch fails', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: {
          get: () => null
        }
      })

      const error = await supportsConformance(
        mockApiUrl,
        'https://api.stacspec.org/v1.0.0/core'
      ).catch((e) => e)
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toBe('Server responded with an error')
      expect(error.status).toBe(500)
      expect(error.statusText).toBe('Internal Server Error')
    })

    it('should work with conformance constants', async () => {
      const mockCatalog = {
        type: 'Catalog',
        id: 'test-catalog',
        conformsTo: [
          'https://api.stacspec.org/v1.0.0/core',
          'https://api.stacspec.org/v1.0.0/item-search'
        ]
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCatalog
      })

      const result = await supportsConformance(
        mockApiUrl,
        STAC_API_CORE.ITEM_SEARCH
      )
      expect(result).toBe(true)
    })
  })

  describe('getConformance', () => {
    it('should return all conformance classes', async () => {
      const mockCatalog = {
        type: 'Catalog',
        id: 'test-catalog',
        conformsTo: [
          'https://api.stacspec.org/v1.0.0/core',
          'https://api.stacspec.org/v1.0.0/item-search',
          'https://api.stacspec.org/v1.0.0/collections'
        ]
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCatalog
      })

      const result = await getConformance(mockApiUrl)

      expect(result).toEqual([
        'https://api.stacspec.org/v1.0.0/core',
        'https://api.stacspec.org/v1.0.0/item-search',
        'https://api.stacspec.org/v1.0.0/collections'
      ])
    })

    it('should return empty array when conformsTo is missing', async () => {
      const mockCatalog = {
        type: 'Catalog',
        id: 'test-catalog'
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCatalog
      })

      const result = await getConformance(mockApiUrl)
      expect(result).toEqual([])
    })

    it('should return empty array when conformsTo is not an array', async () => {
      const mockCatalog = {
        type: 'Catalog',
        id: 'test-catalog',
        conformsTo: 'https://api.stacspec.org/v1.0.0/core'
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCatalog
      })

      const result = await getConformance(mockApiUrl)
      expect(result).toEqual([])
    })

    it('should throw error when API URL is not provided', async () => {
      await expect(getConformance(null)).rejects.toThrow(
        'STAC API URL is required'
      )
    })
  })

  describe('checkConformance', () => {
    it('should check multiple conformance classes', async () => {
      const mockCatalog = {
        type: 'Catalog',
        id: 'test-catalog',
        conformsTo: [
          STAC_API_CORE.CORE,
          STAC_API_CORE.ITEM_SEARCH,
          STAC_API_EXTENSIONS.QUERY
        ]
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCatalog
      })

      const result = await checkConformance(mockApiUrl, [
        STAC_API_CORE.CORE,
        STAC_API_CORE.ITEM_SEARCH,
        STAC_API_CORE.COLLECTIONS,
        STAC_API_EXTENSIONS.QUERY,
        STAC_API_EXTENSIONS.AGGREGATION
      ])

      expect(result).toEqual({
        [STAC_API_CORE.CORE]: true,
        [STAC_API_CORE.ITEM_SEARCH]: true,
        [STAC_API_CORE.COLLECTIONS]: false,
        [STAC_API_EXTENSIONS.QUERY]: true,
        [STAC_API_EXTENSIONS.AGGREGATION]: false
      })
    })

    it('should return all false when no conformance is supported', async () => {
      const mockCatalog = {
        type: 'Catalog',
        id: 'test-catalog',
        conformsTo: []
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCatalog
      })

      const result = await checkConformance(mockApiUrl, [
        STAC_API_CORE.ITEM_SEARCH,
        STAC_API_EXTENSIONS.QUERY
      ])

      expect(result).toEqual({
        [STAC_API_CORE.ITEM_SEARCH]: false,
        [STAC_API_EXTENSIONS.QUERY]: false
      })
    })

    it('should throw error when API URL is not provided', async () => {
      await expect(
        checkConformance(null, [STAC_API_CORE.CORE])
      ).rejects.toThrow('STAC API URL is required')
    })
  })
})
