import React, { useEffect, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Checkbox as MuiCheckbox } from '@mui/material'
import { getCollectionVisualizations } from '../../utils/configHelper'
import { useUrlNavigate } from '../../hooks/useUrlNavigate'
import { setShowSceneOverlay } from '../../redux/slices/mainSlice'
import { clearLayer, debounceTitilerOverlay } from '../../utils/mapHelper'
import Dropdown from '../Dropdown/Dropdown'
import './VisualizationDropdown.css'

const VisualizationDropdown = () => {
  const dispatch = useDispatch()
  const { setViz } = useUrlNavigate()
  const selectedCollection = useSelector(
    (state) => state.mainSlice.selectedCollection
  )
  const selectedVisualization = useSelector(
    (state) => state.mainSlice.selectedVisualization
  )
  const showSceneOverlay = useSelector(
    (state) => state.mainSlice.showSceneOverlay
  )
  const currentPopupResult = useSelector(
    (state) => state.mainSlice.currentPopupResult
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
      setViz(visualizationKeys[0])
    }
  }, [
    selectedCollection,
    hasVisualizations,
    selectedVisualization,
    visualizationKeys
  ])

  const handleVisualizationChange = (e) => {
    setViz(e.target.value)
  }

  const handleShowOnMapChange = (e) => {
    const checked = e.target.checked
    dispatch(setShowSceneOverlay(checked))
    if (checked) {
      if (currentPopupResult) {
        debounceTitilerOverlay(currentPopupResult)
      }
    } else {
      clearLayer('clickedSceneImageLayer')
    }
  }

  // Only render if collection has multiple visualizations
  if (visualizationKeys.length <= 1) return null

  return (
    <Dropdown
      label="Visualization"
      value={selectedVisualization || visualizationKeys[0] || ''}
      onChange={handleVisualizationChange}
      options={options}
    >
      <label className="VisualizationDropdown__checkbox">
        <MuiCheckbox
          checked={showSceneOverlay}
          onChange={handleShowOnMapChange}
          size="small"
        />
        <span>Show on map</span>
      </label>
    </Dropdown>
  )
}

export default VisualizationDropdown
