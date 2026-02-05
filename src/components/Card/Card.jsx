import React from 'react'
import PropTypes from 'prop-types'
import './Card.css'

const Card = ({ height = 'auto', label, children, className = '' }) => {
  const style = height !== 'auto' ? { height: `${height}px` } : {}

  return (
    <div className={`Card ${className}`} style={style}>
      {label && <label className="Card__label">{label}</label>}
      <div className="Card__content">{children}</div>
    </div>
  )
}

Card.propTypes = {
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.oneOf(['auto'])]),
  label: PropTypes.string,
  children: PropTypes.node.isRequired,
  className: PropTypes.string
}

export default Card
