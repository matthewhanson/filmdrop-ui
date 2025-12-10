import React from 'react'
import { useLayout } from '../../../contexts/LayoutContext'
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight'
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft'
import './PanelToggle.css'

export default function PanelToggle() {
  const { isLeftPanelVisible, leftPanelWidth, toggleLeftPanel } = useLayout()

  const handleToggle = () => {
    toggleLeftPanel()
  }

  const leftPosition = isLeftPanelVisible ? leftPanelWidth : 0

  return (
    <button
      className="PanelToggle"
      onClick={handleToggle}
      style={{ left: `${leftPosition}px` }}
      aria-label={isLeftPanelVisible ? 'Hide left panel' : 'Show left panel'}
    >
      {isLeftPanelVisible ? (
        <KeyboardDoubleArrowLeftIcon />
      ) : (
        <KeyboardDoubleArrowRightIcon />
      )}
    </button>
  )
}
