import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import {
  isQueryableRenderable,
  getQueryableRenderOrder
} from '../utils/queryableExclusion'

/**
 * Custom hook to get filtered and sorted renderable queryable fields
 * @returns {Object} { fields: Array, hasFields: boolean, error: Object | null }
 */
export const useRenderableQueryables = () => {
  const selectedCollectionData = useSelector(
    (state) => state.mainSlice.selectedCollectionData
  )
  const appConfig = useSelector((state) => state.mainSlice.appConfig)
  const excludedQueryables = appConfig?.EXCLUDED_QUERYABLES || []

  const queryables = selectedCollectionData?.queryables

  return useMemo(() => {
    // Check for explicit error from service
    if (queryables?.error === true) {
      return {
        fields: [],
        hasFields: false,
        error: {
          message: queryables.message || 'Unknown error'
        }
      }
    }

    // Return empty result if queryables are invalid
    if (
      !queryables ||
      typeof queryables !== 'object' ||
      Array.isArray(queryables)
    ) {
      return {
        fields: [],
        hasFields: false,
        error: null
      }
    }

    // Filter queryables based on config patterns and schema complexity
    const filtered = Object.entries(queryables).filter(([fieldName, schema]) =>
      isQueryableRenderable(fieldName, schema, excludedQueryables)
    )

    // Sort by component type: RangeSliderWithInputs, MultiSelect, Dropdown, TextField, Checkbox
    const sorted = filtered.sort((a, b) => {
      const orderA = getQueryableRenderOrder(a[1]) ?? Infinity
      const orderB = getQueryableRenderOrder(b[1]) ?? Infinity
      return orderA - orderB
    })

    return {
      fields: sorted,
      hasFields: sorted.length > 0,
      error: null
    }
  }, [queryables, excludedQueryables])
}
