import React from 'react'
import PropTypes from 'prop-types'
import {
  formatStacFieldEnhanced,
  getFieldLabel
} from '../../utils/fieldFormatting.js'

const FieldRenderer = ({ field, item, className = 'detailRow' }) => {
  const rawValue = item?.properties?.[field]
  const formattedValue = formatStacFieldEnhanced(field, rawValue, item)
  const hasHtml =
    typeof formattedValue === 'string' && /<[^>]*>/.test(formattedValue)

  const fieldId = `field-${field.replace(/[^a-zA-Z0-9]/g, '-')}`
  const labelId = `label-${fieldId}`

  return (
    <div className={className} key={field + '1'} role="listitem">
      <span className="popupResultDetailsRowKey" key={field + '2'} id={labelId}>
        {getFieldLabel(field, item) + ':'}
      </span>
      {hasHtml ? (
        <span
          className="popupResultDetailsRowValue"
          key={field + '3'}
          id={fieldId}
          aria-labelledby={labelId}
          dangerouslySetInnerHTML={{ __html: formattedValue }}
        />
      ) : (
        <span
          className="popupResultDetailsRowValue"
          key={field + '3'}
          id={fieldId}
          aria-labelledby={labelId}
        >
          {formattedValue}
        </span>
      )}
    </div>
  )
}

FieldRenderer.propTypes = {
  field: PropTypes.string.isRequired,
  item: PropTypes.object.isRequired,
  className: PropTypes.string
}

export default FieldRenderer
