import React, { useEffect, useMemo } from 'react'
import './DateTimeRangeSelector.css'
import { useSelector, useDispatch } from 'react-redux'
import { setSearchDateRangeValue } from '../../redux/slices/mainSlice'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import Card from '../Card/Card'

dayjs.extend(utc)

const DateTimeRangeSelector = () => {
  const dispatch = useDispatch()
  const selectedCollectionData = useSelector(
    (state) => state.mainSlice.selectedCollectionData
  )
  const searchDateRangeValue = useSelector(
    (state) => state.mainSlice.searchDateRangeValue
  )

  // Memoized helper text for collection extent
  const collectionExtentText = useMemo(() => {
    if (!selectedCollectionData?.extent?.temporal?.interval?.[0]?.[0]) {
      return null
    }

    const startExtent = selectedCollectionData.extent.temporal.interval[0][0]
    const endExtent = selectedCollectionData.extent.temporal.interval[0][1]

    const startFormatted = dayjs(startExtent).format('YYYY-MM-DD')
    const endFormatted = endExtent
      ? dayjs(endExtent).format('YYYY-MM-DD')
      : 'Present'

    return `Available: ${startFormatted} to ${endFormatted}`
  }, [selectedCollectionData])

  // When collection changes, validate and update date range if needed
  useEffect(() => {
    if (!selectedCollectionData?.extent?.temporal?.interval?.[0]) {
      return
    }

    const collectionStart = selectedCollectionData.extent.temporal.interval[0][0]
    const collectionEnd = selectedCollectionData.extent.temporal.interval[0][1]

    if (!collectionStart) {
      return
    }

    const collectionStartDate = dayjs(collectionStart)
    const collectionEndDate = collectionEnd
      ? dayjs(collectionEnd)
      : dayjs() // Use current date if collection is ongoing

    const currentStartDate = dayjs(searchDateRangeValue[0])
    const currentEndDate = dayjs(searchDateRangeValue[1])

    // Update date range if current range is completely outside collection extent
    const isOutsideRange =
      (currentStartDate.isBefore(collectionStartDate) &&
        currentEndDate.isBefore(collectionStartDate)) ||
      (currentStartDate.isAfter(collectionEndDate) &&
        currentEndDate.isAfter(collectionEndDate))

    if (isOutsideRange) {
      dispatch(
        setSearchDateRangeValue([
          collectionStartDate.toISOString(),
          collectionEndDate.toISOString()
        ])
      )
    }
  }, [selectedCollectionData, dispatch]) // Intentionally NOT including searchDateRangeValue to avoid loops

  // Handle date changes - dispatch directly to Redux
  // MUI DatePicker passes dayjs objects directly
  const handleStartDateChange = (date) => {
    if (date && date.isValid()) {
      // Create new Date at start of day in UTC
      const utcDate = date.startOf('day').toISOString()
      dispatch(setSearchDateRangeValue([utcDate, searchDateRangeValue[1]]))
    }
  }

  const handleEndDateChange = (date) => {
    if (date && date.isValid()) {
      // Create new Date at end of day in UTC
      const utcDate = date.endOf('day').toISOString()
      dispatch(setSearchDateRangeValue([searchDateRangeValue[0], utcDate]))
    }
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Card label="Date Range (UTC)" className="datePicker">
        {collectionExtentText && (
          <div className="datePickerHelperText">{collectionExtentText}</div>
        )}
        <div className="datePickerContainer">
          <div className="datePickerInputWrapper">
            <DatePicker
              value={dayjs(searchDateRangeValue[0])}
              maxDate={dayjs(searchDateRangeValue[1])}
              format="YYYY-MM-DD"
              onChange={handleStartDateChange}
              slotProps={{
                textField: {
                  id: 'startDatePicker',
                  size: 'small'
                }
              }}
            />
            <label htmlFor="startDatePicker" className="datePickerInputLabel">From</label>
          </div>
          <div className="datePickerInputWrapper">
            <DatePicker
              value={dayjs(searchDateRangeValue[1])}
              minDate={dayjs(searchDateRangeValue[0])}
              maxDate={dayjs()}
              format="YYYY-MM-DD"
              onChange={handleEndDateChange}
              slotProps={{
                textField: {
                  id: 'endDatePicker',
                  size: 'small'
                }
              }}
            />
            <label htmlFor="endDatePicker" className="datePickerInputLabel">To</label>
          </div>
        </div>
      </Card>
    </LocalizationProvider>
  )
}

export default DateTimeRangeSelector
