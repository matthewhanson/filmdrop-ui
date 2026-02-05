import { vi } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import ViewSelector from './ViewSelector'
import { Provider } from 'react-redux'
import { store } from '../../redux/store'
import {
  setappConfig,
  setSelectedCollectionData,
  setViewMode,
  setMap,
  setautoCenterOnItemChanged
} from '../../redux/slices/mainSlice'
import { mockAppConfig } from '../../testing/shared-mocks'
import * as mapHelper from '../../utils/mapHelper'

vi.mock('../../utils/mapHelper', () => ({
  getCurrentMapZoomLevel: vi.fn(() => 10)
}))

describe('ViewSelector', () => {
  let mockMap
  let zoomEndCallback

  const setup = (
    configOverrides = {},
    collectionDataOverrides = {},
    options = {}
  ) => {
    const { skipMap = false, zoomLevel = 10 } = options

    store.dispatch(
      setappConfig({
        ...mockAppConfig,
        ...configOverrides
      })
    )
    store.dispatch(
      setSelectedCollectionData({
        id: 'test-collection',
        aggregations: [],
        ...collectionDataOverrides
      })
    )

    if (!skipMap) {
      mapHelper.getCurrentMapZoomLevel.mockReturnValue(zoomLevel)
      mockMap = {
        on: vi.fn((event, callback) => {
          if (event === 'zoomend') {
            zoomEndCallback = callback
          }
        }),
        off: vi.fn()
      }
      store.dispatch(setMap(mockMap))
    }

    const result = render(
      <Provider store={store}>
        <ViewSelector />
      </Provider>
    )

    // Trigger the zoom update if map is present
    if (!skipMap && zoomEndCallback) {
      act(() => {
        zoomEndCallback()
      })
    }

    return result
  }

  const getButton = (name) => screen.getByRole('button', { name })

  beforeEach(() => {
    vi.clearAllMocks()
    store.dispatch(setViewMode('scene'))
    store.dispatch(setMap(null))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('basic rendering', () => {
    it('should render all four view mode buttons', () => {
      setup()
      expect(getButton('Hex')).toBeInTheDocument()
      expect(getButton('Grid')).toBeInTheDocument()
      expect(getButton('Scene')).toBeInTheDocument()
      expect(getButton('Mosaic')).toBeInTheDocument()
    })

    it('should render View Mode label', () => {
      setup()
      expect(screen.getByText('View Mode')).toBeInTheDocument()
    })
  })

  describe('button disabled states', () => {
    describe('Hex button', () => {
      it('should be disabled when collection lacks hex aggregation support', () => {
        setup({}, { aggregations: [] })
        expect(getButton('Hex')).toBeDisabled()
      })

      it('should be enabled when collection supports hex aggregation', () => {
        setup({}, { aggregations: [{ name: 'grid_geohex_frequency' }] })
        expect(getButton('Hex')).not.toBeDisabled()
      })
    })

    describe('Grid button', () => {
      it('should be disabled when collection lacks grid aggregation support', () => {
        setup({}, { aggregations: [] })
        expect(getButton('Grid')).toBeDisabled()
      })

      it('should be enabled when collection supports grid aggregation', () => {
        setup({}, { aggregations: [{ name: 'grid_code_frequency' }] })
        expect(getButton('Grid')).not.toBeDisabled()
      })
    })

    describe('Scene button', () => {
      it('should be disabled when SCENE_TILER_URL is not configured', () => {
        setup({ SCENE_TILER_URL: '' })
        expect(getButton('Scene')).toBeDisabled()
      })

      it('should be disabled when zoom level is too low', () => {
        setup(
          { SCENE_TILER_URL: 'https://titiler.example.com' },
          {},
          { zoomLevel: 3 }
        )
        expect(getButton('Scene')).toBeDisabled()
      })

      it('should be enabled when SCENE_TILER_URL is configured and zoom is sufficient', () => {
        setup({ SCENE_TILER_URL: 'https://titiler.example.com' })
        expect(getButton('Scene')).not.toBeDisabled()
      })
    })

    describe('Mosaic button', () => {
      it('should be disabled when MOSAIC_TILER_URL is not configured', () => {
        setup({ MOSAIC_TILER_URL: '' })
        expect(getButton('Mosaic')).toBeDisabled()
      })

      it('should be disabled when zoom level is too low', () => {
        setup(
          { MOSAIC_TILER_URL: 'https://titiler-mosaic.example.com' },
          {},
          { zoomLevel: 3 }
        )
        expect(getButton('Mosaic')).toBeDisabled()
      })

      it('should be enabled when MOSAIC_TILER_URL is configured and zoom is sufficient', () => {
        setup({ MOSAIC_TILER_URL: 'https://titiler-mosaic.example.com' })
        expect(getButton('Mosaic')).not.toBeDisabled()
      })
    })
  })

  describe('button click handlers', () => {
    it('should dispatch setViewMode("hex") when clicking Hex button', () => {
      setup({}, { aggregations: [{ name: 'grid_geohex_frequency' }] })

      fireEvent.click(getButton('Hex'))

      const state = store.getState()
      expect(state.mainSlice.viewMode).toBe('hex')
    })

    it('should dispatch setViewMode("grid-code") when clicking Grid button', () => {
      setup({}, { aggregations: [{ name: 'grid_code_frequency' }] })

      fireEvent.click(getButton('Grid'))

      const state = store.getState()
      expect(state.mainSlice.viewMode).toBe('grid-code')
    })

    it('should dispatch setViewMode("scene") when clicking Scene button', () => {
      setup({ SCENE_TILER_URL: 'https://titiler.example.com' })
      store.dispatch(setViewMode('hex')) // Start from different mode

      fireEvent.click(getButton('Scene'))

      const state = store.getState()
      expect(state.mainSlice.viewMode).toBe('scene')
    })

    it('should dispatch setViewMode("mosaic") when clicking Mosaic button', () => {
      setup({ MOSAIC_TILER_URL: 'https://titiler-mosaic.example.com' })

      fireEvent.click(getButton('Mosaic'))

      const state = store.getState()
      expect(state.mainSlice.viewMode).toBe('mosaic')
    })
  })

  describe('Auto-Zoom checkbox', () => {
    it('should not render Auto-Zoom checkbox when SHOW_ITEM_AUTO_ZOOM is false', () => {
      setup({ SHOW_ITEM_AUTO_ZOOM: false })
      expect(screen.queryByText('Item Auto-Zoom')).not.toBeInTheDocument()
    })

    it('should render Auto-Zoom checkbox when SHOW_ITEM_AUTO_ZOOM is true', () => {
      setup({ SHOW_ITEM_AUTO_ZOOM: true })
      expect(screen.getByText('Item Auto-Zoom')).toBeInTheDocument()
    })

    it('should dispatch setautoCenterOnItemChanged when checkbox is toggled', () => {
      store.dispatch(setautoCenterOnItemChanged(false))
      setup({ SHOW_ITEM_AUTO_ZOOM: true })

      const checkbox = screen.getByRole('checkbox')
      fireEvent.click(checkbox)

      const state = store.getState()
      expect(state.mainSlice.autoCenterOnItemChanged).toBe(true)
    })
  })
})
