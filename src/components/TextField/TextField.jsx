import React from 'react'
import PropTypes from 'prop-types'
import { TextField as MuiTextField } from '@mui/material'
import Card from '../Card/Card'
import './TextField.css'

const TextField = ({ label, value, onChange, type = 'text', className = '' }) => {
  return (
    <Card label={label} className={`TextField ${className}`}>
      <MuiTextField
        className="TextField__input"
        type={type}
        value={value}
        onChange={onChange}
        variant="outlined"
        fullWidth
      />
    </Card>
  )
}

TextField.propTypes = {
  label: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  type: PropTypes.oneOf(['text', 'number']),
  className: PropTypes.string
}

export default TextField
