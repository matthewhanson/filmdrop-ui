/**
 * ENHANCED FIELD RENDERER
 * Render STAC fields using React components
 * Eliminates dangerouslySetInnerHTML usage
 */

import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { getStacFieldType } from '../../utils/fieldDiscovery.js'
import { extractFieldComponents } from '../../utils/fieldFormatting.js'
import { sanitizeFieldValue } from '../../utils/securityHelper.js'
import { FieldDisplay } from './FieldDisplayComponents.jsx'
import { useEnhancedDetails } from '../../contexts/EnhancedDetailsContext'

/**
 * Enhanced Field Renderer Component
 * Renders STAC field values using React components for maximum security
 */
const EnhancedFieldRenderer = ({ field, value }) => {
  const { item } = useEnhancedDetails()

  // Discover field type and extract components
  const fieldType = useMemo(() => {
    return getStacFieldType(field, value, item)
  }, [field, value, item])

  const components = useMemo(() => {
    return extractFieldComponents(field, value, item, fieldType)
  }, [field, value, item, fieldType])

  // If no components were extracted, fall back to simple text rendering
  if (!components || components.length === 0) {
    return sanitizeFieldValue(value)
  }

  return (
    <FieldDisplay fieldType={fieldType} components={components} field={field} />
  )
}

EnhancedFieldRenderer.propTypes = {
  field: PropTypes.string.isRequired,
  value: PropTypes.any.isRequired
}

export default EnhancedFieldRenderer
