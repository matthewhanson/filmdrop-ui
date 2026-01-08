import React from 'react'
import { useLayout } from '../../../contexts/LayoutContext'
import { useSelector } from 'react-redux'
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight'
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft'
import './PanelToggle.css'

export default function PanelToggle() {
  const { isLeftPanelVisible, leftPanelWidth, toggleLeftPanel } = useLayout()
  const isRightSidebarEnabled = useSelector(
    (state) => state.mainSlice.appConfig?.RIGHT_SIDEBAR_ENABLED ?? false
  )

  const handleToggle = () => {
    toggleLeftPanel()
  }

  const offset = isLeftPanelVisible ? leftPanelWidth : 0

  return (
    <button
      className={`PanelToggle ${isRightSidebarEnabled ? 'rightSidebar' : ''}`}
      onClick={handleToggle}
      style={
        isRightSidebarEnabled
          ? { right: `${offset}px` }
          : { left: `${offset}px` }
      }
      aria-label={isLeftPanelVisible ? 'Hide sidebar' : 'Show sidebar'}
    >
      {isRightSidebarEnabled ? (
        isLeftPanelVisible ? (
          <KeyboardDoubleArrowRightIcon />
        ) : (
          <KeyboardDoubleArrowLeftIcon />
        )
      ) : isLeftPanelVisible ? (
        <KeyboardDoubleArrowLeftIcon />
      ) : (
        <KeyboardDoubleArrowRightIcon />
      )}
    </button>
  )
}
