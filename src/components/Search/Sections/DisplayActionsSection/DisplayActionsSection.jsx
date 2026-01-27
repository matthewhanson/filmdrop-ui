import React from 'react'
import './DisplayActionsSection.css'
import { useSelector, useDispatch } from 'react-redux'
import {
  setshowSearchByGeom,
  setautoCenterOnItemChanged
} from '../../../../redux/slices/mainSlice'
import { Stack, Switch } from '@mui/material'
import Section from '../Section/Section'
import ViewSelector from '../../../ViewSelector/ViewSelector'
import { newSearch } from '../../../../utils/searchHelper'

const DisplayActionsSection = () => {
  const dispatch = useDispatch()
  const _appConfig = useSelector((state) => state.mainSlice.appConfig)
  const _autoCenterOnItemChanged = useSelector(
    (state) => state.mainSlice.autoCenterOnItemChanged
  )
  const mosaicTilerURL = _appConfig.MOSAIC_TILER_URL || ''

  function processSearchBtn() {
    newSearch()
    dispatch(setshowSearchByGeom(false))
  }

  function updateAutoCenterState() {
    dispatch(setautoCenterOnItemChanged(!_autoCenterOnItemChanged))
  }

  // Determine if we should show the section heading
  // Hide heading if only Search button is visible
  const hasViewMode = !!mosaicTilerURL
  const hasAutoZoom = !!_appConfig.SHOW_ITEM_AUTO_ZOOM
  const showSectionHeading = hasViewMode || hasAutoZoom

  return (
    <Section 
      heading={showSectionHeading ? "Display & Actions" : null} 
      className="DisplayActionsSection"
    >
      <div className="DisplayActionsSection__content">
        {mosaicTilerURL && (
          <div className="searchContainer viewSelectorComponent">
            <ViewSelector />
          </div>
        )}
        {_appConfig.SHOW_ITEM_AUTO_ZOOM && (
          <div className="searchContainer viewSelectorComponent">
            <Stack className="searchFilterContainer">
              <label htmlFor="ItemAutoSearch">Item Auto-Zoom</label>
              <Switch
                checked={_autoCenterOnItemChanged}
                onChange={() => updateAutoCenterState()}
              />
            </Stack>
          </div>
        )}
        <div className="searchButtonContainer">
          <button
            className={`actionButton searchButton`}
            onClick={() => processSearchBtn()}
          >
            Search
          </button>
        </div>
      </div>
    </Section>
  )
}

export default DisplayActionsSection
