/**
 * ENHANCED FIELD RENDERER
 * Render STAC fields using React components
 * Eliminates dangerouslySetInnerHTML usage
 */

import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { getStacFieldType } from '../../utils/fieldDiscovery.js'
import { extractFieldComponents } from '../../utils/fieldFormatting.js'
import { FieldDisplay } from './FieldDisplayComponents.jsx'
import { formatStacDatetime } from '../../utils/datetime.js'

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

  // If no components were extracted, fall back to simple text rendering
  if (!components || components.length === 0) {
    // Smart datetime detection: check if value matches ISO 8601 datetime format
    // Matches patterns like: 2022-11-03T13:21:10.730Z, 2022-11-03T13:21:10Z, etc.
    if (
      typeof value === 'string' &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)
    ) {
      return formatStacDatetime(value)
    }
    return String(value || '')
  }

  return (
    <FieldDisplay fieldType={fieldType} components={components} field={field} />
  )
}

EnhancedFieldRenderer.propTypes = {
  field: PropTypes.string.isRequired,
  value: PropTypes.any.isRequired,
  item: PropTypes.object.isRequired
}

export default EnhancedFieldRenderer
