import React, { useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { TextField, FormControl, Alert } from '@mui/material'
import RangeSliderWithInputs from '../RangeSliderWithInputs/RangeSliderWithInputs'
import MultiSelect from '../MultiSelect/MultiSelect'
import Checkbox from '../Checkbox/Checkbox'
import { setQueryableFilters } from '../../redux/slices/mainSlice'
import { sanitizeFieldValue } from '../../utils/securityHelper'
import debounce from '../../utils/debounce'
import { useRenderableQueryables } from '../../hooks/useRenderableQueryables'
import './QueryableFilters.css'

const QueryableFilters = () => {
  const dispatch = useDispatch()
  const selectedCollectionData = useSelector(
    (state) => state.mainSlice.selectedCollectionData
  )
  const queryableFilters = useSelector(
    (state) => state.mainSlice.queryableFilters
  )

  // Use custom hook to get filtered and sorted queryable fields
  const { fields: renderableFields, error } = useRenderableQueryables()

  // Store debounced functions for each field to avoid recreating on each render
  const debouncedFunctionsRef = useRef({})

  // Initialize default values when queryables change
  // This MUST come before any conditional returns (Rules of Hooks)
  useEffect(() => {
    // Clear debounced functions when collection changes
    debouncedFunctionsRef.current = {}

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
  }, [selectedCollectionData?.id, renderableFields, queryableFilters, dispatch])

  // Check if queryables has error (from the hook)
  if (error) {
    return (
      <div className="searchContainer queryableFiltersError">
        <Alert severity="error">
          Unable to load filters: {error.message || 'Unknown error'}
        </Alert>
      </div>
    )
  }

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

    // Enum values (string, number, or integer) -> MultiSelect
    if (
      schema.enum &&
      (schema.type === 'string' ||
        schema.type === 'number' ||
        schema.type === 'integer')
    ) {
      const options = schema.enum.map((option) => ({
        value: option,
        label: sanitizeFieldValue(String(option), false)
      }))

      return (
        <div key={fieldName} className="queryableField">
          <MultiSelect
            label={label}
            value={currentValue ?? defaultValue ?? []}
            onChange={(newValue) => handleFilterChange(fieldName, newValue)}
            options={options}
          />
        </div>
      )
    }

    // String field without enum -> Text input for string equivalence queries
    if (schema.type === 'string') {
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
              type="text"
              value={currentValue ?? defaultValue ?? ''}
              onChange={(e) => {
                const val = e.target.value === '' ? null : e.target.value
                debouncedChange(val)
              }}
              size="small"
            />
          </FormControl>
        </div>
      )
    }

    // Boolean -> Checkbox
    if (schema.type === 'boolean') {
      return (
        <div key={fieldName} className="queryableField">
          <Checkbox
            label={label}
            checked={currentValue === true}
            onChange={(e) =>
              handleFilterChange(fieldName, e.target.checked ? true : null)
            }
          />
        </div>
      )
    }

    // Unsupported schema type
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
