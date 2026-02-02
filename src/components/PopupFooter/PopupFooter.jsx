import React from 'react'
import PropTypes from 'prop-types'
import {
  ChevronRight,
  ChevronLeft,
  AddShoppingCart,
  RemoveShoppingCart
} from '@mui/icons-material'
import './PopupFooter.css'

/**
 * Footer bar with navigation controls and optional cart action
 */
const PopupFooter = React.memo(
  ({
    currentIndex,
    totalCount,
    onPrevClick,
    onNextClick,
    cartEnabled = false,
    isInCart = false,
    onCartClick
  }) => {
    const isFirst = currentIndex === 0
    const isLast = currentIndex === totalCount - 1

    return (
      <div className="popupFooter">
        <div className="popupFooterControls">
          <div className="popupFooterNav">
            <button
              onClick={onPrevClick}
              className="popupFooterButton popupFooterButtonLeft"
              disabled={isFirst}
              aria-label="Previous item"
            >
              <ChevronLeft />
            </button>
            <span className="popupFooterCount">
              {currentIndex + 1} of {totalCount}
            </span>
            <button
              className="popupFooterButton popupFooterButtonRight"
              onClick={onNextClick}
              disabled={isLast}
              aria-label="Next item"
            >
              <ChevronRight />
            </button>
          </div>
          {cartEnabled && (
            <button
              className={`popupFooterCartButton ${!isInCart ? 'popupFooterCartButton--add' : ''}`}
              onClick={onCartClick}
              aria-label={isInCart ? 'Remove from cart' : 'Add to cart'}
              title={isInCart ? 'Remove from cart' : 'Add to cart'}
            >
              {isInCart ? (
                <RemoveShoppingCart fontSize="small" />
              ) : (
                <AddShoppingCart fontSize="small" />
              )}
            </button>
          )}
        </div>
      </div>
    )
  }
)

PopupFooter.propTypes = {
  currentIndex: PropTypes.number.isRequired,
  totalCount: PropTypes.number.isRequired,
  onPrevClick: PropTypes.func.isRequired,
  onNextClick: PropTypes.func.isRequired,
  cartEnabled: PropTypes.bool,
  isInCart: PropTypes.bool,
  onCartClick: PropTypes.func
}

PopupFooter.displayName = 'PopupFooter'

export default PopupFooter
