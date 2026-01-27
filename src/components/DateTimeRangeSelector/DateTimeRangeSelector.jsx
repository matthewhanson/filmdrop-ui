import React, { useEffect, useMemo } from 'react'
import './DateTimeRangeSelector.css'
import { useSelector, useDispatch } from 'react-redux'
import { setSearchDateRangeValue } from '../../redux/slices/mainSlice'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
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

  // Parse dates from Redux (single source of truth)
  const startDate = useMemo(
    () => new Date(searchDateRangeValue[0]),
    [searchDateRangeValue]
  )
  const endDate = useMemo(
    () => new Date(searchDateRangeValue[1]),
    [searchDateRangeValue]
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
  const handleStartDateChange = (date) => {
    if (date) {
      // Create new Date at start of day in UTC
      const utcDate = dayjs(date).startOf('day').toISOString()
      dispatch(setSearchDateRangeValue([utcDate, searchDateRangeValue[1]]))
    }
  }

  const handleEndDateChange = (date) => {
    if (date) {
      // Create new Date at end of day in UTC
      const utcDate = dayjs(date).endOf('day').toISOString()
      dispatch(setSearchDateRangeValue([searchDateRangeValue[0], utcDate]))
    }
  }

  // Create display dates without mutation
  const startDateForPicker = useMemo(() => {
    const date = new Date(startDate)
    date.setHours(0, 0, 0, 0)
    return date
  }, [startDate])

  const endDateForPicker = useMemo(() => {
    const date = new Date(endDate)
    date.setHours(23, 59, 59, 999)
    return date
  }, [endDate])

  return (
    <Card height={116} label="Date Range (UTC)" className="datePicker">
      {collectionExtentText && (
        <div className="datePickerHelperText">{collectionExtentText}</div>
      )}
      <div className="datePickerContainer">
        <div className="datePickerInputWrapper">
          <label htmlFor="startDatePicker" className="datePickerInputLabel">From</label>
          <DatePicker
            id="startDatePicker"
            className="reactDatePicker"
            selected={startDateForPicker}
            maxDate={endDateForPicker}
            showPopperArrow={false}
            todayButton="Today"
            showIcon
            icon={
              <CalendarTodayIcon className="datePicker-icon" />
            }
            toggleCalendarOnIconClick
            closeOnScroll={true}
            peekNextMonth
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
            dateFormat="yyyy-MM-dd"
            popperPlacement="top-end"
            onChange={handleStartDateChange}
          />
        </div>
        <div className="datePickerInputWrapper">
          <label htmlFor="endDatePicker" className="datePickerInputLabel">To</label>
          <DatePicker
            id="endDatePicker"
            className="reactDatePicker"
            selected={endDateForPicker}
            minDate={startDateForPicker}
            maxDate={new Date()}
            showPopperArrow={false}
            todayButton="Today"
            showIcon
            icon={
              <CalendarTodayIcon className="datePicker-icon" />
            }
            toggleCalendarOnIconClick
            closeOnScroll={true}
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
            dateFormat="yyyy-MM-dd"
            popperPlacement="top-end"
            onChange={handleEndDateChange}
          />
        </div>
      </div>
    </Card>
  )
}

export default DateTimeRangeSelector
