import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useUrlStateSync } from './useUrlStateSync'

import { deserializeQueryableFiltersFromURL } from '../utils/urlParamHelper'

import { showApplicationAlert } from '../utils/alertHelper'

// Import action types for assertion matching
import {
  setSelectedCollection,
  setSelectedVisualization,
  settabSelected,
  setSearchDateRangeValue,
  setViewMode,
  setQueryableFilters
} from '../redux/slices/mainSlice'

// Mock TanStack Router
let mockSearch = {}
vi.mock('@tanstack/react-router', () => ({
  useSearch: () => mockSearch,
  createRootRoute: vi.fn(() => ({ addChildren: vi.fn(() => ({})) })),
  createRoute: vi.fn(() => ({})),
  createRouter: vi.fn(() => ({}))
}))

vi.mock('../utils/alertHelper', () => ({
  showApplicationAlert: vi.fn()
}))

// Mock Redux
const mockDispatch = vi.fn()
const mockCollectionData = {
  queryables: {
    'eo:cloud_cover': { type: 'number', minimum: 0, maximum: 100 }
  }
}
const mockCollectionsData = [
  { id: 'sentinel-2', title: 'Sentinel-2' },
  { id: 'landsat-8', title: 'Landsat 8' }
]
vi.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector) =>
    selector({
      mainSlice: {
        selectedCollectionData: mockCollectionData,
        collectionsData: mockCollectionsData
      }
    })
}))

// Mock useUrlInitialize to control initialization refs
const mockIsInitialized = { current: true }
const mockPrevSearch = { current: null }
const mockFetchAndDisplayItem = vi.fn()
const mockClearItemSelection = vi.fn()

vi.mock('./useUrlInitialize', () => ({
  useUrlInitialize: () => ({
    isInitialized: mockIsInitialized,
    prevSearch: mockPrevSearch,
    fetchAndDisplayItem: mockFetchAndDisplayItem,
    clearItemSelection: mockClearItemSelection
  })
}))

vi.mock('../utils/urlParamHelper', () => ({
  deserializeQueryableFiltersFromURL: vi.fn(() => ({
    'eo:cloud_cover': { min: 0, max: 50 }
  }))
}))

const baseSearch = {
  col: 'sentinel-2',
  dt: '2024-01-01/2024-06-30',
  view: 'scene',
  viz: 'true-color',
  item: '',
  tab: 'search',
  z: 10,
  c: '40,-100'
}

describe('useUrlStateSync — Phase 2 ongoing sync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsInitialized.current = true
    mockPrevSearch.current = { ...baseSearch }
    mockSearch = { ...baseSearch }
  })

  it('does not dispatch when not yet initialized', () => {
    mockIsInitialized.current = false
    mockSearch = { ...baseSearch, tab: 'details' }

    renderHook(() => useUrlStateSync())

    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('does not dispatch when prevSearch is null', () => {
    mockPrevSearch.current = null
    mockSearch = { ...baseSearch, tab: 'details' }

    renderHook(() => useUrlStateSync())

    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('does not dispatch when search is unchanged', () => {
    renderHook(() => useUrlStateSync())

    expect(mockDispatch).not.toHaveBeenCalled()
  })

  describe('tab sync', () => {
    it('dispatches settabSelected when tab changes', () => {
      mockSearch = { ...baseSearch, tab: 'details' }

      renderHook(() => useUrlStateSync())

      expect(mockDispatch).toHaveBeenCalledWith(settabSelected('details'))
    })

    it('dispatches default "search" when tab is cleared', () => {
      mockPrevSearch.current = { ...baseSearch, tab: 'details' }
      mockSearch = { ...baseSearch, tab: '' }

      renderHook(() => useUrlStateSync())

      expect(mockDispatch).toHaveBeenCalledWith(settabSelected('search'))
    })
  })

  describe('viz sync', () => {
    it('dispatches setSelectedVisualization when viz changes', () => {
      mockSearch = { ...baseSearch, viz: 'false-color' }

      renderHook(() => useUrlStateSync())

      expect(mockDispatch).toHaveBeenCalledWith(
        setSelectedVisualization('false-color')
      )
    })

    it('dispatches null when viz is cleared', () => {
      mockSearch = { ...baseSearch, viz: '' }

      renderHook(() => useUrlStateSync())

      expect(mockDispatch).toHaveBeenCalledWith(setSelectedVisualization(null))
    })
  })

  describe('view sync', () => {
    it('dispatches setViewMode when view changes', () => {
      mockSearch = { ...baseSearch, view: 'hex' }

      renderHook(() => useUrlStateSync())

      expect(mockDispatch).toHaveBeenCalledWith(setViewMode('hex'))
    })

    it('dispatches default "scene" when view is cleared', () => {
      mockSearch = { ...baseSearch, view: '' }

      renderHook(() => useUrlStateSync())

      expect(mockDispatch).toHaveBeenCalledWith(setViewMode('scene'))
    })
  })

  describe('col sync', () => {
    it('dispatches setSelectedCollection when col changes', () => {
      mockSearch = { ...baseSearch, col: 'landsat-8' }

      renderHook(() => useUrlStateSync())

      expect(mockDispatch).toHaveBeenCalledWith(
        setSelectedCollection('landsat-8')
      )
    })

    it('does NOT dispatch when col is cleared (requireTruthy)', () => {
      mockSearch = { ...baseSearch, col: '' }

      renderHook(() => useUrlStateSync())

      // Should not have a setSelectedCollection dispatch with empty string
      const colDispatches = mockDispatch.mock.calls.filter(
        (call) => call[0]?.type === setSelectedCollection('').type
      )
      expect(colDispatches).toHaveLength(0)
    })

    it('shows warning alert and skips dispatch for invalid collection', () => {
      mockSearch = { ...baseSearch, col: 'nonexistent-collection' }

      renderHook(() => useUrlStateSync())

      expect(showApplicationAlert).toHaveBeenCalledWith(
        'warning',
        expect.stringContaining('nonexistent-collection')
      )
      // Should not have dispatched setSelectedCollection
      const colDispatches = mockDispatch.mock.calls.filter(
        (call) => call[0]?.type === setSelectedCollection('').type
      )
      expect(colDispatches).toHaveLength(0)
    })
  })

  describe('dt sync', () => {
    it('dispatches setSearchDateRangeValue with parsed parts', () => {
      mockSearch = { ...baseSearch, dt: '2025-01-01/2025-12-31' }

      renderHook(() => useUrlStateSync())

      expect(mockDispatch).toHaveBeenCalledWith(
        setSearchDateRangeValue(['2025-01-01', '2025-12-31'])
      )
    })

    it('does NOT dispatch when dt is cleared (requireTruthy)', () => {
      mockSearch = { ...baseSearch, dt: '' }

      renderHook(() => useUrlStateSync())

      const dtDispatches = mockDispatch.mock.calls.filter(
        (call) => call[0]?.type === setSearchDateRangeValue([]).type
      )
      expect(dtDispatches).toHaveLength(0)
    })

    it('does NOT dispatch when dt has invalid format', () => {
      mockSearch = { ...baseSearch, dt: 'invalid-date' }

      renderHook(() => useUrlStateSync())

      // transform returns null for invalid format, so no dispatch
      const dtDispatches = mockDispatch.mock.calls.filter(
        (call) => call[0]?.type === setSearchDateRangeValue([]).type
      )
      expect(dtDispatches).toHaveLength(0)
    })
  })

  describe('queryable filters sync', () => {
    it('dispatches setQueryableFilters when filter params change', () => {
      mockPrevSearch.current = { ...baseSearch }
      mockSearch = {
        ...baseSearch,
        'eo:cloud_cover_min': '0',
        'eo:cloud_cover_max': '50'
      }

      renderHook(() => useUrlStateSync())

      expect(deserializeQueryableFiltersFromURL).toHaveBeenCalled()
      expect(mockDispatch).toHaveBeenCalledWith(
        setQueryableFilters({ 'eo:cloud_cover': { min: 0, max: 50 } })
      )
    })

    it('does not dispatch when filter params are unchanged', () => {
      // Both prev and current have the same filter params
      mockPrevSearch.current = { ...baseSearch, 'eo:cloud_cover_min': '0' }
      mockSearch = { ...baseSearch, 'eo:cloud_cover_min': '0' }

      renderHook(() => useUrlStateSync())

      expect(deserializeQueryableFiltersFromURL).not.toHaveBeenCalled()
    })
  })

  describe('item sync', () => {
    it('calls fetchAndDisplayItem when item is set', () => {
      mockSearch = { ...baseSearch, item: 'SCENE-123' }

      renderHook(() => useUrlStateSync())

      expect(mockFetchAndDisplayItem).toHaveBeenCalledWith(
        'sentinel-2',
        'SCENE-123'
      )
    })

    it('uses previous col when current col is empty', () => {
      mockPrevSearch.current = { ...baseSearch, col: 'sentinel-2' }
      mockSearch = { ...baseSearch, col: '', item: 'SCENE-123' }

      renderHook(() => useUrlStateSync())

      expect(mockFetchAndDisplayItem).toHaveBeenCalledWith(
        'sentinel-2',
        'SCENE-123'
      )
    })

    it('calls clearItemSelection when item is cleared', () => {
      mockPrevSearch.current = { ...baseSearch, item: 'SCENE-123' }
      mockSearch = { ...baseSearch, item: '' }

      renderHook(() => useUrlStateSync())

      expect(mockClearItemSelection).toHaveBeenCalled()
    })

    it('does not call either when item is unchanged', () => {
      mockPrevSearch.current = { ...baseSearch, item: 'SCENE-123' }
      mockSearch = { ...baseSearch, item: 'SCENE-123' }

      renderHook(() => useUrlStateSync())

      expect(mockFetchAndDisplayItem).not.toHaveBeenCalled()
      expect(mockClearItemSelection).not.toHaveBeenCalled()
    })
  })

  describe('updates prevSearch ref', () => {
    it('sets prevSearch to current search after processing', () => {
      const newSearch = { ...baseSearch, tab: 'details' }
      mockSearch = newSearch

      renderHook(() => useUrlStateSync())

      expect(mockPrevSearch.current).toBe(newSearch)
    })
  })
})
