import { React, useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setViewMode } from '../../redux/slices/mainSlice'
import './ViewSelector.css'
import { Stack, Tooltip } from '@mui/material'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import ButtonGroup from '@mui/material/ButtonGroup'
import { getCurrentMapZoomLevel } from '../../utils/mapHelper'
import { getCollectionConfig } from '../../utils/configHelper'

const DEFAULT_MED_ZOOM = 4
const DEFAULT_HIGH_ZOOM = 7

const ViewSelector = () => {
  const _viewMode = useSelector((state) => state.mainSlice.viewMode)
  const _selectedCollectionData = useSelector(
    (state) => state.mainSlice.selectedCollectionData
  )
  const _map = useSelector((state) => state.mainSlice.map)

  const dispatch = useDispatch()
  const [selectedView, setSelectedView] = useState(_viewMode)
  const [currentZoom, setCurrentZoom] = useState(0)
  const [prevCollectionId, setPrevCollectionId] = useState(null)
  const [isManualSelection, setIsManualSelection] = useState(false)

  // Check if collection supports hex and grid aggregations
  const supportsHex = _selectedCollectionData?.aggregations?.some(
    (el) => el.name === 'grid_geohex_frequency'
  )
  const supportsGrid = _selectedCollectionData?.aggregations?.some(
    (el) => el.name === 'grid_code_frequency'
  )

  // Get zoom level requirements
  const searchMinZoomLevels = _selectedCollectionData
    ? getCollectionConfig(_selectedCollectionData.id, 'searchMinZoomLevels')
    : null
  const midZoomLevel = searchMinZoomLevels?.medium || DEFAULT_MED_ZOOM
  const highZoomLevel = searchMinZoomLevels?.high || DEFAULT_HIGH_ZOOM

  // Reset to default view when collection changes
  useEffect(() => {
    if (
      _selectedCollectionData &&
      _selectedCollectionData.id !== prevCollectionId
    ) {
      setPrevCollectionId(_selectedCollectionData.id)
      // Default to hex if available, otherwise grid, otherwise scene
      const defaultView = supportsHex
        ? 'hex'
        : supportsGrid
          ? 'grid-code'
          : 'scene'
      setSelectedView(defaultView)
      setIsManualSelection(false) // Reset manual selection flag on collection change
    }
  }, [_selectedCollectionData, supportsHex, supportsGrid])

  // Update current zoom when map changes
  useEffect(() => {
    if (_map && _map.on) {
      const updateZoom = () => {
        setCurrentZoom(getCurrentMapZoomLevel())
      }
      _map.on('zoomend', updateZoom)
      updateZoom() // Initial update

      return () => {
        _map.off('zoomend', updateZoom)
      }
    }
  }, [_map])

  // Auto-switch view based on zoom level (only when not manually selected)
  useEffect(() => {
    if (isManualSelection) return // Don't auto-switch if user manually selected a view
    if (selectedView === 'mosaic') return // Don't auto-switch in mosaic mode

    const canUseScene = currentZoom >= highZoomLevel
    const isAtMidZoom =
      currentZoom >= midZoomLevel && currentZoom < highZoomLevel
    const isBelowMidZoom = currentZoom < midZoomLevel

    // Auto-switch based on zoom and available aggregations
    if (canUseScene) {
      // High zoom: switch to scene if not already there
      if (selectedView !== 'scene') {
        setSelectedView('scene')
      }
    } else if (isAtMidZoom) {
      // Mid zoom: prefer grid-code if available, otherwise hex
      if (supportsGrid && selectedView !== 'grid-code') {
        setSelectedView('grid-code')
      } else if (supportsHex && !supportsGrid && selectedView !== 'hex') {
        setSelectedView('hex')
      }
    } else if (isBelowMidZoom) {
      // Low zoom: prefer hex if available, otherwise grid-code
      if (supportsHex && selectedView !== 'hex') {
        setSelectedView('hex')
      } else if (supportsGrid && !supportsHex && selectedView !== 'grid-code') {
        setSelectedView('grid-code')
      }
    }
  }, [
    currentZoom,
    highZoomLevel,
    midZoomLevel,
    supportsHex,
    supportsGrid,
    selectedView,
    isManualSelection
  ])

  // Update Redux state when view changes
  useEffect(() => {
    dispatch(setViewMode(selectedView))
  }, [selectedView, dispatch])

  // Only scene view requires high zoom level
  const canUseScene = currentZoom >= highZoomLevel

  const handleViewChange = (view) => {
    setSelectedView(view)
    setIsManualSelection(true) // Mark as manual selection
  }

  return (
    <Stack sx={{ width: 165 }} className="viewSelector">
      <label htmlFor="ViewModeToggle">View Mode</label>
      <Grid container spacing={2} alignItems="center">
        <Grid size="grow">
          <ButtonGroup
            variant="contained"
            aria-label="view mode button group"
            fullWidth
            size="small"
          >
            <Tooltip
              title={
                !supportsHex
                  ? 'Hex aggregation not available for this collection'
                  : ''
              }
              arrow
              disableInteractive
            >
              <span>
                <Button
                  color={selectedView === 'hex' ? 'primary' : 'secondary'}
                  onClick={() => handleViewChange('hex')}
                  disabled={!supportsHex}
                >
                  Hex
                </Button>
              </span>
            </Tooltip>

            <Tooltip
              title={
                !supportsGrid
                  ? 'Grid aggregation not available for this collection'
                  : ''
              }
              arrow
              disableInteractive
            >
              <span>
                <Button
                  color={selectedView === 'grid-code' ? 'primary' : 'secondary'}
                  onClick={() => handleViewChange('grid-code')}
                  disabled={!supportsGrid}
                >
                  Grid
                </Button>
              </span>
            </Tooltip>

            <Tooltip
              title={
                !canUseScene
                  ? `Zoom to level ${highZoomLevel} or higher for scene view`
                  : ''
              }
              arrow
              disableInteractive
            >
              <span>
                <Button
                  color={selectedView === 'scene' ? 'primary' : 'secondary'}
                  onClick={() => handleViewChange('scene')}
                  disabled={!canUseScene}
                >
                  Scene
                </Button>
              </span>
            </Tooltip>

            <Tooltip
              title={
                !canUseScene
                  ? `Zoom to level ${highZoomLevel} or higher for mosaic view`
                  : ''
              }
              arrow
              disableInteractive
            >
              <span>
                <Button
                  color={selectedView === 'mosaic' ? 'primary' : 'secondary'}
                  onClick={() => handleViewChange('mosaic')}
                  disabled={!canUseScene}
                >
                  Mosaic
                </Button>
              </span>
            </Tooltip>
          </ButtonGroup>
        </Grid>
      </Grid>
    </Stack>
  )
}

export default ViewSelector
