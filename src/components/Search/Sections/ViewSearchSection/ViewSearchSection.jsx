import React from 'react'
import './ViewSearchSection.css'
import { useSelector, useDispatch } from 'react-redux'
import { setshowSearchByGeom, setautoCenterOnItemChanged } from '../../../../redux/slices/mainSlice'
import ViewSelector from '../../../ViewSelector/ViewSelector'
import Checkbox from '../../../Checkbox/Checkbox'
import { newSearch } from '../../../../utils/searchHelper'

const ViewSearchSection = () => {
  const dispatch = useDispatch()
  const appConfig = useSelector((state) => state.mainSlice.appConfig)
  const autoCenterOnItemChanged = useSelector(
    (state) => state.mainSlice.autoCenterOnItemChanged
  )
  const mosaicTilerURL = appConfig.MOSAIC_TILER_URL || ''

  const handleSearchClick = () => {
    // Flush any pending text input changes by triggering blur
    // This ensures debounced Redux updates complete before search executes
    const textInputs = document.querySelectorAll('.TextField__input input')
    textInputs.forEach((input) => input.blur())

    newSearch()
    dispatch(setshowSearchByGeom(false))
  }

  const handleAutoZoomChange = (e) => {
    dispatch(setautoCenterOnItemChanged(e.target.checked))
  }

  return (
    <div className="ViewSearchSection">
      <h2 className="ViewSearchSection__heading">View & Search</h2>
      <div className="ViewSearchSection__content">
        {mosaicTilerURL && <ViewSelector />}
        {appConfig.SHOW_ITEM_AUTO_ZOOM && (
          <Checkbox
            label="Item Auto-Zoom"
            checked={autoCenterOnItemChanged}
            onChange={handleAutoZoomChange}
          />
        )}
        <button
          className="searchButton"
          onClick={handleSearchClick}
        >
          Search
        </button>
      </div>
    </div>
  )
}

export default ViewSearchSection
