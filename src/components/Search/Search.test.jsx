import { vi } from 'vitest'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import Search from './Search'
import { Provider } from 'react-redux'
import { store } from '../../redux/store'
import { setappConfig } from '../../redux/slices/mainSlice'
import { mockAppConfig } from '../../testing/shared-mocks'
import { newSearch } from '../../utils/searchHelper'
import * as useRenderableQueryablesModule from '../../hooks/useRenderableQueryables'

vi.mock('../../utils/mapHelper')
vi.mock('../../utils/searchHelper')

describe('Search', () => {
  const setup = (configOverrides = {}) => {
    store.dispatch(
      setappConfig({
        ...mockAppConfig,
        ...configOverrides
      })
    )
    return render(
      <Provider store={store}>
        <Search />
      </Provider>
    )
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(
      useRenderableQueryablesModule,
      'useRenderableQueryables'
    ).mockReturnValue({
      fields: [],
      hasFields: false,
      error: null
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('basic rendering', () => {
    it('should render the search button', () => {
      setup()
      expect(
        screen.getByRole('button', { name: /search/i })
      ).toBeInTheDocument()
    })

    it('should render Location & Date section heading', () => {
      setup()
      expect(screen.getByText('Location & Date')).toBeInTheDocument()
    })

    it('should render View & Search section heading', () => {
      setup()
      expect(screen.getByText('View & Search')).toBeInTheDocument()
    })
  })

  describe('search button interaction', () => {
    it('should call newSearch when search button is clicked', () => {
      setup()
      const searchButton = screen.getByRole('button', { name: /search/i })
      fireEvent.click(searchButton)
      expect(newSearch).toHaveBeenCalledTimes(1)
    })
  })

  describe('conditional rendering', () => {
    describe('Filters section', () => {
      it('should not render Filters section when hasFields is false', () => {
        setup()
        expect(screen.queryByText('Filters')).not.toBeInTheDocument()
      })

      it('should render Filters section when hasFields is true', () => {
        vi.spyOn(
          useRenderableQueryablesModule,
          'useRenderableQueryables'
        ).mockReturnValue({
          fields: [
            ['cloudCover', { type: 'number', minimum: 0, maximum: 100 }]
          ],
          hasFields: true,
          error: null
        })
        setup()
        expect(screen.getByText('Filters')).toBeInTheDocument()
      })
    })

    describe('ViewSelector', () => {
      it('should always render ViewSelector regardless of tiler config', () => {
        setup({ MOSAIC_TILER_URL: '', SCENE_TILER_URL: '' })
        expect(screen.getByText('View Mode')).toBeInTheDocument()
      })
    })
  })
})
