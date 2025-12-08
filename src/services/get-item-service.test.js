import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { GetItemService } from './get-item-service'
import { store } from '../redux/store'
import { setappConfig } from '../redux/slices/mainSlice'
import * as authHelper from '../utils/authHelper'

// Mock modules
vi.mock('../utils/authHelper', () => ({
  logoutUser: vi.fn()
}))

// Mock fetch globally
global.fetch = vi.fn()

describe('GetItemService', () => {
  const mockStacApiUrl = 'https://stac-api.example.com'
  const mockCollectionId = 'sentinel-2-l2a'
  const mockItemId = 'S2A_17SNB_20230617_0_L2A'
  const mockItemResponse = {
    type: 'Feature',
    id: mockItemId,
    collection: mockCollectionId,
    geometry: { type: 'Polygon', coordinates: [[[]]] },
    properties: { datetime: '2023-06-17T00:00:00Z' }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Setup default app config
    store.dispatch(
      setappConfig({
        STAC_API_URL: mockStacApiUrl,
        APP_TOKEN_AUTH_ENABLED: false,
        FETCH_CREDENTIALS: 'same-origin'
      })
    )
    // Clear localStorage
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('URL construction', () => {
    it('constructs correct STAC API endpoint URL', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockItemResponse
      })

      await GetItemService(mockCollectionId, mockItemId)

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockStacApiUrl}/collections/${mockCollectionId}/items/${mockItemId}`,
        expect.any(Object)
      )
    })

    it('handles item IDs with special characters in URL path', async () => {
      const specialItemId = 'S2A:17SNB/20230617'
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockItemResponse
      })

      await GetItemService(mockCollectionId, specialItemId)

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockStacApiUrl}/collections/${mockCollectionId}/items/${specialItemId}`,
        expect.any(Object)
      )
    })
  })

  describe('authentication headers', () => {
    it('includes Authorization header when auth is enabled and token exists', async () => {
      const mockToken = 'mock-jwt-token'
      localStorage.setItem('APP_AUTH_TOKEN', mockToken)
      store.dispatch(
        setappConfig({
          STAC_API_URL: mockStacApiUrl,
          APP_TOKEN_AUTH_ENABLED: true,
          FETCH_CREDENTIALS: 'same-origin'
        })
      )

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockItemResponse
      })

      await GetItemService(mockCollectionId, mockItemId)

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.any(Headers)
        })
      )

      const callArgs = global.fetch.mock.calls[0][1]
      const authHeader = callArgs.headers.get('Authorization')
      expect(authHeader).toBe(`Bearer ${mockToken}`)
    })

    it('does not include Authorization header when auth is disabled', async () => {
      localStorage.setItem('APP_AUTH_TOKEN', 'mock-token')
      store.dispatch(
        setappConfig({
          STAC_API_URL: mockStacApiUrl,
          APP_TOKEN_AUTH_ENABLED: false,
          FETCH_CREDENTIALS: 'same-origin'
        })
      )

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockItemResponse
      })

      await GetItemService(mockCollectionId, mockItemId)

      const callArgs = global.fetch.mock.calls[0][1]
      const authHeader = callArgs.headers.get('Authorization')
      expect(authHeader).toBeNull()
    })

    it('does not include Authorization header when token does not exist', async () => {
      store.dispatch(
        setappConfig({
          STAC_API_URL: mockStacApiUrl,
          APP_TOKEN_AUTH_ENABLED: true,
          FETCH_CREDENTIALS: 'same-origin'
        })
      )

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockItemResponse
      })

      await GetItemService(mockCollectionId, mockItemId)

      const callArgs = global.fetch.mock.calls[0][1]
      const authHeader = callArgs.headers.get('Authorization')
      expect(authHeader).toBeNull()
    })
  })

  describe('credentials configuration', () => {
    it('uses FETCH_CREDENTIALS from config', async () => {
      store.dispatch(
        setappConfig({
          STAC_API_URL: mockStacApiUrl,
          APP_TOKEN_AUTH_ENABLED: false,
          FETCH_CREDENTIALS: 'include'
        })
      )

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockItemResponse
      })

      await GetItemService(mockCollectionId, mockItemId)

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          credentials: 'include'
        })
      )
    })

    it('defaults to same-origin when FETCH_CREDENTIALS not configured', async () => {
      store.dispatch(
        setappConfig({
          STAC_API_URL: mockStacApiUrl,
          APP_TOKEN_AUTH_ENABLED: false
        })
      )

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockItemResponse
      })

      await GetItemService(mockCollectionId, mockItemId)

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          credentials: 'same-origin'
        })
      )
    })
  })

  describe('success responses', () => {
    it('returns item GeoJSON on successful fetch', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockItemResponse
      })

      const result = await GetItemService(mockCollectionId, mockItemId)

      expect(result).toEqual(mockItemResponse)
      expect(result.error).toBeUndefined()
    })
  })

  describe('error responses', () => {
    it('returns error object with status on 404', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      })

      const result = await GetItemService(mockCollectionId, mockItemId)

      expect(result).toEqual({ error: true, status: 404 })
    })

    it('calls logoutUser on 403 response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 403
      })

      const result = await GetItemService(mockCollectionId, mockItemId)

      expect(authHelper.logoutUser).toHaveBeenCalledOnce()
      expect(result).toEqual({ error: true, status: 403 })
    })

    it('returns error object with status on 500', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      })

      const result = await GetItemService(mockCollectionId, mockItemId)

      expect(result).toEqual({ error: true, status: 500 })
      expect(authHelper.logoutUser).not.toHaveBeenCalled()
    })

    it('returns error object with null status on network failure', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await GetItemService(mockCollectionId, mockItemId)

      expect(result).toEqual({ error: true, status: null })
    })

    it('returns error object with null status on JSON parse failure', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON')
        }
      })

      const result = await GetItemService(mockCollectionId, mockItemId)

      expect(result).toEqual({ error: true, status: null })
    })
  })
})
