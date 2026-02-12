import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import FieldItem from './FieldItem.jsx'
import GroupContainer from './GroupContainer.jsx'

/**
 * FieldGroup Component
 * Unified component for rendering field groups in both configured and default formats
 */
const FieldGroup = React.memo(function FieldGroup({
  group,
  sortFields,
  isConfigured = false,
  defaultExpanded = false
}) {
  const { groupName, fields } = useMemo(() => {
    const groupName = isConfigured ? group[0] : group.name
    const fields = isConfigured ? group[1] : group.fields
    return { groupName, fields }
  }, [group, isConfigured])

  // Early return for empty fields
  if (
    !fields ||
    (isConfigured && Object.keys(fields).length === 0) ||
    (!isConfigured && fields.length === 0)
  ) {
    return null
  }

  const fieldItems = useMemo(() => {
    return isConfigured
      ? sortFields
        ? sortFields(fields)
        : Object.entries(fields)
      : fields.map((field) => [field.name, field.value])
  }, [fields, sortFields, isConfigured])

  const groupTitle = isConfigured
    ? groupName.charAt(0).toUpperCase() + groupName.slice(1)
    : groupName

  return (
    <GroupContainer
      groupName={groupTitle}
      defaultExpanded={defaultExpanded}
      count={fieldItems.length}
    >
      {fieldItems.map(([field, value]) => (
        <FieldItem key={field} field={field} value={value} />
      ))}
    </GroupContainer>
  )
})

FieldGroup.propTypes = {
  group: PropTypes.oneOfType([PropTypes.array, PropTypes.object]).isRequired,
  sortFields: PropTypes.func,
  isConfigured: PropTypes.bool,
  defaultExpanded: PropTypes.bool
}

export default FieldGroup
