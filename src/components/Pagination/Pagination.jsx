import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { FetchPageService } from '../../services/get-pagination-service'
import './Pagination.css'

const Pagination = () => {
  const dispatch = useDispatch()
  const _searchLoading = useSelector((state) => state.mainSlice.searchLoading)
  const _currentPage = useSelector((state) => state.mainSlice.currentPage)
  const _totalPages = useSelector((state) => state.mainSlice.totalPages)
  const _paginationNextLink = useSelector(
    (state) => state.mainSlice.paginationNextLink
  )
  const _paginationPrevLink = useSelector(
    (state) => state.mainSlice.paginationPrevLink
  )
  const _searchResults = useSelector((state) => state.mainSlice.searchResults)

  const _paginationHistory = useSelector(
    (state) => state.mainSlice.paginationHistory
  )

  const handlePrevClick = () => {
    if (_currentPage > 1 && !_searchLoading) {
      // Try to use prev link from API first
      if (_paginationPrevLink) {
        FetchPageService(_paginationPrevLink, _currentPage - 1)
      } else {
        // Fallback: use history to find previous page URL
        const prevPageInHistory = _paginationHistory.find(
          (h) => h.page === _currentPage - 1
        )
        if (prevPageInHistory) {
          FetchPageService(prevPageInHistory.url, _currentPage - 1)
        }
      }
    }
  }

  const handleNextClick = () => {
    if (_paginationNextLink && !_searchLoading) {
      const nextPage = _currentPage + 1
      // Don't go beyond total pages if we know the limit
      if (_totalPages && nextPage > _totalPages) {
        return
      }
      FetchPageService(_paginationNextLink, nextPage)
    }
  }

  // Don't show pagination if there's no search results or if it's aggregated results
  if (
    !_searchResults ||
    _searchResults?.searchType === 'AggregatedResults' ||
    (!_paginationNextLink && !_paginationPrevLink && _currentPage === 1)
  ) {
    return null
  }

  return (
    <>
      <button
        onClick={handlePrevClick}
        disabled={_currentPage <= 1 || _searchLoading}
        className={`paginationButton ${_currentPage <= 1 || _searchLoading ? 'disabled' : ''}`}
      >
        Previous
      </button>
      <span className="paginationInfo">
        Page {_currentPage}
        {_totalPages && ` of ${_totalPages}`}
      </span>
      <button
        onClick={handleNextClick}
        disabled={
          !_paginationNextLink ||
          _searchLoading ||
          (_totalPages && _currentPage >= _totalPages)
        }
        className={`paginationButton ${!_paginationNextLink || _searchLoading || (_totalPages && _currentPage >= _totalPages) ? 'disabled' : ''}`}
      >
        Next
      </button>
    </>
  )
}

export default Pagination
