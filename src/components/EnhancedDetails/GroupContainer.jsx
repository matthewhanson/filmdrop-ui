import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import Collapse from '@mui/material/Collapse'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { normalizeGroupName } from '../../utils/fieldGrouping.js'
import { useAccordionState } from '../../contexts/AccordionStateContext.jsx'

/**
 * Reusable group container component for consistent styling and accessibility
 */
const GroupContainer = React.memo(
  ({
    groupName,
    children,
    className = 'field-group',
    gridClassName = 'field-grid',
    role = 'group',
    defaultExpanded = false,
    renderChildrenInGrid = true,
    count
  }) => {
    const normalizedGroupName = useMemo(
      () => normalizeGroupName(groupName),
      [groupName]
    )
    const { isExpanded, toggleGroup } = useAccordionState()
    const open = isExpanded(groupName, defaultExpanded)

    const onToggle = () => toggleGroup(groupName, open)

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
            <span className="field-group-title-end">
              {count !== undefined && !open && (
                <span className="field-group-count-badge">{count}</span>
              )}
              {open ? (
                <KeyboardArrowUpIcon className="collapse-icon" />
              ) : (
                <KeyboardArrowDownIcon className="collapse-icon" />
              )}
            </span>
          </button>
        </h3>
        <Collapse in={open} timeout="auto">
          {renderChildrenInGrid ? (
            <div
              className={gridClassName}
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
  gridClassName: PropTypes.string,
  role: PropTypes.string,
  defaultExpanded: PropTypes.bool,
  renderChildrenInGrid: PropTypes.bool,
  count: PropTypes.number
}

GroupContainer.displayName = 'GroupContainer'

export default GroupContainer
