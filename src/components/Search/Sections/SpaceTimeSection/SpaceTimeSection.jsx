import React from 'react'
import './SpaceTimeSection.css'
import { useSelector, useDispatch } from 'react-redux'
import {
  setshowSearchByGeom,
  setisDrawingEnabled,
  setsearchGeojsonBoundary,
  setshowUploadGeojsonModal
} from '../../../../redux/slices/mainSlice'
import { Stack } from '@mui/material'
import DateTimeRangeSelector from '../../../DateTimeRangeSelector/DateTimeRangeSelector'
import Section from '../Section/Section'
import { enableMapPolyDrawing, clearLayer } from '../../../../utils/mapHelper'

const SpaceTimeSection = () => {
  const dispatch = useDispatch()
  const _showSearchByGeom = useSelector(
    (state) => state.mainSlice.showSearchByGeom
  )
  const _searchGeojsonBoundary = useSelector(
    (state) => state.mainSlice.searchGeojsonBoundary
  )
  const _appConfig = useSelector((state) => state.mainSlice.appConfig)

  function onDrawBoundaryClicked() {
    if (_searchGeojsonBoundary) {
      return
    }
    dispatch(setshowSearchByGeom(!_showSearchByGeom))
    dispatch(setisDrawingEnabled(true))
    enableMapPolyDrawing()
  }

  function onUploadGeojsonButtonClicked() {
    if (_searchGeojsonBoundary) {
      return
    }
    dispatch(setshowSearchByGeom(false))
    dispatch(setshowUploadGeojsonModal(true))
  }

  function onClearButtonClicked() {
    if (!_searchGeojsonBoundary) {
      return
    }
    dispatch(setsearchGeojsonBoundary(null))
    dispatch(setshowSearchByGeom(false))
    clearLayer('drawBoundsLayer')
  }

  return (
    <Section heading="Space & Time" className="SpaceTimeSection">
      <DateTimeRangeSelector />
      {_appConfig.SEARCH_BY_GEOM_ENABLED && (
        <div className="searchContainer searchBoundary">
          <Stack className="searchFilterContainer">
            <label
              htmlFor="searchByGeomOptionsContainer"
              className="searchByGeomOptionsText"
            >
              Area of Interest
            </label>
            <div className="searchByGeomOptionsButtons">
              <button
                className={
                  !_searchGeojsonBoundary
                    ? 'searchByGeomOptionsButton'
                    : 'searchByGeomOptionsButton ' +
                      'searchByGeomOptionsButtonDisabled'
                }
                onClick={onDrawBoundaryClicked}
              >
                Draw
              </button>
              <button
                className={
                  !_searchGeojsonBoundary
                    ? 'searchByGeomOptionsButton'
                    : 'searchByGeomOptionsButton ' +
                      'searchByGeomOptionsButtonDisabled'
                }
                onClick={onUploadGeojsonButtonClicked}
              >
                Upload
              </button>
              <button
                className={
                  _searchGeojsonBoundary
                    ? 'searchByGeomOptionsButton'
                    : 'searchByGeomOptionsButton ' +
                      'searchByGeomOptionsButtonDisabled'
                }
                onClick={onClearButtonClicked}
              >
                Clear
              </button>
            </div>
          </Stack>
        </div>
      )}
    </Section>
  )
}

export default SpaceTimeSection
