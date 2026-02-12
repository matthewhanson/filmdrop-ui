import React, { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setSelectedVisualization } from '../../redux/slices/mainSlice'
import { getCollectionVisualizations } from '../../utils/configHelper'
import Dropdown from '../Dropdown/Dropdown'

const VisualizationDropdown = () => {
  const dispatch = useDispatch()
  const selectedCollection = useSelector(
    (state) => state.mainSlice.selectedCollection
  )
  const selectedVisualization = useSelector(
    (state) => state.mainSlice.selectedVisualization
  )

  const { visualizations, visualizationKeys, hasVisualizations } =
    useMemo(() => {
      return selectedCollection
        ? getCollectionVisualizations(selectedCollection)
        : {
            visualizations: null,
            visualizationKeys: [],
            hasVisualizations: false
          }
    }, [selectedCollection])

  // Build dropdown options from visualizations
  const options = useMemo(() => {
    return visualizationKeys.map((key) => ({
      value: key,
      label: visualizations[key]?.title || key
    }))
  }, [visualizations, visualizationKeys])

  // Auto-select first visualization when collection changes and has visualizations
  useEffect(() => {
    if (hasVisualizations && !selectedVisualization) {
      dispatch(setSelectedVisualization(visualizationKeys[0]))
    }
  }, [
    selectedCollection,
    hasVisualizations,
    selectedVisualization,
    visualizationKeys,
    dispatch
  ])

  const handleVisualizationChange = (e) => {
    dispatch(setSelectedVisualization(e.target.value))
  }

  // Only render if collection has multiple visualizations
  if (visualizationKeys.length <= 1) return null

  return (
    <Dropdown
      label="Visualization"
      value={selectedVisualization || visualizationKeys[0] || ''}
      onChange={handleVisualizationChange}
      options={options}
    />
  )
}

export default VisualizationDropdown
