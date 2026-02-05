import React from 'react'
import PropTypes from 'prop-types'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Card from '../Card/Card'
import './ButtonGroup.css'

const ButtonGroup = ({ label, buttons, className = '' }) => {
  const activeValue = buttons.find((b) => b.active)?.value ?? null

  const handleChange = (_event, newValue) => {
    if (newValue === null) {
      // Re-clicking the active button — still fire its handler
      const active = buttons.find((b) => b.active)
      if (active && !active.disabled) {
        active.onClick()
      }
      return
    }
    const button = buttons.find((b) => b.value === newValue)
    if (button && !button.disabled) {
      button.onClick()
    }
  }

  return (
    <Card height="auto" label={label} className={`ButtonGroup ${className}`}>
      <ToggleButtonGroup
        value={activeValue}
        exclusive
        onChange={handleChange}
        fullWidth
        className="ButtonGroup__buttons"
      >
        {buttons.map((button) => (
          <ToggleButton
            key={button.value}
            value={button.value}
            disabled={button.disabled}
            className="ButtonGroup__button"
          >
            {button.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Card>
  )
}

ButtonGroup.propTypes = {
  label: PropTypes.string,
  buttons: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      onClick: PropTypes.func.isRequired,
      active: PropTypes.bool,
      disabled: PropTypes.bool
    })
  ).isRequired,
  className: PropTypes.string
}

export default ButtonGroup
