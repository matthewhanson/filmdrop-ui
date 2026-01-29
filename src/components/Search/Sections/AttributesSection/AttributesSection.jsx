import React from 'react'
import './AttributesSection.css'
import QueryableFilters from '../../../QueryableFilters/QueryableFilters'
import { useRenderableQueryables } from '../../../../hooks/useRenderableQueryables'

const AttributesSection = () => {
  // Use custom hook to check if there are any renderable fields
  const { hasFields } = useRenderableQueryables()

  // Don't render the entire section if there are no renderable fields
  if (!hasFields) {
    return null
  }

  return (
    <div className="AttributesSection">
      <h2 className="AttributesSection__heading">Filters</h2>
      <div className="AttributesSection__content">
        <QueryableFilters />
      </div>
    </div>
  )
}

export default AttributesSection
