import React, { useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  Select,
  MenuItem,
  TextField,
  Checkbox,
  FormControl,
  InputLabel,
  FormControlLabel,
  Chip,
  OutlinedInput,
  Box,
  Alert
} from '@mui/material'
import RangeSliderWithInputs from '../RangeSliderWithInputs/RangeSliderWithInputs'
import { setQueryableFilters } from '../../redux/slices/mainSlice'
import { sanitizeFieldValue } from '../../utils/securityHelper'
import debounce from '../../utils/debounce'
import './QueryableFilters.css'

const QueryableFilters = () => {
  const dispatch = useDispatch()
  const selectedCollectionData = useSelector(
    (state) => state.mainSlice.selectedCollectionData
  )
  const queryableFilters = useSelector(
    (state) => state.mainSlice.queryableFilters
  )

  const queryables = selectedCollectionData?.queryables

  // Store debounced functions for each field to avoid recreating on each render
  const debouncedFunctionsRef = useRef({})

  // Centralized function to determine if a field should be excluded
  const isFieldExcluded = (fieldName) => {
    // Exclude specific fields
    if (['datetime', 'geometry', 'sci:doi'].includes(fieldName)) {
      return true
    }
    // Exclude all proj: prefixed fields
    if (fieldName.startsWith('proj:')) {
      return true
    }
    return false
  }

  // Initialize default values when queryables change
  // This MUST come before any conditional returns (Rules of Hooks)
  useEffect(() => {
    // Clear debounced functions when collection changes
    debouncedFunctionsRef.current = {}

    // Skip if no queryables or invalid
    if (
      !queryables ||
      typeof queryables !== 'object' ||
      Array.isArray(queryables) ||
      queryables.error === true
    ) {
      return
    }

    // Filter and process queryables
    const renderableFields = Object.entries(queryables).filter(
      ([fieldName, schema]) => {
        // Exclude specific fields
        if (isFieldExcluded(fieldName)) {
          return false
        }

        // Exclude complex types (objects with properties, arrays of objects, etc.)
        if (schema.type === 'object' && schema.properties) {
          return false
        }

        if (schema.type === 'array' && schema.items?.type === 'object') {
          return false
        }

        // Exclude union types (multiple types)
        if (Array.isArray(schema.type)) {
          return false
        }

        // Exclude if it has anyOf, oneOf, allOf
        if (schema.anyOf || schema.oneOf || schema.allOf) {
          return false
        }

        return true
      }
    )

    if (renderableFields.length === 0) return

    const newFilters = { ...queryableFilters }
    let hasChanges = false

    renderableFields.forEach(([fieldName, schema]) => {
      const defaultValue = schema.default
      // Only set default if field isn't already set and default exists
      if (
        defaultValue !== undefined &&
        queryableFilters[fieldName] === undefined
      ) {
        // For boolean fields, only set default if it's true
        // (false means "no filter" which is the unchecked state)
        if (schema.type === 'boolean' && defaultValue !== true) {
          return
        }

        const sanitizedValue =
          typeof defaultValue === 'string'
            ? sanitizeFieldValue(defaultValue, false)
            : defaultValue
        newFilters[fieldName] = sanitizedValue
        hasChanges = true
      }
    })

    if (hasChanges) {
      dispatch(setQueryableFilters(newFilters))
    }
  }, [selectedCollectionData?.id, queryables, queryableFilters])

  // Check if queryables has error (explicit check for error object from service)
  if (queryables?.error === true && queryables?.message) {
    return (
      <div className="searchContainer queryableFiltersError">
        <Alert severity="error">
          Unable to load filters: {queryables.message || 'Unknown error'}
        </Alert>
      </div>
    )
  }

  // Check if queryables exist and are a valid object
  // queryables IS the properties object (service returns json.properties directly)
  if (
    !queryables ||
    typeof queryables !== 'object' ||
    Array.isArray(queryables) ||
    Object.keys(queryables).length === 0
  ) {
    return null
  }

  // Filter and process queryables
  const renderableFields = Object.entries(queryables).filter(
    ([fieldName, schema]) => {
      // Exclude specific fields
      if (isFieldExcluded(fieldName)) {
        return false
      }

      // Exclude complex types (objects with properties, arrays of objects, etc.)
      if (schema.type === 'object' && schema.properties) {
        return false
      }

      if (schema.type === 'array' && schema.items?.type === 'object') {
        return false
      }

      // Exclude union types (multiple types)
      if (Array.isArray(schema.type)) {
        return false
      }

      // Exclude if it has anyOf, oneOf, allOf
      if (schema.anyOf || schema.oneOf || schema.allOf) {
        return false
      }

      return true
    }
  )

  // If no renderable fields after filtering, hide component
  if (renderableFields.length === 0) {
    return null
  }

  const handleFilterChange = (fieldName, value) => {
    // Sanitize value before storing
    const sanitizedValue =
      typeof value === 'string' ? sanitizeFieldValue(value, false) : value

    const newFilters = { ...queryableFilters }

    // Remove filter if value is empty/null
    if (
      sanitizedValue === null ||
      sanitizedValue === undefined ||
      sanitizedValue === '' ||
      (Array.isArray(sanitizedValue) && sanitizedValue.length === 0)
    ) {
      delete newFilters[fieldName]
    } else {
      newFilters[fieldName] = sanitizedValue
    }

    dispatch(setQueryableFilters(newFilters))
  }

  const renderField = (fieldName, schema) => {
    const label = schema.description || schema.title || fieldName
    const currentValue = queryableFilters[fieldName]
    const defaultValue = schema.default

    // Numeric field with min and max -> Range Slider
    if (
      (schema.type === 'number' || schema.type === 'integer') &&
      schema.minimum !== undefined &&
      schema.maximum !== undefined
    ) {
      const rangeValue = currentValue || { min: schema.minimum, max: schema.maximum }
      return (
        <div key={fieldName} className="queryableField">
          <RangeSliderWithInputs
            min={schema.minimum}
            max={schema.maximum}
            value={rangeValue}
            onChange={(value) => handleFilterChange(fieldName, value)}
            label={label}
            step={schema.type === 'integer' ? 1 : 0.1}
          />
        </div>
      )
    }

    // Numeric field without both min/max -> Text input
    if (schema.type === 'number' || schema.type === 'integer') {
      // Get or create debounced function for this field
      if (!debouncedFunctionsRef.current[fieldName]) {
        debouncedFunctionsRef.current[fieldName] = debounce((value) => {
          handleFilterChange(fieldName, value)
        }, 400)
      }
      const debouncedChange = debouncedFunctionsRef.current[fieldName]

      return (
        <div key={fieldName} className="queryableField">
          <FormControl fullWidth size="small">
            <TextField
              label={label}
              type="number"
              value={currentValue ?? defaultValue ?? ''}
              onChange={(e) => {
                const val =
                  e.target.value === '' ? null : Number(e.target.value)
                debouncedChange(val)
              }}
              size="small"
              inputProps={{
                step: schema.type === 'integer' ? 1 : 0.01
              }}
            />
          </FormControl>
        </div>
      )
    }

    // String enum -> Select dropdown
    if (schema.type === 'string' && schema.enum) {
      return (
        <div key={fieldName} className="queryableField">
          <FormControl fullWidth size="small">
            <InputLabel>{label}</InputLabel>
            <Select
              value={currentValue ?? defaultValue ?? ''}
              onChange={(e) => handleFilterChange(fieldName, e.target.value)}
              label={label}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {schema.enum.map((option) => (
                <MenuItem key={option} value={option}>
                  {sanitizeFieldValue(option, false)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
      )
    }

    // Array of string enums -> Multi-select with chips
    if (
      schema.type === 'array' &&
      schema.items?.enum &&
      schema.items?.type === 'string'
    ) {
      return (
        <div key={fieldName} className="queryableField">
          <FormControl fullWidth size="small">
            <InputLabel>{label}</InputLabel>
            <Select
              multiple
              value={currentValue ?? defaultValue ?? []}
              onChange={(e) => handleFilterChange(fieldName, e.target.value)}
              input={<OutlinedInput label={label} />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip
                      key={value}
                      label={sanitizeFieldValue(value, false)}
                      size="small"
                    />
                  ))}
                </Box>
              )}
            >
              {schema.items.enum.map((option) => (
                <MenuItem key={option} value={option}>
                  {sanitizeFieldValue(option, false)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
      )
    }

    // Boolean -> Checkbox
    if (schema.type === 'boolean') {
      return (
        <div key={fieldName} className="queryableField">
          <FormControlLabel
            control={
              <Checkbox
                checked={currentValue === true}
                onChange={(e) =>
                  handleFilterChange(fieldName, e.target.checked ? true : null)
                }
              />
            }
            label={label}
          />
        </div>
      )
    }

    // String field without enum -> Not supported for now
    // Could add text input if needed
    return null
  }

  return (
    <div className="queryableFilters">
      {renderableFields.map(([fieldName, schema]) =>
        renderField(fieldName, schema)
      )}
    </div>
  )
}

export default QueryableFilters
