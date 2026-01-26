import React, { useState, useEffect } from 'react'
import { Slider, Input, Stack, Grid } from '@mui/material'
import PropTypes from 'prop-types'
import './RangeSliderWithInputs.css'

const RangeSliderWithInputs = ({
  min,
  max,
  value,
  onChange,
  label,
  step
}) => {
  // Convert object to array for MUI Slider (which expects [min, max])
  const [sliderValue, setSliderValue] = useState([value.min, value.max])
  const [minInput, setMinInput] = useState(value.min)
  const [maxInput, setMaxInput] = useState(value.max)

  // Update local state when prop value changes (e.g., from Redux)
  useEffect(() => {
    setSliderValue([value.min, value.max])
    setMinInput(value.min)
    setMaxInput(value.max)
  }, [value.min, value.max])

  const handleSliderChange = (event, newValue) => {
    setSliderValue(newValue)
    setMinInput(newValue[0])
    setMaxInput(newValue[1])
    if (onChange) {
      onChange({ min: newValue[0], max: newValue[1] })
    }
  }

  const handleMinInputChange = (event) => {
    const val = event.target.value
    setMinInput(val === '' ? '' : Number(val))
  }

  const handleMaxInputChange = (event) => {
    const val = event.target.value
    setMaxInput(val === '' ? '' : Number(val))
  }

  const handleMinInputBlur = () => {
    let newMin = Number(minInput) || min
    const newMax = maxInput

    // Clamp to bounds
    if (newMin < min) newMin = min
    if (newMin > max) newMin = max
    // Ensure min <= max
    if (newMin > newMax) newMin = newMax

    setSliderValue([newMin, newMax])
    setMinInput(newMin)
    if (onChange) {
      onChange({ min: newMin, max: newMax })
    }
  }

  const handleMaxInputBlur = () => {
    let newMax = Number(maxInput) || max
    const newMin = minInput

    // Clamp to bounds
    if (newMax < min) newMax = min
    if (newMax > max) newMax = max
    // Ensure max >= min
    if (newMax < newMin) newMax = newMin

    setSliderValue([newMin, newMax])
    setMaxInput(newMax)
    if (onChange) {
      onChange({ min: newMin, max: newMax })
    }
  }

  return (
    <Stack className="rangeSliderWithInputs">
      {label && <label className="rangeSliderLabel">{label}</label>}
      <Grid
        className="rangeSliderControls"
        container
        spacing={2}
        alignItems="center"
      >
        <Grid size="auto">
          <Input
            value={minInput}
            onChange={handleMinInputChange}
            onBlur={handleMinInputBlur}
            size="small"
            className="rangeSliderInput"
            inputProps={{
              min,
              max,
              step,
              type: 'number',
              'aria-label': `${label} minimum`
            }}
          />
        </Grid>
        <Grid size="grow">
          <Slider
            value={sliderValue}
            onChange={handleSliderChange}
            min={min}
            max={max}
            step={step}
            disableSwap
            className="rangeSlider"
          />
        </Grid>
        <Grid size="auto">
          <Input
            value={maxInput}
            onChange={handleMaxInputChange}
            onBlur={handleMaxInputBlur}
            size="small"
            className="rangeSliderInput"
            inputProps={{
              min,
              max,
              step,
              type: 'number',
              'aria-label': `${label} maximum`
            }}
          />
        </Grid>
      </Grid>
    </Stack>
  )
}

RangeSliderWithInputs.propTypes = {
  min: PropTypes.number,
  max: PropTypes.number,
  value: PropTypes.shape({
    min: PropTypes.number.isRequired,
    max: PropTypes.number.isRequired
  }),
  onChange: PropTypes.func,
  label: PropTypes.string,
  step: PropTypes.number
}

export default RangeSliderWithInputs
