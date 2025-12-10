import { React, useState, useEffect } from 'react'
import './VisualizationSelector.css'
import { Stack } from '@mui/material'
import Grid from '@mui/material/Grid'
import NativeSelect from '@mui/material/NativeSelect'
import { useDispatch, useSelector } from 'react-redux'
import { setSelectedVisualization } from '../../redux/slices/mainSlice'
import { getCollectionConfig } from '../../utils/configHelper'

/**
 * Gets the default visualization key, preferring the selected visualization
 * if it's valid for the current collection, otherwise returns the first available.
 *
 * @param {string[]} visualizationKeys - Available visualization keys for collection
 * @param {string|null} selectedVisualization - Currently selected visualization from Redux
 * @returns {string|null} Valid visualization key or null if none available
 */
const getDefaultVisualizationKey = (
  visualizationKeys,
  selectedVisualization
) => {
  if (
    selectedVisualization &&
    visualizationKeys.includes(selectedVisualization)
  ) {
    return selectedVisualization
  }
  return visualizationKeys[0] || null
}

const VisualizationSelector = () => {
  const _selectedCollectionData = useSelector(
    (state) => state.mainSlice.selectedCollectionData
  )
  const _viewMode = useSelector((state) => state.mainSlice.viewMode)
  const _appConfig = useSelector((state) => state.mainSlice.appConfig)
  const _selectedVisualization = useSelector(
    (state) => state.mainSlice.selectedVisualization
  )

  const dispatch = useDispatch()

  const visualizations = _selectedCollectionData
    ? getCollectionConfig(_selectedCollectionData.id, 'visualizations')
    : null

  const visualizationKeys = visualizations ? Object.keys(visualizations) : []
  const visualizationCount = visualizationKeys.length

  const [visualizationKey, setVisualizationKey] = useState(() =>
    getDefaultVisualizationKey(visualizationKeys, _selectedVisualization)
  )
  const [prevCollectionId, setPrevCollectionId] = useState(
    _selectedCollectionData?.id || null
  )

  useEffect(() => {
    if (!_selectedCollectionData) return

    if (_selectedCollectionData.id !== prevCollectionId) {
      setPrevCollectionId(_selectedCollectionData.id)
      setVisualizationKey(
        getDefaultVisualizationKey(visualizationKeys, _selectedVisualization)
      )
    } else if (
      (visualizationKey && !visualizationKeys.includes(visualizationKey)) ||
      (!visualizationKey && visualizationKeys.length > 0)
    ) {
      setVisualizationKey(
        getDefaultVisualizationKey(visualizationKeys, _selectedVisualization)
      )
    }
  }, [
    _selectedCollectionData,
    prevCollectionId,
    visualizationKeys,
    visualizationKey,
    _selectedVisualization
  ])

  useEffect(() => {
    dispatch(setSelectedVisualization(visualizationKey || null))
  }, [visualizationKey, dispatch])

  // Redux state persists when component unmounts (viewMode !== 'scene')
  // This preserves user selection. Validation happens on remount via useEffect above.

  if (_viewMode !== 'scene') {
    return null
  }

  if (!_appConfig?.SCENE_TILER_URL) {
    return null
  }

  if (visualizationCount <= 1) {
    return null
  }

  function onVisualizationChanged(e) {
    setVisualizationKey(e.target.value)
  }

  return (
    <Stack>
      <label htmlFor="visualizationDropdown">Visualization</label>
      <Grid container alignItems="center">
        <Grid size="grow">
          <NativeSelect
            id="visualizationDropdown"
            value={visualizationKey || ''}
            label="Visualization"
            onChange={(e) => onVisualizationChanged(e)}
          >
            {visualizationKeys.map((key) => {
              const vis = visualizations[key]
              const displayText = vis?.title || key
              return (
                <option key={key} value={key}>
                  {displayText}
                </option>
              )
            })}
          </NativeSelect>
        </Grid>
      </Grid>
    </Stack>
  )
}

export default VisualizationSelector
