import React from 'react'
import './DisplayActionsSection.css'
import { useSelector, useDispatch } from 'react-redux'
import { setshowSearchByGeom, setautoCenterOnItemChanged } from '../../../../redux/slices/mainSlice'
import ViewSelector from '../../../ViewSelector/ViewSelector'
import Checkbox from '../../../Checkbox/Checkbox'
import { newSearch } from '../../../../utils/searchHelper'

const DisplayActionsSection = () => {
  const dispatch = useDispatch()
  const appConfig = useSelector((state) => state.mainSlice.appConfig)
  const autoCenterOnItemChanged = useSelector(
    (state) => state.mainSlice.autoCenterOnItemChanged
  )
  const mosaicTilerURL = appConfig.MOSAIC_TILER_URL || ''

  const handleSearchClick = () => {
    newSearch()
    dispatch(setshowSearchByGeom(false))
  }

  const handleAutoZoomChange = (e) => {
    dispatch(setautoCenterOnItemChanged(e.target.checked))
  }

  const hasViewMode = !!mosaicTilerURL
  const hasAutoZoom = !!appConfig.SHOW_ITEM_AUTO_ZOOM
  const showSectionHeading = hasViewMode || hasAutoZoom

  return (
    <div className="DisplayActionsSection">
      {showSectionHeading && (
        <div className="DisplayActionsSection__heading">Display & Actions</div>
      )}
      <div className="DisplayActionsSection__content">
        {mosaicTilerURL && <ViewSelector />}
        {appConfig.SHOW_ITEM_AUTO_ZOOM && (
          <Checkbox
            label="Item Auto-Zoom"
            checked={autoCenterOnItemChanged}
            onChange={handleAutoZoomChange}
          />
        )}
        <button
          className="actionButton searchButton"
          onClick={handleSearchClick}
        >
          Search
        </button>
      </div>
    </div>
  )
}

export default DisplayActionsSection
