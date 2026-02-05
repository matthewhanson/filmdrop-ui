import React, { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { TextField as MuiTextField } from '@mui/material'
import Card from '../Card/Card'
import debounce from '../../utils/debounce'
import './TextField.css'

const TextField = ({
  label,
  value,
  onChange,
  type = 'text',
  className = '',
  debounceDelay = 300
}) => {
  // Local state for immediate UI updates (prevents stuttering)
  const [localValue, setLocalValue] = useState(value)

  // Ref to store debounced function
  const debouncedOnChange = useRef(null)

  // Ref to store latest onChange (avoids recreating debounce on every render)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  // Create debounced onChange function
  useEffect(() => {
    debouncedOnChange.current = debounce((val) => {
      onChangeRef.current(val)
    }, debounceDelay)

    // Cleanup on unmount or when dependencies change
    return () => {
      if (debouncedOnChange.current?.cancel) {
        debouncedOnChange.current.cancel()
      }
    }
  }, [debounceDelay])

  // Sync local state when external value changes
  useEffect(() => {
    if (value !== localValue) {
      setLocalValue(value)
    }
  }, [value])

  // Handle local input changes
  const handleLocalChange = (e) => {
    const newValue = e.target.value
    setLocalValue(newValue) // Immediate UI update
    if (debouncedOnChange.current) {
      debouncedOnChange.current(newValue) // Debounced Redux dispatch
    }
  }

  return (
    <Card label={label} className={`TextField ${className}`}>
      <MuiTextField
        className="TextField__input"
        type={type}
        value={localValue}
        onChange={handleLocalChange}
        variant="outlined"
        fullWidth
      />
    </Card>
  )
}

TextField.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  type: PropTypes.oneOf(['text', 'number']),
  className: PropTypes.string,
  debounceDelay: PropTypes.number
}

export default TextField
