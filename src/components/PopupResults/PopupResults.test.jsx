import React from 'react'
import { render, screen, fireEvent, within } from '@testing-library/react'
import PopupResults from './PopupResults'
import { Provider } from 'react-redux'
import { store } from '../../redux/store'
import { LayoutProvider } from '../../contexts/LayoutContext'
import {
  setShowPopupModal,
  setappConfig,
  setcartItems,
  setimageOverlayLoading
} from '../../redux/slices/mainSlice'
import { mockAppConfig, mockClickResults } from '../../testing/shared-mocks'
import { describe, vi } from 'vitest'

vi.mock('../../hooks/useUrlNavigate', () => ({
  useUrlNavigate: () => ({
    setTab: vi.fn(),
    setViz: vi.fn(),
    setItem: vi.fn(),
    clearItem: vi.fn(),
    setMapView: vi.fn()
  })
}))

describe('PopupResult', () => {
  const setup = () =>
    render(
      <Provider store={store}>
        <LayoutProvider>
          <PopupResults results={mockClickResults} />
        </LayoutProvider>
      </Provider>
    )

  beforeEach(() => {
    store.dispatch(setappConfig(mockAppConfig))
  })

  describe('on conditional render', () => {
    describe('cart buttons', () => {
      it('should render cart button in footer if cart enabled in config', () => {
        const mockAppConfigCartEnabled = {
          ...mockAppConfig,
          CART_ENABLED: 'true'
        }
        store.dispatch(setappConfig(mockAppConfigCartEnabled))
        setup()
        expect(
          screen.queryByRole('button', {
            name: /add to cart/i
          })
        ).toBeInTheDocument()
      })
      it('should not render cart button in footer if cart not enabled in config', () => {
        store.dispatch(setappConfig(mockAppConfig))
        setup()
        expect(
          screen.queryByRole('button', {
            name: /add to cart/i
          })
        ).not.toBeInTheDocument()
      })
      it('should show remove from cart button if scene already in cart', () => {
        const mockAppConfigCartEnabled = {
          ...mockAppConfig,
          CART_ENABLED: 'true'
        }
        store.dispatch(setappConfig(mockAppConfigCartEnabled))
        store.dispatch(setcartItems([mockClickResults[0]]))
        setup()
        expect(
          screen.queryByRole('button', {
            name: /remove from cart/i
          })
        ).toBeInTheDocument()
      })
    })
  })
  describe('on button clicks', () => {
    describe('on cart button clicked', () => {
      it('should add scene to cart if scene not in cart', () => {
        const mockAppConfigCartEnabled = {
          ...mockAppConfig,
          CART_ENABLED: 'true'
        }
        store.dispatch(setappConfig(mockAppConfigCartEnabled))
        setup()
        expect(store.getState().mainSlice.cartItems.length).toBe(0)
        fireEvent.click(screen.getByRole('button', { name: /add to cart/i }))
        expect(store.getState().mainSlice.cartItems.length).toBe(1)
      })
      it('should remove scene from cart if scene in cart', () => {
        const mockAppConfigCartEnabled = {
          ...mockAppConfig,
          CART_ENABLED: 'true'
        }
        store.dispatch(setappConfig(mockAppConfigCartEnabled))
        store.dispatch(setcartItems([mockClickResults[0]]))
        setup()
        expect(store.getState().mainSlice.cartItems.length).toBe(1)
        fireEvent.click(
          screen.getByRole('button', { name: /remove from cart/i })
        )
        expect(store.getState().mainSlice.cartItems.length).toBe(0)
      })
    })
    describe('on prev & next scene buttons clicked', () => {
      it('should set scene result in redux to next and prev scene if not out of range', () => {
        store.dispatch(setappConfig(mockAppConfig))
        setup()
        expect(store.getState().mainSlice.currentPopupResult).toEqual(
          mockClickResults[0]
        )
        fireEvent.click(screen.getByTestId('ChevronRightIcon'))
        expect(store.getState().mainSlice.currentPopupResult).toEqual(
          mockClickResults[1]
        )
        fireEvent.click(screen.getByTestId('ChevronRightIcon'))
        expect(store.getState().mainSlice.currentPopupResult).toEqual(
          mockClickResults[1]
        )
        fireEvent.click(screen.getByTestId('ChevronLeftIcon'))
        expect(store.getState().mainSlice.currentPopupResult).toEqual(
          mockClickResults[0]
        )
        fireEvent.click(screen.getByTestId('ChevronLeftIcon'))
        expect(store.getState().mainSlice.currentPopupResult).toEqual(
          mockClickResults[0]
        )
      })
    })
  })
})
