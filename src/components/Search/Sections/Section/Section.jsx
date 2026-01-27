import React from 'react'
import './Section.css'

const Section = ({ heading, children, className = '' }) => {
  return (
    <div className={`Section ${className}`}>
      {heading && <div className="Section__heading">{heading}</div>}
      <div className="Section__content">{children}</div>
    </div>
  )
}

export default Section
