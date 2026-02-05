import React, { useEffect } from 'react'
import './Search.css'
import { useDispatch, useSelector } from 'react-redux'
import {
  setshowSearchByGeom,
  setautoCenterOnItemChanged
} from '../../redux/slices/mainSlice'
import CollectionDropdown from '../CollectionDropdown/CollectionDropdown'
import DateTimeRangeSelector from '../DateTimeRangeSelector/DateTimeRangeSelector'
import AreaOfInterestSelector from '../AreaOfInterestSelector/AreaOfInterestSelector'
import QueryableFilters from '../QueryableFilters/QueryableFilters'
import ViewSelector from '../ViewSelector/ViewSelector'
import Checkbox from '../Checkbox/Checkbox'
import { useRenderableQueryables } from '../../hooks/useRenderableQueryables'
import { newSearch } from '../../utils/searchHelper'

const Search = () => {
  const dispatch = useDispatch()
  const appConfig = useSelector((state) => state.mainSlice.appConfig)
  const selectedCollectionData = useSelector(
    (state) => state.mainSlice.selectedCollectionData
  )
  const searchDateRangeValue = useSelector(
    (state) => state.mainSlice.searchDateRangeValue
  )
  const viewMode = useSelector((state) => state.mainSlice.viewMode)
  const autoCenterOnItemChanged = useSelector(
    (state) => state.mainSlice.autoCenterOnItemChanged
  )
  const { hasFields } = useRenderableQueryables()
  const mosaicTilerURL = appConfig.MOSAIC_TILER_URL || ''

  useEffect(() => {
    dispatch(setshowSearchByGeom(false))
  }, [dispatch, selectedCollectionData, searchDateRangeValue, viewMode])

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
    <div className="Search" data-testid="Search">
      <div className="Search__scrollable">
        {/* Collection Section */}
        <div className="Search__section">
          <CollectionDropdown />
        </div>

        {/* Location & Date Section */}
        <div className="Search__section">
          <h2 className="Search__section-heading">Location & Date</h2>
          <div className="Search__section-content">
            {appConfig.SEARCH_BY_GEOM_ENABLED && <AreaOfInterestSelector />}
            <DateTimeRangeSelector />
          </div>
        </div>

        {/* Filters Section */}
        {hasFields && (
          <div className="Search__section">
            <h2 className="Search__section-heading">Filters</h2>
            <div className="Search__section-content">
              <QueryableFilters />
            </div>
          </div>
        )}
      </div>

      {/* View & Search Section */}
      <div className="Search__section Search__section--footer">
        <h2 className="Search__section-heading">View & Search</h2>
        <div className="Search__section-content">
          {mosaicTilerURL && <ViewSelector />}
          {appConfig.SHOW_ITEM_AUTO_ZOOM && (
            <Checkbox
              label="Item Auto-Zoom"
              checked={autoCenterOnItemChanged}
              onChange={handleAutoZoomChange}
            />
          )}
          <button className="Search__button" onClick={handleSearchClick}>
            Search
          </button>
        </div>
      </div>
    </div>
  )
}

export default Search
