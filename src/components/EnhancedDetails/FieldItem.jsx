import React from 'react'
import PropTypes from 'prop-types'
import Tooltip from '@mui/material/Tooltip'
import { getFieldLabel } from '../../utils/fieldFormatting.js'
import { getFieldMetadata } from '../../utils/fieldDiscovery.js'
import { useEnhancedDetails } from '../../contexts/EnhancedDetailsContext'
import TruncatedFieldValue from './TruncatedFieldValue.jsx'

/**
 * FieldItem Component
 * Reusable component for rendering individual field items with consistent styling
 */
const FieldItem = ({ field, value }) => {
  const { item } = useEnhancedDetails()
  const fieldLabel = getFieldLabel(field, item)
  const metadata = getFieldMetadata(field)
  const hasTooltip = metadata?.hasTooltip && metadata?.tooltipContent

  const labelElement = (
    <span
      className={`field-label-inline${hasTooltip ? ' field-label-has-tooltip' : ''}`}
    >
      {fieldLabel}:
    </span>
  )

  return (
    <div className="field-grid-item" role="listitem">
      {hasTooltip ? (
        <Tooltip
          title={metadata.tooltipContent}
          placement="top"
          slotProps={{
            tooltip: {
              className: 'tooltip-field-label'
            },
            popper: {
              modifiers: [
                {
                  name: 'offset',
                  options: { offset: [0, -4] }
                }
              ]
            }
          }}
        >
          {labelElement}
        </Tooltip>
      ) : (
        labelElement
      )}
      <span className="field-value-inline">
        <TruncatedFieldValue field={field} value={value} />
      </span>
    </div>
  )
}

FieldItem.propTypes = {
  field: PropTypes.string.isRequired,
  value: PropTypes.any
}

export default FieldItem
