import { describe, it, vi } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import LeftContent from './LeftContent'
import { Provider } from 'react-redux'
import { store } from '../../../../redux/store'
import { LayoutProvider } from '../../../../contexts/LayoutContext'
import {
  setappConfig,
  setSearchLoading,
  settabSelected
} from '../../../../redux/slices/mainSlice'
import { mockAppConfig } from '../../../../testing/shared-mocks'
import userEvent from '@testing-library/user-event'

// Mock useUrlNavigate so setTab dispatches to Redux (simulating URL→Redux sync)
vi.mock('../../../../hooks/useUrlNavigate', async () => {
  const { store } = await import('../../../../redux/store')
  const { settabSelected } = await import('../../../../redux/slices/mainSlice')
  return {
    useUrlNavigate: () => ({
      setTab: (tab) => store.dispatch(settabSelected(tab)),
      setViz: vi.fn(),
      setItem: vi.fn(),
      clearItem: vi.fn(),
      setMapView: vi.fn()
    })
  }
})

describe('LeftContent', () => {
  const user = userEvent.setup()
  const setup = () =>
    render(
      <Provider store={store}>
        <LayoutProvider>
          <LeftContent />
        </LayoutProvider>
      </Provider>
    )

  beforeEach(() => {
    store.dispatch(setappConfig(mockAppConfig))
    vi.mock('../../../../utils/mapHelper')
  })
  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('on render', () => {
    it('should render Search', () => {
      setup()
      expect(screen.queryByTestId('Search')).toBeInTheDocument()
    })
  })

  describe('when search loading', () => {
    it('should render disabled search bar overlay div', async () => {
      store.dispatch(setSearchLoading(true))
      store.dispatch(setappConfig(mockAppConfig))
      setup()
      expect(
        screen.queryByTestId('test_disableSearchOverlay')
      ).toBeInTheDocument()
    })
  })

  describe('on user actions', () => {
    describe('on Item Details tab clicked', () => {
      it('should not render search results', async () => {
        setup()
        expect(screen.queryByTestId('Search')).toBeInTheDocument()
        const itemDetailsButton = screen.getByRole('button', {
          name: /item details/i
        })
        await user.click(itemDetailsButton)
        expect(screen.queryByTestId('Search')).not.toBeInTheDocument()
        expect(screen.queryByTestId('testPopupResults')).toBeInTheDocument()
      })
    })
    describe('on Search tab clicked', () => {
      it('should render search results', async () => {
        store.dispatch(settabSelected('item details'))
        setup()
        expect(screen.queryByTestId('Search')).not.toBeInTheDocument()
        expect(screen.queryByTestId('testPopupResults')).toBeInTheDocument()
        const searchButton = screen.getByRole('button', {
          name: /search/i
        })
        await user.click(searchButton)
        expect(screen.queryByTestId('Search')).toBeInTheDocument()
        expect(screen.queryByTestId('testPopupResults')).not.toBeInTheDocument()
      })
    })
  })
})
