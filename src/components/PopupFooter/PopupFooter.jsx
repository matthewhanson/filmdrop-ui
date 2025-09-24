import React from 'react'
import PropTypes from 'prop-types'
import { ChevronRight, ChevronLeft } from '@mui/icons-material'
import './PopupFooter.css'

/**
 * Reusable popup footer component for navigation controls
 */
const PopupFooter = React.memo(
  ({ currentIndex, totalCount, onPrevClick, onNextClick }) => {
    const isFirst = currentIndex === 0
    const isLast = currentIndex === totalCount - 1

    return (
      <div className="popupFooter">
        <div className="popupFooterControls">
          <div className="popupFooterControlLeft">
            {currentIndex + 1} of {totalCount}
          </div>
          <div className="popupFooterButtonsGroup">
            <button
              onClick={onPrevClick}
              className="popupFooterButton popupFooterButtonLeft"
              disabled={isFirst}
              aria-label="Previous item"
            >
              <ChevronLeft />
            </button>
            <button
              className="popupFooterButton popupFooterButtonRight"
              onClick={onNextClick}
              disabled={isLast}
              aria-label="Next item"
            >
              <ChevronRight />
            </button>
          </div>
        </div>
      </div>
    )
  }
)

PopupFooter.propTypes = {
  currentIndex: PropTypes.number.isRequired,
  totalCount: PropTypes.number.isRequired,
  onPrevClick: PropTypes.func.isRequired,
  onNextClick: PropTypes.func.isRequired
}

PopupFooter.displayName = 'PopupFooter'

export default PopupFooter
