import React from 'react'
import { vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import VisualizationSelector from './VisualizationSelector'
import { Provider } from 'react-redux'
import { store } from '../../redux/store'
import {
  setappConfig,
  setSelectedCollectionData,
  setViewMode,
  setSelectedVisualization,
  setCurrentPopupResult
} from '../../redux/slices/mainSlice'
import { mockAppConfig, mockCollectionsData } from '../../testing/shared-mocks'
import userEvent from '@testing-library/user-event'
import { router } from '../../router'

// Mock router module
vi.mock('../../router', () => ({
  router: {
    navigate: vi.fn()
  }
}))

describe('VisualizationSelector', () => {
  const setup = () =>
    render(
      <Provider store={store}>
        <VisualizationSelector />
      </Provider>
    )

  beforeEach(() => {
    vi.clearAllMocks()
    const appConfigWithVisualizations = {
      ...mockAppConfig,
      SCENE_TILER_URL: 'https://example.com/titiler',
      COLLECTIONS_CONFIG: {
        'sentinel-2-l2a': {
          visualizations: {
            'true-color': {
              title: 'True Color',
              assets: ['red', 'green', 'blue']
            },
            'false-color': {
              title: 'False Color',
              assets: ['nir', 'red', 'green']
            },
            ndvi: {
              title: 'NDVI',
              assets: ['nir', 'red'],
              expression: '(nir-red)/(nir+red)'
            }
          }
        },
        'cop-dem-glo-30': {
          visualizations: {
            default: {
              assets: ['data']
            }
          }
        }
      }
    }
    store.dispatch(setappConfig(appConfigWithVisualizations))
    store.dispatch(setViewMode('scene'))
    const sentinelCollection = mockCollectionsData.find(
      (c) => c.id === 'sentinel-2-l2a'
    )
    store.dispatch(setSelectedCollectionData(sentinelCollection))
    store.dispatch(setSelectedVisualization(null))
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('conditional visibility', () => {
    it('should return null when viewMode is not scene', () => {
      store.dispatch(setViewMode('mosaic'))
      const { container } = setup()
      expect(container.firstChild).toBeNull()
    })

    it('should return null when SCENE_TILER_URL is not configured', () => {
      const appConfigWithoutTiler = {
        ...mockAppConfig,
        SCENE_TILER_URL: null
      }
      store.dispatch(setappConfig(appConfigWithoutTiler))
      const { container } = setup()
      expect(container.firstChild).toBeNull()
    })

    it('should return null when collection has 0 visualizations', () => {
      const appConfigWithoutVisualizations = {
        ...mockAppConfig,
        SCENE_TILER_URL: 'https://example.com/titiler',
        COLLECTIONS_CONFIG: {
          'sentinel-2-l2a': {
            visualizations: {}
          }
        }
      }
      store.dispatch(setappConfig(appConfigWithoutVisualizations))
      const { container } = setup()
      expect(container.firstChild).toBeNull()
    })

    it('should return null when collection has 1 visualization', () => {
      store.dispatch(setSelectedCollectionData(mockCollectionsData[0]))
      const { container } = setup()
      expect(container.firstChild).toBeNull()
    })

    it('should render when collection has multiple visualizations', () => {
      const sentinelCollection = mockCollectionsData.find(
        (c) => c.id === 'sentinel-2-l2a'
      )
      store.dispatch(setSelectedCollectionData(sentinelCollection))
      setup()
      expect(
        screen.getByRole('combobox', { name: /visualization/i })
      ).toBeInTheDocument()
    })
  })

  describe('on render', () => {
    it('should load visualization options from collection config', () => {
      const sentinelCollection = mockCollectionsData.find(
        (c) => c.id === 'sentinel-2-l2a'
      )
      store.dispatch(setSelectedCollectionData(sentinelCollection))
      setup()
      const select = screen.getByRole('combobox', { name: /visualization/i })
      expect(select).toBeInTheDocument()
      expect(
        screen.getByRole('option', { name: 'True Color' })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('option', { name: 'False Color' })
      ).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'NDVI' })).toBeInTheDocument()
    })

    it('should use key as fallback when title is not available', () => {
      const appConfigWithKeyOnly = {
        ...mockAppConfig,
        SCENE_TILER_URL: 'https://example.com/titiler',
        COLLECTIONS_CONFIG: {
          'sentinel-2-l2a': {
            visualizations: {
              'visualization-key': {
                assets: ['red', 'green', 'blue']
              },
              'another-key': {
                assets: ['nir']
              }
            }
          }
        }
      }
      store.dispatch(setappConfig(appConfigWithKeyOnly))
      const sentinelCollection = mockCollectionsData.find(
        (c) => c.id === 'sentinel-2-l2a'
      )
      store.dispatch(setSelectedCollectionData(sentinelCollection))
      setup()
      expect(
        screen.getByRole('option', { name: 'visualization-key' })
      ).toBeInTheDocument()
    })
  })

  describe('on visualization changed', () => {
    it('should update Redux state on selection', async () => {
      const sentinelCollection = mockCollectionsData.find(
        (c) => c.id === 'sentinel-2-l2a'
      )
      store.dispatch(setSelectedCollectionData(sentinelCollection))
      store.dispatch(setSelectedVisualization(null))
      setup()
      await waitFor(() => {
        expect(store.getState().mainSlice.selectedVisualization).toBe(
          'true-color'
        )
      })
      const select = screen.getByRole('combobox', {
        name: /visualization/i
      })
      await userEvent.selectOptions(select, 'false-color')
      await waitFor(() => {
        expect(store.getState().mainSlice.selectedVisualization).toBe(
          'false-color'
        )
      })
    })

    it('should update local state and sync to Redux', async () => {
      const sentinelCollection = mockCollectionsData.find(
        (c) => c.id === 'sentinel-2-l2a'
      )
      store.dispatch(setSelectedCollectionData(sentinelCollection))
      setup()
      const select = screen.getByRole('combobox', {
        name: /visualization/i
      })
      await userEvent.selectOptions(select, 'ndvi')
      await waitFor(() => {
        expect(select.value).toBe('ndvi')
        expect(store.getState().mainSlice.selectedVisualization).toBe('ndvi')
      })
    })

    it('should update URL when visualization changes and item is selected', async () => {
      const navigateSpy = vi.spyOn(router, 'navigate')

      const sentinelCollection = mockCollectionsData.find(
        (c) => c.id === 'sentinel-2-l2a'
      )
      store.dispatch(setSelectedCollectionData(sentinelCollection))

      // Set up a mock item that the user is viewing
      const mockItem = {
        id: 'S2A_17SNB_20230617_0_L2A',
        collection: 'sentinel-2-l2a',
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-122.5, 37.5],
              [-122.4, 37.5],
              [-122.4, 37.6],
              [-122.5, 37.6],
              [-122.5, 37.5]
            ]
          ]
        },
        properties: {}
      }
      store.dispatch(setCurrentPopupResult(mockItem))

      setup()

      const select = screen.getByRole('combobox', {
        name: /visualization/i
      })

      // User changes visualization selection
      await userEvent.selectOptions(select, 'false-color')

      // Verify router.navigate was called with correct parameters
      await waitFor(() => {
        expect(navigateSpy).toHaveBeenCalledWith({
          to: '/item/$collectionId/$itemId/{-$visualizationId}',
          params: {
            collectionId: 'sentinel-2-l2a',
            itemId: 'S2A_17SNB_20230617_0_L2A',
            visualizationId: 'false-color'
          }
        })
      })

      navigateSpy.mockRestore()
    })
  })

  describe('on collection change', () => {
    it('should reset visualization to first option when collection changes', async () => {
      const sentinelCollection = mockCollectionsData.find(
        (c) => c.id === 'sentinel-2-l2a'
      )
      store.dispatch(setSelectedCollectionData(sentinelCollection))
      setup()
      const select = screen.getByRole('combobox', {
        name: /visualization/i
      })
      await userEvent.selectOptions(select, 'false-color')
      await waitFor(() => {
        expect(store.getState().mainSlice.selectedVisualization).toBe(
          'false-color'
        )
      })

      const newCollection = {
        ...sentinelCollection,
        id: 'new-collection'
      }
      const appConfigWithNewCollection = {
        ...mockAppConfig,
        SCENE_TILER_URL: 'https://example.com/titiler',
        COLLECTIONS_CONFIG: {
          'new-collection': {
            visualizations: {
              'first-viz': {
                title: 'First Visualization',
                assets: ['red']
              },
              'second-viz': {
                title: 'Second Visualization',
                assets: ['green']
              }
            }
          }
        }
      }
      store.dispatch(setappConfig(appConfigWithNewCollection))
      store.dispatch(setSelectedCollectionData(newCollection))

      await waitFor(() => {
        expect(store.getState().mainSlice.selectedVisualization).toBe(
          'first-viz'
        )
      })
    })
  })

  describe('legacy config support', () => {
    it('should handle visualizations.default correctly', () => {
      const appConfigWithDefault = {
        ...mockAppConfig,
        SCENE_TILER_URL: 'https://example.com/titiler',
        COLLECTIONS_CONFIG: {
          'cop-dem-glo-30': {
            visualizations: {
              default: {
                assets: ['data']
              }
            }
          }
        }
      }
      store.dispatch(setappConfig(appConfigWithDefault))
      store.dispatch(setSelectedCollectionData(mockCollectionsData[0]))
      const { container } = setup()
      expect(container.firstChild).toBeNull()
    })
  })

  describe('local state initialization', () => {
    it('should initialize from Redux state if valid', async () => {
      const sentinelCollection = mockCollectionsData.find(
        (c) => c.id === 'sentinel-2-l2a'
      )
      store.dispatch(setSelectedCollectionData(sentinelCollection))
      store.dispatch(setSelectedVisualization('false-color'))
      setup()
      const select = screen.getByRole('combobox', {
        name: /visualization/i
      })
      await waitFor(() => {
        expect(select.value).toBe('false-color')
      })
    })

    it('should fall back to first visualization if Redux state is invalid', async () => {
      const sentinelCollection = mockCollectionsData.find(
        (c) => c.id === 'sentinel-2-l2a'
      )
      store.dispatch(setSelectedCollectionData(sentinelCollection))
      store.dispatch(setSelectedVisualization('invalid-key'))
      setup()
      const select = screen.getByRole('combobox', {
        name: /visualization/i
      })
      await waitFor(() => {
        expect(select.value).toBe('true-color')
      })
    })
  })

  describe('view mode switching', () => {
    it('should preserve Redux state when switching away from scene mode', async () => {
      const sentinelCollection = mockCollectionsData.find(
        (c) => c.id === 'sentinel-2-l2a'
      )
      store.dispatch(setSelectedCollectionData(sentinelCollection))
      store.dispatch(setViewMode('scene'))
      store.dispatch(setSelectedVisualization('false-color'))

      // Component should be visible in scene mode
      const { rerender } = setup()
      expect(
        screen.getByRole('combobox', { name: /visualization/i })
      ).toBeInTheDocument()
      expect(store.getState().mainSlice.selectedVisualization).toBe(
        'false-color'
      )

      // Switch to mosaic mode - component unmounts but Redux state persists
      store.dispatch(setViewMode('mosaic'))
      rerender(
        <Provider store={store}>
          <VisualizationSelector />
        </Provider>
      )
      expect(
        screen.queryByRole('combobox', { name: /visualization/i })
      ).not.toBeInTheDocument()
      expect(store.getState().mainSlice.selectedVisualization).toBe(
        'false-color'
      )

      // Switch back to scene mode - component remounts and validates state
      store.dispatch(setViewMode('scene'))
      rerender(
        <Provider store={store}>
          <VisualizationSelector />
        </Provider>
      )
      await waitFor(() => {
        const select = screen.getByRole('combobox', {
          name: /visualization/i
        })
        expect(select.value).toBe('false-color')
      })
      expect(store.getState().mainSlice.selectedVisualization).toBe(
        'false-color'
      )
    })
  })
})
