import { React, useState, useEffect, useMemo } from 'react'
import './VisualizationSelector.css'
import { Stack } from '@mui/material'
import Grid from '@mui/material/Grid'
import NativeSelect from '@mui/material/NativeSelect'
import { useDispatch, useSelector } from 'react-redux'
import { setSelectedVisualization } from '../../redux/slices/mainSlice'
import {
  getCollectionConfig,
  getCollectionVisualizations
} from '../../utils/configHelper'
import { router } from '../../router'

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

/**
 * VisualizationSelector component allows users to switch between available scene renderings
 * (e.g., true-color, false-color, NDVI) for each collection.
 *
 * @component
 * @description
 * - Only renders in Scene view mode (hidden in Mosaic view)
 * - Only displays when collection has 2+ visualizations (hides when 0 or 1)
 * - Requires SCENE_TILER_URL to be configured in app config
 * - Integrates with Redux to persist selected visualization across view mode changes
 * - Updates URL when visualization changes and user is viewing an item
 *
 * @returns {JSX.Element|null} The visualization selector dropdown or null if conditions not met
 */
const VisualizationSelector = () => {
  const _selectedCollectionData = useSelector(
    (state) => state.mainSlice.selectedCollectionData
  )
  const _viewMode = useSelector((state) => state.mainSlice.viewMode)
  const _appConfig = useSelector((state) => state.mainSlice.appConfig)
  const _selectedVisualization = useSelector(
    (state) => state.mainSlice.selectedVisualization
  )
  const _currentPopupResult = useSelector(
    (state) => state.mainSlice.currentPopupResult
  )

  const dispatch = useDispatch()

  const { visualizations, visualizationKeys } = useMemo(() => {
    return _selectedCollectionData
      ? getCollectionVisualizations(_selectedCollectionData.id)
      : {
          visualizations: null,
          visualizationKeys: []
        }
  }, [_selectedCollectionData])

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

  const onVisualizationChanged = (e) => {
    const newVisualizationKey = e.target.value
    setVisualizationKey(newVisualizationKey)

    // Update URL if user is viewing an item
    if (
      _currentPopupResult &&
      _currentPopupResult.collection &&
      _currentPopupResult.id
    ) {
      router.navigate({
        to: '/item/$collectionId/$itemId/{-$visualizationId}',
        params: {
          collectionId: _currentPopupResult.collection,
          itemId: _currentPopupResult.id,
          visualizationId: newVisualizationKey
        }
      })
    }
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
