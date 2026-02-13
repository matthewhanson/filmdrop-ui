import React from 'react'
import PropTypes from 'prop-types'
import Card from '../Card/Card'
import OverflowTooltip from './OverflowTooltip.jsx'
import './ItemHeader.css'

/**
 * ItemHeader Component
 * Displays item ID and collection information in a card
 */
const ItemHeader = ({ id, collection }) => {
  return (
    <Card className="item-header">
      <div className="item-header-fields">
        <div className="item-header-field">
          <span className="item-header-label">Item ID</span>
          <OverflowTooltip className="item-header-value item-header-value--truncate">
            {id}
          </OverflowTooltip>
        </div>
        <div className="item-header-field">
          <span className="item-header-label">Collection</span>
          <OverflowTooltip className="item-header-value item-header-value--truncate">
            {collection}
          </OverflowTooltip>
        </div>
      </div>
    </Card>
  )
}

ItemHeader.propTypes = {
  id: PropTypes.string.isRequired,
  collection: PropTypes.string.isRequired
}

export default ItemHeader
