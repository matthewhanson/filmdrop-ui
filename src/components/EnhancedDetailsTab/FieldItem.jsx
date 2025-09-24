import React from 'react'
import PropTypes from 'prop-types'
import FieldInfoIcon from '../FieldInfoIcon/FieldInfoIcon'
import { getFieldLabel } from '../../utils/fieldFormatting.js'
import EnhancedFieldRenderer from './EnhancedFieldRenderer.jsx'

/**
 * FieldItem Component
 * Reusable component for rendering individual field items with consistent styling
 */
const FieldItem = ({ field, value, item, layout = 'default' }) => {
  const fieldLabel = getFieldLabel(field, item)

  return (
    <div
      className={`field-grid-item ${layout === 'full-width' ? 'field-grid-item-full-width' : ''}`}
      role="listitem"
    >
      <span className="field-label-inline">{fieldLabel}:</span>
      <span className="field-value-inline">
        <EnhancedFieldRenderer field={field} value={value} item={item} />
      </span>
      <FieldInfoIcon field={field} item={item} tooltipPlacement="top-start" />
    </div>
  )
}

FieldItem.propTypes = {
  field: PropTypes.string.isRequired,
  value: PropTypes.any,
  item: PropTypes.object.isRequired,
  layout: PropTypes.oneOf(['default', 'full-width'])
}

export default FieldItem
