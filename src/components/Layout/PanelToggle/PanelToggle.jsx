import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setIsLeftPanelVisible } from '../../../redux/slices/mainSlice'
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight'
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft'
import './PanelToggle.css'

export default function PanelToggle() {
  const dispatch = useDispatch()
  const isVisible = useSelector((state) => state.mainSlice.isLeftPanelVisible)
  const leftPanelWidth = useSelector((state) => state.mainSlice.leftPanelWidth)

  const handleToggle = () => {
    dispatch(setIsLeftPanelVisible(!isVisible))
  }

  const leftPosition = isVisible ? leftPanelWidth : 0

  return (
    <button
      className="PanelToggle"
      onClick={handleToggle}
      style={{ left: `${leftPosition}px` }}
      aria-label={isVisible ? 'Hide left panel' : 'Show left panel'}
    >
      {isVisible ? (
        <KeyboardDoubleArrowLeftIcon />
      ) : (
        <KeyboardDoubleArrowRightIcon />
      )}
    </button>
  )
}
