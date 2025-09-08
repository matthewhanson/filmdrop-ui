/**
 * ENHANCED FIELD RENDERER
 * React component for rendering STAC fields using React components instead of HTML strings
 * Eliminates dangerouslySetInnerHTML usage in the modal
 */

import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { getStacFieldType } from '../../utils/fieldDiscovery.js'
import { extractFieldComponents } from '../../utils/fieldFormatting.js'
import { FieldDisplay } from './FieldDisplayComponents.jsx'

/**
 * Enhanced Field Renderer Component
 * Renders STAC field values using React components for maximum security
 */
const EnhancedFieldRenderer = ({ field, value, item }) => {
  // Discover field type and extract components
  const fieldType = useMemo(() => {
    return getStacFieldType(field, value, item)
  }, [field, value, item])

  const components = useMemo(() => {
    return extractFieldComponents(field, value, item, fieldType)
  }, [field, value, item, fieldType])

  // If no components were extracted, fall back to standard formatting
  if (!components || components.length === 0) {
    return (
      <div className="field-value">
        <div className="field-value-container">
          <span className="field-value-text">{String(value || '')}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="field-value">
      <div className="field-value-container">
        <FieldDisplay
          fieldType={fieldType}
          components={components}
          field={field}
          item={item}
        />
      </div>
    </div>
  )
}

EnhancedFieldRenderer.propTypes = {
  field: PropTypes.string.isRequired,
  value: PropTypes.any.isRequired,
  item: PropTypes.object.isRequired
}

export default EnhancedFieldRenderer
