import { vi } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import Search from './Search'
import { Provider } from 'react-redux'
import { store } from '../../redux/store'
import { setappConfig } from '../../redux/slices/mainSlice'
import { mockAppConfig } from '../../testing/shared-mocks'

describe('Search', () => {
  const setup = () =>
    render(
      <Provider store={store}>
        <Search />
      </Provider>
    )

  beforeEach(() => {
    vi.mock('../../utils/mapHelper')
    vi.mock('../../utils/searchHelper')
    store.dispatch(setappConfig(mockAppConfig))
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should render the search button', () => {
    setup()
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument()
  })
})
