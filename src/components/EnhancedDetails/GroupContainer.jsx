import React, { useState, useMemo } from 'react'
import PropTypes from 'prop-types'
import Collapse from '@mui/material/Collapse'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { normalizeGroupName } from '../../utils/fieldGrouping.js'

/**
 * Reusable group container component for consistent styling and accessibility
 */
const GroupContainer = React.memo(
  ({
    groupName,
    children,
    className = 'field-group',
    role = 'group',
    defaultExpanded = false,
    renderChildrenInGrid = true
  }) => {
    const normalizedGroupName = useMemo(
      () => normalizeGroupName(groupName),
      [groupName]
    )
    const [open, setOpen] = useState(!!defaultExpanded)

    const onToggle = () => setOpen((prev) => !prev)

    return (
      <div
        className={className}
        role={role}
        aria-labelledby={`group-${normalizedGroupName}`}
      >
        <h3 className="field-group-title" id={`group-${normalizedGroupName}`}>
          <button
            type="button"
            className="field-group-title-button"
            aria-expanded={open}
            aria-controls={`group-content-${normalizedGroupName}`}
            onClick={onToggle}
          >
            <span className="field-group-title-text">{groupName}</span>
            {open ? (
              <KeyboardArrowUpIcon className="collapse-icon" />
            ) : (
              <KeyboardArrowDownIcon className="collapse-icon" />
            )}
          </button>
        </h3>
        <Collapse in={open} timeout="auto">
          {renderChildrenInGrid ? (
            <div
              className="field-grid"
              role="list"
              id={`group-content-${normalizedGroupName}`}
            >
              {children}
            </div>
          ) : (
            <div id={`group-content-${normalizedGroupName}`}>{children}</div>
          )}
        </Collapse>
      </div>
    )
  }
)

GroupContainer.propTypes = {
  groupName: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  role: PropTypes.string,
  defaultExpanded: PropTypes.bool,
  renderChildrenInGrid: PropTypes.bool
}

GroupContainer.displayName = 'GroupContainer'

export default GroupContainer
