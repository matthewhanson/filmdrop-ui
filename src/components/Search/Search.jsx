import { React, useEffect } from 'react'
import './Search.css'
import { useDispatch, useSelector } from 'react-redux'
import { setshowSearchByGeom } from '../../redux/slices/mainSlice'
import 'react-tooltip/dist/react-tooltip.css'
import CollectionSection from './Sections/CollectionSection/CollectionSection'
import LocationDateSection from './Sections/LocationDateSection/LocationDateSection'
import FiltersSection from './Sections/FiltersSection/FiltersSection'
import ViewSearchSection from './Sections/ViewSearchSection/ViewSearchSection'

const Search = () => {
  const dispatch = useDispatch()
  const _selectedCollectionData = useSelector(
    (state) => state.mainSlice.selectedCollectionData
  )
  const _searchDateRangeValue = useSelector(
    (state) => state.mainSlice.searchDateRangeValue
  )
  const _viewMode = useSelector((state) => state.mainSlice.viewMode)

  useEffect(() => {
    dispatch(setshowSearchByGeom(false))
  }, [_selectedCollectionData, _searchDateRangeValue, _viewMode])

  return (
    <div className="Search" data-testid="Search">
      <div className="Search__scrollable">
        <CollectionSection />
        <LocationDateSection />
        <FiltersSection />
      </div>
      <ViewSearchSection />
    </div>
  )
}

export default Search
