import { vi } from 'vitest'
import React from 'react'
import { act, render, screen } from '@testing-library/react'
import Search from './Search'
import { Provider } from 'react-redux'
import { store } from '../../redux/store'
import {
  setappConfig,
  setsearchGeojsonBoundary,
  setshowSearchByGeom
} from '../../redux/slices/mainSlice'
import { mockAppConfig } from '../../testing/shared-mocks'
import userEvent from '@testing-library/user-event'

describe('Search', () => {
  const user = userEvent.setup()
  const setup = () =>
    render(
      <Provider store={store}>
        <Search />
      </Provider>
    )

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('search button', () => {
    describe('if SEARCH_BY_GEOM_ENABLED is true', () => {
      beforeEach(() => {
        vi.mock('../../utils/mapHelper')
        vi.mock('../../utils/searchHelper')
        const mockAppConfigSearchEnabled = {
          ...mockAppConfig,
          SEARCH_BY_GEOM_ENABLED: true
        }
        store.dispatch(setappConfig(mockAppConfigSearchEnabled))
      })
      describe('on render', () => {
        it('should not render disabled search bar overlay div', async () => {
          setup()
          expect(
            screen.queryByTestId('test_disableSearchOverlay')
          ).not.toBeInTheDocument()
        })
      })
      describe('when search options changed', () => {
        it('should set showSearchByGeom to false in redux', async () => {
          await act(async () => {
            store.dispatch(setshowSearchByGeom(true))
            setup()
          })
          await act(async () => {
            store.dispatch(setsearchGeojsonBoundary({ foo: 'bar' }))
          })
          expect(store.getState().mainSlice.showSearchByGeom).toBeFalsy()
        })
      })
      describe('when search button clicked', () => {
        it('should set showSearchByGeom to false in redux', async () => {
          store.dispatch(setshowSearchByGeom(true))
          setup()
          const searchButton = screen.getByRole('button', {
            name: /search/i
          })
          await user.click(searchButton)
          expect(store.getState().mainSlice.showSearchByGeom).toBeFalsy()
        })
      })
      describe('when drawing mode enabled', () => {
        it('should render disabled search bar overlay div', async () => {
          setup()
          const drawBoundaryButton = screen.getByRole('button', {
            name: /draw/i
          })
          await user.click(drawBoundaryButton)
          expect(store.getState().mainSlice.isDrawingEnabled).toBeTruthy()
        })
      })
      // Note: Draw, Upload, and Clear button tests moved to AreaOfInterestSelector.test.jsx
      // The behavior has changed - buttons now always allow action (clearing existing boundary first)
    })
  })
})
