import React from 'react'
import PropTypes from 'prop-types'
import { Checkbox as MuiCheckbox } from '@mui/material'
import Card from '../Card/Card'
import './Checkbox.css'

const Checkbox = ({ label, checked, onChange, className = '' }) => {
  return (
    <Card height={80} className={`Checkbox ${className}`}>
      <label className="Checkbox__label">
        <MuiCheckbox
          checked={checked}
          onChange={onChange}
          className="Checkbox__input"
          disableRipple
        />
        <span className="Checkbox__text">{label}</span>
      </label>
    </Card>
  )
}

Checkbox.propTypes = {
  label: PropTypes.string.isRequired,
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string
}

export default Checkbox
