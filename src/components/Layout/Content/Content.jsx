import React from 'react'
import './Content.css'
import RightContent from './RightContent/RightContent'
import LeftContent from './LeftContent/LeftContent'
import PanelToggle from '../PanelToggle/PanelToggle'

const Content = () => {
  return (
    <div className="Content" data-testid="testContent">
      <LeftContent></LeftContent>
      <RightContent></RightContent>
      <PanelToggle />
    </div>
  )
}

export default Content
