import React from 'react'
import PropTypes from 'prop-types'
import './Section.css'

const Section = ({ heading, children, className = '' }) => {
  return (
    <div className={`Section ${className}`}>
      {heading && <div className="Section__heading">{heading}</div>}
      <div className="Section__content">{children}</div>
    </div>
  )
}

Section.propTypes = {
  heading: PropTypes.string,
  children: PropTypes.node.isRequired,
  className: PropTypes.string
}

export default Section
