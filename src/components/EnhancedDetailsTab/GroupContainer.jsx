import React from 'react'
import PropTypes from 'prop-types'

/**
 * Reusable group container component for consistent styling and accessibility
 */
const GroupContainer = React.memo(
  ({
    groupName,
    children,
    className = 'field-group',
    gridClassName = 'field-grid',
    gridLayout = 'default',
    role = 'group'
  }) => {
    const normalizedGroupName = groupName.toLowerCase().replace(/\s+/g, '-')

    return (
      <div
        className={className}
        role={role}
        aria-labelledby={`group-${normalizedGroupName}`}
      >
        <h3 className="field-group-title" id={`group-${normalizedGroupName}`}>
          {groupName}
        </h3>
        <div
          className={`${gridClassName} ${gridLayout === 'two-column' ? 'field-grid-two-column' : ''}`}
          role="list"
        >
          {children}
        </div>
      </div>
    )
  }
)

GroupContainer.propTypes = {
  groupName: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  gridClassName: PropTypes.string,
  gridLayout: PropTypes.oneOf(['default', 'two-column']),
  role: PropTypes.string
}

GroupContainer.displayName = 'GroupContainer'

export default GroupContainer
