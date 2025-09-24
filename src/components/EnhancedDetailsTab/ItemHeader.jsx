import React from 'react'
import PropTypes from 'prop-types'

/**
 * ItemHeader Component
 * Displays item ID and collection information
 */
const ItemHeader = ({ id, collection }) => {
  return (
    <div className="item-header">
      <h3 className="item-id">{id}</h3>
      <p className="item-collection">Collection: {collection}</p>
    </div>
  )
}

ItemHeader.propTypes = {
  id: PropTypes.string.isRequired,
  collection: PropTypes.string.isRequired
}

export default ItemHeader
