import React from 'react'
import './LocationDateSection.css'
import { useSelector } from 'react-redux'
import DateTimeRangeSelector from '../../../DateTimeRangeSelector/DateTimeRangeSelector'
import AreaOfInterestSelector from '../../../AreaOfInterestSelector/AreaOfInterestSelector'

const LocationDateSection = () => {
  const appConfig = useSelector((state) => state.mainSlice.appConfig)

  return (
    <div className="LocationDateSection">
      <h2 className="LocationDateSection__heading">Location & Date</h2>
      <div className="LocationDateSection__content">
        {appConfig.SEARCH_BY_GEOM_ENABLED && <AreaOfInterestSelector />}
        <DateTimeRangeSelector />
      </div>
    </div>
  )
}

export default LocationDateSection
