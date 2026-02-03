import React from 'react'
import PropTypes from 'prop-types'
import Card from '../Card/Card'
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
          <span className="item-header-value item-header-value--truncate">{id}</span>
        </div>
        <div className="item-header-field">
          <span className="item-header-label">Collection</span>
          <span className="item-header-value">{collection}</span>
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
