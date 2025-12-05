import React from 'react'
import PropTypes from 'prop-types'
import FieldInfoIcon from '../FieldInfoIcon/FieldInfoIcon'
import { getFieldLabel } from '../../utils/fieldFormatting.js'
import TruncatedFieldValue from './TruncatedFieldValue.jsx'

/**
 * FieldItem Component
 * Reusable component for rendering individual field items with consistent styling
 */
const FieldItem = ({ field, value, item }) => {
  const fieldLabel = getFieldLabel(field, item)

  return (
    <div className="field-grid-item" role="listitem">
      <span className="field-label-inline">{fieldLabel}:</span>
      <span className="field-value-inline">
        <TruncatedFieldValue field={field} value={value} item={item} />
      </span>
      <FieldInfoIcon field={field} tooltipPlacement="top-start" />
    </div>
  )
}

FieldItem.propTypes = {
  field: PropTypes.string.isRequired,
  value: PropTypes.any,
  item: PropTypes.object.isRequired
}

export default FieldItem
