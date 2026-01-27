import React, { useMemo } from 'react'
import './AttributesSection.css'
import { useSelector } from 'react-redux'
import QueryableFilters from '../../../QueryableFilters/QueryableFilters'
import Section from '../Section/Section'
import { isFieldExcluded } from '../../../../utils/fieldMatchesPattern'

const AttributesSection = () => {
  const selectedCollectionData = useSelector(
    (state) => state.mainSlice.selectedCollectionData
  )
  const appConfig = useSelector((state) => state.mainSlice.appConfig)
  const excludedQueryables = appConfig?.EXCLUDED_QUERYABLES || []

  const queryables = selectedCollectionData?.queryables

  // Memoize whether there are any renderable queryable fields
  const hasRenderableFields = useMemo(() => {
    // Return false if queryables are invalid
    if (
      !queryables ||
      typeof queryables !== 'object' ||
      Array.isArray(queryables) ||
      queryables.error === true
    ) {
      return false
    }

    const properties = queryables.properties || {}

    // Filter out excluded fields and non-renderable types
    const renderableKeys = Object.keys(properties).filter((key) => {
      const field = properties[key]

      // Exclude based on pattern matching
      if (isFieldExcluded(key, excludedQueryables)) {
        return false
      }

      // Exclude datetime fields
      if (field.type === 'string' && field.format === 'date-time') {
        return false
      }

      // Exclude geometry fields
      if (field.type === 'object' || field.type === 'array') {
        return false
      }

      return true
    })

    return renderableKeys.length > 0
  }, [queryables, excludedQueryables])

  // Don't render the entire section if there are no renderable fields
  if (!hasRenderableFields) {
    return null
  }

  return (
    <Section heading="Attributes" className="AttributesSection">
      <QueryableFilters />
    </Section>
  )
}

export default AttributesSection
