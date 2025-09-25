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
  item,
  isConfigured = false
}) {
  // Memoize group name and fields extraction
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

  // Memoize field items conversion and grouping logic
  const { fieldItems, fieldPairs, gridLayout } = useMemo(() => {
    const items = isConfigured
      ? sortFields
        ? sortFields(fields)
        : Object.entries(fields)
      : fields.map((field) => [field.name, field.value])

    // Layout determination with proper rules
    const itemsWithLayout = items.map(([field, value]) => {
      const fieldNameLength = String(field || '').length
      const valueLength = String(value || '').length

      let layout = 'default'

      // Rule 1: Very long values (>= 30 chars) get full width
      if (valueLength >= 30) {
        layout = 'full-width'
      }
      // Rule 2: Both field name AND value are long - use full width
      else if (fieldNameLength > 18 && valueLength > 18) {
        layout = 'full-width'
      }
      // Rule 3: Medium content (> 18 chars) can be paired in two columns
      else if (valueLength > 18) {
        layout = 'two-column'
      }
      // Rule 4: Long field names with short values can be paired
      else if (fieldNameLength > 18) {
        layout = 'two-column'
      }

      return [field, value, layout]
    })

    // Efficient pairing: pair consecutive non-full-width items
    const pairs = []
    const remaining = []
    const used = new Set()

    for (let i = 0; i < itemsWithLayout.length; i++) {
      if (used.has(i)) continue

      const [field, value, layout] = itemsWithLayout[i]

      if (layout === 'full-width') {
        remaining.push([field, value, layout])
        continue
      }

      // Find next available partner
      for (let j = i + 1; j < itemsWithLayout.length; j++) {
        if (used.has(j)) continue

        const [nextField, nextValue, nextLayout] = itemsWithLayout[j]
        if (nextLayout !== 'full-width') {
          pairs.push([
            [field, value, layout],
            [nextField, nextValue, nextLayout]
          ])
          used.add(i)
          used.add(j)
          break
        }
      }

      if (!used.has(i)) {
        remaining.push([field, value, layout])
      }
    }

    // Simple grid layout determination
    const totalItems = pairs.length * 2 + remaining.length
    const gridLayout =
      totalItems === 2 || pairs.length > 0 ? 'two-column' : 'default'

    return {
      fieldItems: remaining,
      fieldPairs: pairs,
      gridLayout
    }
  }, [fields, sortFields, isConfigured])

  const groupTitle = isConfigured
    ? groupName.charAt(0).toUpperCase() + groupName.slice(1)
    : groupName

  return (
    <GroupContainer groupName={groupTitle} gridLayout={gridLayout}>
      {/* Render field pairs */}
      {fieldPairs.map((pair, index) => (
        <div key={`pair-${index}`} className="field-pair">
          <FieldItem
            field={pair[0][0]}
            value={pair[0][1]}
            item={item}
            layout="default"
          />
          <FieldItem
            field={pair[1][0]}
            value={pair[1][1]}
            item={item}
            layout="default"
          />
        </div>
      ))}

      {/* Render individual items */}
      {fieldItems.map(([field, value, layout]) => (
        <FieldItem
          key={field}
          field={field}
          value={value}
          item={item}
          layout={layout}
        />
      ))}
    </GroupContainer>
  )
})

FieldGroup.propTypes = {
  group: PropTypes.oneOfType([PropTypes.array, PropTypes.object]).isRequired,
  sortFields: PropTypes.func,
  item: PropTypes.object.isRequired,
  isConfigured: PropTypes.bool
}

export default FieldGroup
