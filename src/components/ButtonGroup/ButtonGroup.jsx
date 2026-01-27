import React from 'react'
import PropTypes from 'prop-types'
import Card from '../Card/Card'
import './ButtonGroup.css'

const ButtonGroup = ({ label, buttons, className = '' }) => {
  return (
    <Card height={80} label={label} className={`ButtonGroup ${className}`}>
      <div className="ButtonGroup__buttons">
        {buttons.map((button) => (
          <button
            key={button.value}
            className={`ButtonGroup__button ${button.active ? 'ButtonGroup__button--active' : ''} ${button.disabled ? 'ButtonGroup__button--disabled' : ''}`}
            onClick={button.onClick}
            disabled={button.disabled}
          >
            {button.label}
          </button>
        ))}
      </div>
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
