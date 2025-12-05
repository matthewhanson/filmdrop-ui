import React from 'react'
import { render, screen } from '@testing-library/react'
import PopupResult from './PopupResult'
import { Provider } from 'react-redux'
import { store } from '../../redux/store'
import { setappConfig } from '../../redux/slices/mainSlice'
import { mockAppConfig, mockClickResults } from '../../testing/shared-mocks'
import { describe, beforeEach, vi } from 'vitest'

describe('PopupResult', () => {
  const setup = (result = mockClickResults[0]) =>
    render(
      <Provider store={store}>
        <PopupResult result={result} />
      </Provider>
    )

  beforeEach(() => {
    store.dispatch(setappConfig(mockAppConfig))
    vi.clearAllMocks()
    // Mock Image constructor to simulate successful image load
    global.Image = vi.fn(() => ({
      onload: null,
      onerror: null,
      src: '',
      width: 100,
      height: 100
    }))
  })

  describe('thumbnail display', () => {
    it('should render thumbnail container even when image loads asynchronously', () => {
      setup()
      const thumbnailContainer = screen
        .getByTestId('testPopupResult')
        .querySelector('.popupResultThumbnailContainer')
      expect(thumbnailContainer).toBeInTheDocument()
    })

    it('should handle item without thumbnail gracefully', () => {
      const itemWithoutThumbnail = {
        ...mockClickResults[0],
        links: []
      }
      setup(itemWithoutThumbnail)

      const container = screen.getByTestId('testPopupResult')
      expect(container).toBeInTheDocument()
      const thumbnailContainer = container.querySelector(
        '.popupResultThumbnailContainer'
      )
      expect(thumbnailContainer).toBeInTheDocument()
    })
  })

  describe('STAC API link display', () => {
    it('should render STAC API link when STAC_LINK_ENABLED is true in config', () => {
      const configWithStacLink = {
        ...mockAppConfig,
        STAC_LINK_ENABLED: true
      }
      store.dispatch(setappConfig(configWithStacLink))
      setup()

      const stacLink = screen.getByRole('link', { name: /stac api item/i })
      expect(stacLink).toBeInTheDocument()
    })

    it('should not render STAC API link when STAC_LINK_ENABLED is false in config', () => {
      const configWithoutStacLink = {
        ...mockAppConfig,
        STAC_LINK_ENABLED: false
      }
      store.dispatch(setappConfig(configWithoutStacLink))
      setup()

      const stacLink = screen.queryByRole('link', { name: /stac api item/i })
      expect(stacLink).not.toBeInTheDocument()
    })

    it('should have valid href pointing to item self link', () => {
      const configWithStacLink = {
        ...mockAppConfig,
        STAC_LINK_ENABLED: true
      }
      store.dispatch(setappConfig(configWithStacLink))
      setup()

      const stacLink = screen.getByRole('link', { name: /stac api item/i })
      expect(stacLink).toHaveAttribute('href')
      const href = stacLink.getAttribute('href')
      expect(href).toBeTruthy()
      expect(href).toMatch(/^https?:\/\//)
    })

    it('should open STAC API link in new tab with security attributes', () => {
      const configWithStacLink = {
        ...mockAppConfig,
        STAC_LINK_ENABLED: true
      }
      store.dispatch(setappConfig(configWithStacLink))
      setup()

      const stacLink = screen.getByRole('link', { name: /stac api item/i })
      expect(stacLink).toHaveAttribute('target', '_blank')
      expect(stacLink).toHaveAttribute('rel', 'noreferrer')
    })
  })

  describe('empty state', () => {
    it('should render nothing when result is null', () => {
      setup(null)
      const container = screen.getByTestId('testPopupResult')
      expect(container.firstChild).toBeNull()
    })

    it('should render empty container when result is undefined', () => {
      setup(undefined)
      const container = screen.getByTestId('testPopupResult')
      expect(container).toBeInTheDocument()
    })
  })

  describe('styling', () => {
    it('should apply popupResultCartEnabled class when CART_ENABLED is true', () => {
      const configWithCart = {
        ...mockAppConfig,
        CART_ENABLED: true
      }
      store.dispatch(setappConfig(configWithCart))
      setup()

      const container = screen.getByTestId('testPopupResult')
      expect(container).toHaveClass('popupResult', 'popupResultCartEnabled')
    })

    it('should apply only popupResult class when CART_ENABLED is false', () => {
      const configWithoutCart = {
        ...mockAppConfig,
        CART_ENABLED: false
      }
      store.dispatch(setappConfig(configWithoutCart))
      setup()

      const container = screen.getByTestId('testPopupResult')
      expect(container).toHaveClass('popupResult')
      expect(container).not.toHaveClass('popupResultCartEnabled')
    })
  })
})
