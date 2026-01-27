import React, { useEffect, useRef, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { TextField, FormControl, Alert } from '@mui/material'
import RangeSliderWithInputs from '../RangeSliderWithInputs/RangeSliderWithInputs'
import Dropdown from '../Dropdown/Dropdown'
import MultiSelect from '../MultiSelect/MultiSelect'
import Checkbox from '../Checkbox/Checkbox'
import { setQueryableFilters } from '../../redux/slices/mainSlice'
import { sanitizeFieldValue } from '../../utils/securityHelper'
import { isFieldExcluded } from '../../utils/fieldMatchesPattern'
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
  const appConfig = useSelector((state) => state.mainSlice.appConfig)
  const excludedQueryables = appConfig?.EXCLUDED_QUERYABLES || []

  const queryables = selectedCollectionData?.queryables

  // Store debounced functions for each field to avoid recreating on each render
  const debouncedFunctionsRef = useRef({})

  // Memoize filtered renderable fields to avoid duplicating filter logic
  const renderableFields = useMemo(() => {
    // Return empty array if queryables are invalid
    if (
      !queryables ||
      typeof queryables !== 'object' ||
      Array.isArray(queryables) ||
      queryables.error === true
    ) {
      return []
    }

    // Filter and process queryables
    return Object.entries(queryables).filter(
      ([fieldName, schema]) => {
        // Exclude fields based on config
        if (isFieldExcluded(fieldName, excludedQueryables)) {
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
  }, [queryables, excludedQueryables])

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
      const options = [
        { value: '', label: 'None' },
        ...schema.enum.map((option) => ({
          value: option,
          label: sanitizeFieldValue(option, false)
        }))
      ]

      return (
        <div key={fieldName} className="queryableField">
          <Dropdown
            label={label}
            value={currentValue ?? defaultValue ?? ''}
            onChange={(e) => handleFilterChange(fieldName, e.target.value)}
            options={options}
          />
        </div>
      )
    }

    // Array of string enums -> Multi-select with chips
    if (
      schema.type === 'array' &&
      schema.items?.enum &&
      schema.items?.type === 'string'
    ) {
      const options = schema.items.enum.map((option) => ({
        value: option,
        label: sanitizeFieldValue(option, false)
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
