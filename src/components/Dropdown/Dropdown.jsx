import React from 'react'
import PropTypes from 'prop-types'
import { NativeSelect } from '@mui/material'
import Card from '../Card/Card'
import './Dropdown.css'

const Dropdown = ({ label, value, onChange, options, className = '' }) => {
  return (
    <Card height={80} label={label} className={`Dropdown ${className}`}>
      <NativeSelect
        className="Dropdown__select"
        value={value}
        onChange={onChange}
        disableUnderline
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </NativeSelect>
    </Card>
  )
}

Dropdown.propTypes = {
  label: PropTypes.string,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })
  ).isRequired,
  className: PropTypes.string
}

export default Dropdown
