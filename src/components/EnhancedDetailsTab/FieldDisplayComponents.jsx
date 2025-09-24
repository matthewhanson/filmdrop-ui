/**
 * FIELD DISPLAY COMPONENTS
 * React components for rendering different types of STAC fields
 * Replaces HTML string generation with type-safe React components
 */

import React from 'react'
import PropTypes from 'prop-types'
import { getFieldSpec } from '../../utils/fieldDiscovery.js'
import { sanitizeFieldValue } from '../../utils/securityHelper.js'

/**
 * Grid Field Display Component
 * Renders MGRS, WRS, UTM grid systems with individual subfield values
 */
export const GridFieldDisplay = ({ components, field, spec }) => {
  if (!components || components.length === 0) return null

  const currentLower = (field || '').toLowerCase()

  // Check if this is a specific sub-field that should show only its value
  const isSpecificGridSubfield = [
    'wrs_path',
    'wrs_row',
    'wrs_type',
    'utm_zone',
    'latitude_band',
    'grid_square',
    'tile',
    'zone',
    'grid:code'
  ].some((k) => currentLower.includes(k))

  if (isSpecificGridSubfield) {
    // Find the matching component
    let comp = components.find(
      (c) => (c.source || '').toLowerCase() === currentLower
    )
    if (!comp) {
      comp = components.find(
        (c) =>
          c.label &&
          currentLower.includes(c.label.replace(/\s+/g, '_').toLowerCase())
      )
    }

    if (comp) {
      const displayValue = currentLower.includes('wrs_type')
        ? `WRS-${String(comp.value).toUpperCase()}`
        : String(comp.value)

      return sanitizeFieldValue(displayValue, false)
    }
  }

  // Render composite grid information
  const systemName = sanitizeFieldValue(components[0]?.system || 'GRID', false)
  const seen = new Set()
  const parts = components
    .filter((c) => {
      const key = sanitizeFieldValue(c.label, false).toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .map((c) => {
      const sanitizedLabel = sanitizeFieldValue(c.label, false)
      const sanitizedValue = sanitizeFieldValue(c.value, false)
      const text = String(sanitizedValue)
      const truncated = text.length > 64 ? `${text.slice(0, 61)}...` : text
      return { label: sanitizedLabel, value: truncated }
    })

  return (
    <>
      <span className="grid-system-name">{systemName}:</span>
      <br />
      {parts.map((part, index) => (
        <span key={index} className="grid-component">
          {part.label}: {part.value}
          {index < parts.length - 1 && <br />}
        </span>
      ))}
    </>
  )
}

/**
 * Coordinate Field Display Component
 * Renders lat/lon coordinates and bounding boxes
 */
export const CoordinateFieldDisplay = ({ components, spec }) => {
  if (!components || components.length === 0) return null

  const c = components[0]

  if (c.type === 'centroid') {
    const lat =
      typeof c.lat === 'number'
        ? c.lat.toFixed(6)
        : sanitizeFieldValue(c.lat, false)
    const lon =
      typeof c.lon === 'number'
        ? c.lon.toFixed(6)
        : sanitizeFieldValue(c.lon, false)

    return `Lat: ${lat}°, Lon: ${lon}°`
  }

  if (c.type === 'bbox') {
    const minLon =
      typeof c.minLon === 'number'
        ? c.minLon.toFixed(6)
        : sanitizeFieldValue(c.minLon, false)
    const minLat =
      typeof c.minLat === 'number'
        ? c.minLat.toFixed(6)
        : sanitizeFieldValue(c.minLat, false)
    const maxLon =
      typeof c.maxLon === 'number'
        ? c.maxLon.toFixed(6)
        : sanitizeFieldValue(c.maxLon, false)
    const maxLat =
      typeof c.maxLat === 'number'
        ? c.maxLat.toFixed(6)
        : sanitizeFieldValue(c.maxLat, false)

    return `BBox: [${minLon}, ${minLat}] – [${maxLon}, ${maxLat}]`
  }

  return sanitizeFieldValue(c.value ?? '', false)
}

/**
 * Shape Field Display Component
 * Renders image dimensions and shapes
 */
export const ShapeFieldDisplay = ({ components, spec }) => {
  if (!components || components.length === 0) return null

  const c = components[0]

  if (c.type === 'shape') {
    const width =
      typeof c.width === 'number'
        ? c.width.toLocaleString()
        : sanitizeFieldValue(c.width, false)
    const height =
      typeof c.height === 'number'
        ? c.height.toLocaleString()
        : sanitizeFieldValue(c.height, false)

    return `Shape: ${width} × ${height} px`
  }

  return sanitizeFieldValue(c.value ?? '', false)
}

/**
 * Boolean Field Display Component
 * Renders true/false values as Yes/No
 */
export const BooleanFieldDisplay = ({ components, spec }) => {
  if (!components || components.length === 0) return null

  const value = components[0].value
  return value ? 'Yes' : 'No'
}

/**
 * Percentage Field Display Component
 * Renders percentage values with % symbol
 */
export const PercentageFieldDisplay = ({ components, spec }) => {
  if (!components || components.length === 0) return null

  return `${sanitizeFieldValue(components[0].value, false)}%`
}

/**
 * Standard Field Display Component
 * Renders general text, numbers, dates, and other standard values
 */
export const StandardFieldDisplay = ({ components, field, spec }) => {
  if (!components || components.length === 0) return null

  const value = components[0]?.value ?? ''
  const sanitizedValue = sanitizeFieldValue(value, false)

  return sanitizedValue
}

/**
 * Universal Field Display Component
 * Routes to appropriate specialized component based on field type
 */
export const FieldDisplay = ({ fieldType, components, field, item }) => {
  const spec = getFieldSpec(field, item)

  switch (fieldType) {
    case 'grid':
      return (
        <GridFieldDisplay components={components} field={field} spec={spec} />
      )
    case 'coordinate':
      return <CoordinateFieldDisplay components={components} spec={spec} />
    case 'shape':
      return <ShapeFieldDisplay components={components} spec={spec} />
    case 'boolean':
      return <BooleanFieldDisplay components={components} spec={spec} />
    case 'percentage':
      return <PercentageFieldDisplay components={components} spec={spec} />
    default:
      return (
        <StandardFieldDisplay
          components={components}
          field={field}
          spec={spec}
        />
      )
  }
}

// PropTypes validation
GridFieldDisplay.propTypes = {
  components: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      value: PropTypes.any,
      system: PropTypes.string,
      source: PropTypes.string
    })
  ).isRequired,
  field: PropTypes.string.isRequired,
  spec: PropTypes.object
}

CoordinateFieldDisplay.propTypes = {
  components: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.string,
      lat: PropTypes.number,
      lon: PropTypes.number,
      minLon: PropTypes.number,
      minLat: PropTypes.number,
      maxLon: PropTypes.number,
      maxLat: PropTypes.number,
      value: PropTypes.any
    })
  ).isRequired,
  spec: PropTypes.object
}

ShapeFieldDisplay.propTypes = {
  components: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.string,
      width: PropTypes.number,
      height: PropTypes.number,
      value: PropTypes.any
    })
  ).isRequired,
  spec: PropTypes.object
}

BooleanFieldDisplay.propTypes = {
  components: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.bool
    })
  ).isRequired,
  spec: PropTypes.object
}

PercentageFieldDisplay.propTypes = {
  components: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.any
    })
  ).isRequired,
  spec: PropTypes.object
}

StandardFieldDisplay.propTypes = {
  components: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.any
    })
  ).isRequired,
  field: PropTypes.string.isRequired,
  spec: PropTypes.object
}

FieldDisplay.propTypes = {
  fieldType: PropTypes.string.isRequired,
  components: PropTypes.array.isRequired,
  field: PropTypes.string.isRequired,
  item: PropTypes.object.isRequired
}
