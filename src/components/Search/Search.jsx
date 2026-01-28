import { React, useEffect } from 'react'
import './Search.css'
import { useDispatch, useSelector } from 'react-redux'
import { setshowSearchByGeom } from '../../redux/slices/mainSlice'
import 'react-tooltip/dist/react-tooltip.css'
import CollectionSection from './Sections/CollectionSection/CollectionSection'
import SpaceTimeSection from './Sections/SpaceTimeSection/SpaceTimeSection'
import AttributesSection from './Sections/AttributesSection/AttributesSection'
import DisplayActionsSection from './Sections/DisplayActionsSection/DisplayActionsSection'

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
        <SpaceTimeSection />
        <AttributesSection />
      </div>
      <DisplayActionsSection />
    </div>
  )
}

export default Search
