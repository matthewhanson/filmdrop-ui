import React, { useRef, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import Tooltip from '@mui/material/Tooltip'
import EnhancedFieldRenderer from './EnhancedFieldRenderer.jsx'

/**
 * TruncatedFieldValue Component
 * Wraps EnhancedFieldRenderer with smart text truncation detection
 * Truncates text without spaces when it overflows its container, shows tooltip with full text
 */
const TruncatedFieldValue = ({ field, value }) => {
  const containerRef = useRef(null)
  const [shouldTruncate, setShouldTruncate] = useState(true)
  const [displayText, setDisplayText] = useState('')

  useEffect(() => {
    if (!containerRef.current) return

    const checkOverflow = () => {
      if (!containerRef.current) return

      const text = containerRef.current.textContent || ''

      // Get the parent container width (field-value-inline)
      const parent = containerRef.current.parentElement
      if (!parent) {
        setShouldTruncate(false)
        return
      }

      const parentWidth = parent.clientWidth

      // Skip measurement when element is not visible (e.g., inside display:none tab)
      if (parentWidth === 0) return

      // Temporarily apply nowrap to check if text would overflow
      const originalWhiteSpace = containerRef.current.style.whiteSpace
      containerRef.current.style.whiteSpace = 'nowrap'

      const wouldOverflow = containerRef.current.scrollWidth > parentWidth

      // Restore original style
      containerRef.current.style.whiteSpace = originalWhiteSpace

      setShouldTruncate(wouldOverflow)
      setDisplayText(text)
    }

    // Use ResizeObserver to detect when container size changes (e.g., panel resize)
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(checkOverflow)
    })

    resizeObserver.observe(containerRef.current)

    // Initial check
    requestAnimationFrame(checkOverflow)

    return () => resizeObserver.disconnect()
  }, [field, value])

  return (
    <Tooltip
      title={displayText}
      placement="top"
      disableHoverListener={!shouldTruncate}
      componentsProps={{
        tooltip: {
          className: 'tooltip-field-label'
        }
      }}
    >
      <span
        ref={containerRef}
        className={shouldTruncate ? 'field-value-truncated' : ''}
      >
        <EnhancedFieldRenderer field={field} value={value} />
      </span>
    </Tooltip>
  )
}

TruncatedFieldValue.propTypes = {
  field: PropTypes.string.isRequired,
  value: PropTypes.any.isRequired
}

export default TruncatedFieldValue
