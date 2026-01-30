import React from 'react'
import './FiltersSection.css'
import QueryableFilters from '../../../QueryableFilters/QueryableFilters'
import { useRenderableQueryables } from '../../../../hooks/useRenderableQueryables'

const FiltersSection = () => {
  // Use custom hook to check if there are any renderable fields
  const { hasFields } = useRenderableQueryables()

  // Don't render the entire section if there are no renderable fields
  if (!hasFields) {
    return null
  }

  return (
    <div className="FiltersSection">
      <h2 className="FiltersSection__heading">Filters</h2>
      <div className="FiltersSection__content">
        <QueryableFilters />
      </div>
    </div>
  )
}

export default FiltersSection
