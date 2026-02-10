import React, { useState } from 'react'
import { Slider } from '@mui/material'
import PropTypes from 'prop-types'
import Card from '../Card/Card'
import './RangeSliderWithInputs.css'

const RangeSliderWithInputs = ({
  min,
  max,
  value,
  onChange,
  label,
  step = 1
}) => {
  const [minInput, setMinInput] = useState(value.min)
  const [maxInput, setMaxInput] = useState(value.max)
  const [isEditingMin, setIsEditingMin] = useState(false)
  const [isEditingMax, setIsEditingMax] = useState(false)

  const handleSliderChange = (event, newValue) => {
    if (onChange) {
      onChange({ min: newValue[0], max: newValue[1] })
      setMinInput(newValue[0])
      setMaxInput(newValue[1])
    }
  }

  const handleMinChange = (e) => {
    setMinInput(e.target.value)
  }

  const handleMaxChange = (e) => {
    setMaxInput(e.target.value)
  }

  const handleMinBlur = () => {
    setIsEditingMin(false)
    let newMin = Number(minInput)

    // Validate and clamp
    if (isNaN(newMin) || newMin < min) newMin = min
    if (newMin > max) newMin = max
    if (newMin > value.max) newMin = value.max

    setMinInput(newMin)
    if (onChange && newMin !== value.min) {
      onChange({ min: newMin, max: value.max })
    }
  }

  const handleMaxBlur = () => {
    setIsEditingMax(false)
    let newMax = Number(maxInput)

    // Validate and clamp
    if (isNaN(newMax) || newMax < min) newMax = min
    if (newMax > max) newMax = max
    if (newMax < value.min) newMax = value.min

    setMaxInput(newMax)
    if (onChange && newMax !== value.max) {
      onChange({ min: value.min, max: newMax })
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur()
    }
  }

  return (
    <Card height="auto" className="rangeSliderWithInputs">
      <div className="rangeSliderHeader">
        <label className="rangeSliderLabel">{label}</label>
        <div className="rangeSliderValuePills">
          <input
            type="number"
            className="rangeSliderValuePill"
            value={isEditingMin ? minInput : value.min}
            onChange={handleMinChange}
            onFocus={() => setIsEditingMin(true)}
            onBlur={handleMinBlur}
            onKeyDown={handleKeyDown}
            min={min}
            max={max}
            step={step}
            aria-label={`${label} minimum value`}
          />
          <span className="rangeSliderValueSeparator">—</span>
          <input
            type="number"
            className="rangeSliderValuePill"
            value={isEditingMax ? maxInput : value.max}
            onChange={handleMaxChange}
            onFocus={() => setIsEditingMax(true)}
            onBlur={handleMaxBlur}
            onKeyDown={handleKeyDown}
            min={min}
            max={max}
            step={step}
            aria-label={`${label} maximum value`}
          />
        </div>
      </div>
      <div className="rangeSliderTrackContainer">
        <Slider
          value={[value.min, value.max]}
          onChange={handleSliderChange}
          min={min}
          max={max}
          step={step}
          disableSwap
          className="rangeSlider"
        />
      </div>
    </Card>
  )
}

RangeSliderWithInputs.propTypes = {
  min: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  value: PropTypes.shape({
    min: PropTypes.number.isRequired,
    max: PropTypes.number.isRequired
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  step: PropTypes.number
}

export default RangeSliderWithInputs
