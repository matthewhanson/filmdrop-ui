import { React, useEffect, useCallback, useRef } from 'react'
import './LeftContent.css'
import Search from '../../../Search/Search'
import PopupResults from '../../../PopupResults/PopupResults'
import { useSelector, useDispatch } from 'react-redux'
import { debounceNewSearch } from '../../../../utils/searchHelper'
import {
  settabSelected,
  sethasLeftPanelTabChanged
} from '../../../../redux/slices/mainSlice'
import { useResizablePanel } from '../../../../hooks/useResizablePanel'
import { useLayout } from '../../../../contexts/LayoutContext'
import DragHandleIcon from '@mui/icons-material/DragHandle'

const LeftContent = () => {
  const dispatch = useDispatch()
  const panelRef = useRef(null)
  const { isLeftPanelVisible } = useLayout()

  const _clickResults = useSelector((state) => state.mainSlice.clickResults)
  const _searchLoading = useSelector((state) => state.mainSlice.searchLoading)
  const _isDrawingEnabled = useSelector(
    (state) => state.mainSlice.isDrawingEnabled
  )
  const _tabSelected = useSelector((state) => state.mainSlice.tabSelected)
  const _isRightSidebarEnabled = useSelector(
    (state) => state.mainSlice.appConfig?.RIGHT_SIDEBAR_ENABLED ?? false
  )

  const { handleMouseDown, currentWidth } = useResizablePanel(panelRef)

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress)
    return () => {
      document.removeEventListener('keydown', handleKeyPress)
    }
  }, [])

  const handleKeyPress = (event) => {
    if (event.ctrlKey && event.key === ' ') {
      debounceNewSearch()
    }
  }

  const setFiltersTab = useCallback(() => {
    dispatch(settabSelected('filters'))
  }, [dispatch])

  const setDetailsTab = useCallback(() => {
    dispatch(settabSelected('details'))
    dispatch(sethasLeftPanelTabChanged(true))
  }, [dispatch])

  return (
    <div
      ref={panelRef}
      className={`LeftContent ${_isRightSidebarEnabled ? 'rightSidebar' : ''} ${!isLeftPanelVisible ? 'hidden' : ''}`}
      style={{ width: isLeftPanelVisible ? `${currentWidth}px` : '0px' }}
    >
      <div className="LeftContentHolder">
        {_isDrawingEnabled || _searchLoading ? (
          <div
            className="disableSearchOverlay"
            data-testid="test_disableSearchOverlay"
          ></div>
        ) : null}
        <div className="LeftContentTabs">
          <button
            className={
              _tabSelected === 'filters'
                ? 'LeftContentTab LeftContentTabSelected'
                : 'LeftContentTab'
            }
            onClick={setFiltersTab}
          >
            <span className="LeftContentTabLabel">Search</span>
          </button>
          <button
            className={
              _tabSelected === 'details'
                ? 'LeftContentTab LeftContentTabSelected'
                : 'LeftContentTab'
            }
            onClick={setDetailsTab}
          >
            <span className="LeftContentTabLabel">Item Details</span>
          </button>
        </div>
        <div className="LeftContentSelectedTab">
          {_tabSelected === 'filters' ? (
            <Search></Search>
          ) : (
            <div className="ItemDetails">
              <PopupResults results={_clickResults}></PopupResults>
            </div>
          )}
        </div>
      </div>
      {isLeftPanelVisible && (
        <button
          className="resize-handle"
          onMouseDown={handleMouseDown}
          aria-label="Resize panel"
          type="button"
        >
          <DragHandleIcon className="resize-handle-icon" />
        </button>
      )}
    </div>
  )
}

export default LeftContent
