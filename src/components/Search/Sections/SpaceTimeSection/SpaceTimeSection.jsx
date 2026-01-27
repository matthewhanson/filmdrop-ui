import React from 'react'
import './SpaceTimeSection.css'
import { useSelector, useDispatch } from 'react-redux'
import {
  setshowSearchByGeom,
  setisDrawingEnabled,
  setsearchGeojsonBoundary,
  setshowUploadGeojsonModal
} from '../../../../redux/slices/mainSlice'
import DateTimeRangeSelector from '../../../DateTimeRangeSelector/DateTimeRangeSelector'
import ButtonGroup from '../../../ButtonGroup/ButtonGroup'
import { enableMapPolyDrawing, clearLayer, zoomToCollectionExtent } from '../../../../utils/mapHelper'

const SpaceTimeSection = () => {
  const dispatch = useDispatch()
  const searchGeojsonBoundary = useSelector(
    (state) => state.mainSlice.searchGeojsonBoundary
  )
  const selectedCollectionData = useSelector(
    (state) => state.mainSlice.selectedCollectionData
  )
  const appConfig = useSelector((state) => state.mainSlice.appConfig)

  const handleDraw = () => {
    if (searchGeojsonBoundary) return
    dispatch(setshowSearchByGeom(true))
    dispatch(setisDrawingEnabled(true))
    enableMapPolyDrawing()
  }

  const handleUpload = () => {
    if (searchGeojsonBoundary) return
    dispatch(setshowSearchByGeom(false))
    dispatch(setshowUploadGeojsonModal(true))
  }

  const handleExtents = () => {
    if (selectedCollectionData) {
      zoomToCollectionExtent(selectedCollectionData)
      // Clear any drawn boundary when zooming to extents
      dispatch(setsearchGeojsonBoundary(null))
      dispatch(setshowSearchByGeom(false))
      clearLayer('drawBoundsLayer')
    }
  }

  const buttons = [
    {
      value: 'draw',
      label: 'Draw',
      onClick: handleDraw,
      active: false,
      disabled: !!searchGeojsonBoundary
    },
    {
      value: 'upload',
      label: 'Upload',
      onClick: handleUpload,
      active: false,
      disabled: !!searchGeojsonBoundary
    },
    {
      value: 'extents',
      label: 'Extents',
      onClick: handleExtents,
      active: false,
      disabled: false
    }
  ]

  return (
    <div className="SpaceTimeSection">
      <div className="SpaceTimeSection__heading">Space & Time</div>
      <div className="SpaceTimeSection__content">
        <DateTimeRangeSelector />
        {appConfig.SEARCH_BY_GEOM_ENABLED && (
          <ButtonGroup label="Area of Interest" buttons={buttons} />
        )}
      </div>
    </div>
  )
}

export default SpaceTimeSection
