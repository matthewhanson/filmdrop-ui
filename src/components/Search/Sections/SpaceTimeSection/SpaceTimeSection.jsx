import React from 'react'
import './SpaceTimeSection.css'
import { useSelector } from 'react-redux'
import DateTimeRangeSelector from '../../../DateTimeRangeSelector/DateTimeRangeSelector'
import AreaOfInterestSelector from '../../../AreaOfInterestSelector/AreaOfInterestSelector'

const SpaceTimeSection = () => {
  const appConfig = useSelector((state) => state.mainSlice.appConfig)

  return (
    <div className="SpaceTimeSection">
      <h2 className="SpaceTimeSection__heading">Location & Date</h2>
      <div className="SpaceTimeSection__content">
        {appConfig.SEARCH_BY_GEOM_ENABLED && <AreaOfInterestSelector />}
        <DateTimeRangeSelector />
      </div>
    </div>
  )
}

export default SpaceTimeSection
