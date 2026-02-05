import { vi } from 'vitest'
import React from 'react'
import { act, render, screen } from '@testing-library/react'
import Search from './Search'
import { Provider } from 'react-redux'
import { store } from '../../redux/store'
import {
  setappConfig,
  setSelectedCollectionData,
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

  beforeEach(() => {
    vi.mock('../../utils/mapHelper')
    vi.mock('../../utils/searchHelper')
    store.dispatch(
      setappConfig({ ...mockAppConfig, SEARCH_BY_GEOM_ENABLED: true })
    )
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should reset showSearchByGeom when search options change', async () => {
    store.dispatch(setshowSearchByGeom(true))
    setup()
    await act(async () => {
      store.dispatch(setSelectedCollectionData({ id: 'test' }))
    })
    expect(store.getState().mainSlice.showSearchByGeom).toBeFalsy()
  })

  it('should reset showSearchByGeom when search button clicked', async () => {
    store.dispatch(setshowSearchByGeom(true))
    setup()
    await user.click(screen.getByRole('button', { name: /search/i }))
    expect(store.getState().mainSlice.showSearchByGeom).toBeFalsy()
  })
})
