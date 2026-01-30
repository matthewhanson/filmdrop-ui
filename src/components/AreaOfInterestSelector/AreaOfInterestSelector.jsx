import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  setshowSearchByGeom,
  setisDrawingEnabled,
  setsearchGeojsonBoundary,
  setshowUploadGeojsonModal
} from '../../redux/slices/mainSlice'
import ButtonGroup from '../ButtonGroup/ButtonGroup'
import { enableMapPolyDrawing, clearLayer, zoomToCollectionExtent } from '../../utils/mapHelper'
import './AreaOfInterestSelector.css'

const AreaOfInterestSelector = () => {
  const dispatch = useDispatch()
  const [selectedAOI, setSelectedAOI] = useState('mapview')

  const searchGeojsonBoundary = useSelector(
    (state) => state.mainSlice.searchGeojsonBoundary
  )
  const showSearchByGeom = useSelector(
    (state) => state.mainSlice.showSearchByGeom
  )
  const isDrawingEnabled = useSelector(
    (state) => state.mainSlice.isDrawingEnabled
  )
  const showUploadGeojsonModal = useSelector(
    (state) => state.mainSlice.showUploadGeojsonModal
  )
  const selectedCollectionData = useSelector(
    (state) => state.mainSlice.selectedCollectionData
  )

  // Reset to map view when draw/upload is cancelled or boundary is cleared
  useEffect(() => {
    // If drawing was cancelled (Draw button selected but drawing disabled and no boundary)
    if (selectedAOI === 'draw' && !isDrawingEnabled && !searchGeojsonBoundary) {
      setSelectedAOI('mapview')
      return
    }
    // If upload was cancelled (Upload button selected but modal closed and no boundary)
    if (selectedAOI === 'upload' && !showUploadGeojsonModal && !searchGeojsonBoundary) {
      setSelectedAOI('mapview')
      return
    }
    // If boundary is cleared externally while not in active draw/upload mode
    if (!searchGeojsonBoundary && !showSearchByGeom && !showUploadGeojsonModal && selectedAOI !== 'mapview') {
      setSelectedAOI('mapview')
    }
  }, [searchGeojsonBoundary, showSearchByGeom, isDrawingEnabled, showUploadGeojsonModal, selectedAOI])

  const handleDraw = () => {
    // Clear any existing boundary to allow redrawing
    if (searchGeojsonBoundary) {
      dispatch(setsearchGeojsonBoundary(null))
      clearLayer('drawBoundsLayer')
    }
    setSelectedAOI('draw')
    dispatch(setshowSearchByGeom(true))
    dispatch(setisDrawingEnabled(true))
    enableMapPolyDrawing()
  }

  const handleUpload = () => {
    // Clear any existing boundary to allow reuploading
    if (searchGeojsonBoundary) {
      dispatch(setsearchGeojsonBoundary(null))
      clearLayer('drawBoundsLayer')
    }
    setSelectedAOI('upload')
    dispatch(setshowSearchByGeom(false))
    dispatch(setshowUploadGeojsonModal(true))
  }

  const handleMapView = () => {
    setSelectedAOI('mapview')
    // Clear any drawn boundary when switching to map view
    dispatch(setsearchGeojsonBoundary(null))
    dispatch(setshowSearchByGeom(false))
    clearLayer('drawBoundsLayer')

    // Optionally zoom to collection extents if available
    if (selectedCollectionData) {
      zoomToCollectionExtent(selectedCollectionData)
    }
  }

  const buttons = [
    {
      value: 'draw',
      label: 'Draw',
      onClick: handleDraw,
      active: selectedAOI === 'draw',
      disabled: false
    },
    {
      value: 'upload',
      label: 'Upload',
      onClick: handleUpload,
      active: selectedAOI === 'upload',
      disabled: false
    },
    {
      value: 'mapview',
      label: 'Map View',
      onClick: handleMapView,
      active: selectedAOI === 'mapview',
      disabled: false
    }
  ]

  return <ButtonGroup label="Area of Interest" buttons={buttons} />
}

export default AreaOfInterestSelector
