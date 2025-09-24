import { React, useEffect, useCallback } from 'react'
import './LeftContent.css'
import Search from '../../../Search/Search'
import PopupResults from '../../../PopupResults/PopupResults'
import EnhancedDetailsTab from '../../../EnhancedDetailsTab/EnhancedDetailsTab'
import { useSelector, useDispatch } from 'react-redux'
import { debounceNewSearch } from '../../../../utils/searchHelper'
import {
  settabSelected,
  sethasLeftPanelTabChanged,
  setIsEnhancedDetailsExpanded
} from '../../../../redux/slices/mainSlice'
import {
  KeyboardDoubleArrowRight,
  KeyboardDoubleArrowLeft
} from '@mui/icons-material'

const LeftContent = () => {
  const dispatch = useDispatch()

  const _clickResults = useSelector((state) => state.mainSlice.clickResults)
  const _searchLoading = useSelector((state) => state.mainSlice.searchLoading)
  const _isDrawingEnabled = useSelector(
    (state) => state.mainSlice.isDrawingEnabled
  )
  const _tabSelected = useSelector((state) => state.mainSlice.tabSelected)
  const _isEnhancedDetailsExpanded = useSelector(
    (state) => state.mainSlice.isEnhancedDetailsExpanded
  )

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
    // Collapse Enhanced Details when switching to other tabs
    if (_isEnhancedDetailsExpanded) {
      dispatch(setIsEnhancedDetailsExpanded(false))
    }
  }, [dispatch, _isEnhancedDetailsExpanded])

  const setDetailsTab = useCallback(() => {
    dispatch(settabSelected('details'))
    dispatch(sethasLeftPanelTabChanged(true))
    // Collapse Enhanced Details when switching to other tabs
    if (_isEnhancedDetailsExpanded) {
      dispatch(setIsEnhancedDetailsExpanded(false))
    }
  }, [dispatch, _isEnhancedDetailsExpanded])

  const setEnhancedDetailsTab = useCallback(() => {
    dispatch(settabSelected('enhanced'))
    dispatch(sethasLeftPanelTabChanged(true))
    // Toggle expansion state
    dispatch(setIsEnhancedDetailsExpanded(!_isEnhancedDetailsExpanded))
  }, [dispatch, _isEnhancedDetailsExpanded])

  return (
    <div
      className={`LeftContent ${_isEnhancedDetailsExpanded ? 'expanded' : ''}`}
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
            Filters
          </button>
          <button
            className={
              _tabSelected === 'details'
                ? 'LeftContentTab LeftContentTabSelected'
                : 'LeftContentTab'
            }
            onClick={setDetailsTab}
          >
            Item Details
          </button>
          <button
            className={
              _tabSelected === 'enhanced'
                ? `LeftContentTab LeftContentTabSelected ${_isEnhancedDetailsExpanded ? 'enhanced-expanded' : 'enhanced-collapsed'}`
                : `LeftContentTab ${_isEnhancedDetailsExpanded ? 'enhanced-expanded' : 'enhanced-collapsed'}`
            }
            onClick={setEnhancedDetailsTab}
          >
            {_isEnhancedDetailsExpanded ? (
              <>
                Enhanced Details
                <KeyboardDoubleArrowLeft />
              </>
            ) : (
              <KeyboardDoubleArrowRight />
            )}
          </button>
        </div>
        <div className="LeftContentSelectedTab">
          {_tabSelected === 'filters' ? (
            <Search></Search>
          ) : _tabSelected === 'enhanced' ? (
            <EnhancedDetailsTab></EnhancedDetailsTab>
          ) : (
            <div className="ItemDetails">
              <PopupResults results={_clickResults}></PopupResults>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default LeftContent
