/**
 * URL state initialization hook.
 *
 * Handles one-time restoration of app state from a shared URL.
 * When the app loads, this hook reads URL search params and populates
 * Redux state, then auto-executes a search if search params are present.
 *
 * Called internally by useUrlStateSync — not used directly by components.
 */
import { useEffect, useRef, useCallback } from 'react'
import { useSelector } from 'react-redux'
import {
  setSelectedCollection,
  setSelectedCollectionData,
  setSelectedVisualization,
  settabSelected,
  setSearchDateRangeValue,
  setViewMode,
  setQueryableFilters,
  setClickResults,
  setCurrentPopupResult,
  setselectedPopupResultIndex,
  setSearchResults,
  setmappedScenes
} from '../redux/slices/mainSlice'
import { GetItemService } from '../services/get-item-service'
import { syncSelectionWithFetchedItem } from '../utils/selectionSync'
import {
  addDataToLayer,
  footprintLayerStyle,
  clearMapSelection
} from '../utils/mapHelper'
import { getCollectionVisualizations } from '../utils/configHelper'
import { showApplicationAlert } from '../utils/alertHelper'
import { newSearch } from '../utils/searchHelper'
import { extractQueryableParams } from '../router'
import { deserializeQueryableFiltersFromURL } from '../utils/urlParamHelper'
import { store } from '../redux/store'

/**
 * Check if a search object has meaningful search-committed params
 * that indicate a search was previously executed.
 */
function hasSearchParams(search) {
  return !!(search.col && search.dt)
}

export function useUrlInitialize(search, dispatch) {
  const isInitialized = useRef(false)
  const isInitializing = useRef(false)
  const prevSearch = useRef(null)

  // Redux state we need to watch for initialization readiness
  const appConfig = useSelector((state) => state.mainSlice.appConfig)
  const collectionsData = useSelector(
    (state) => state.mainSlice.collectionsData
  )
  const map = useSelector((state) => state.mainSlice.map)

  /**
   * Fetch and display a STAC item by collection and item ID.
   * Sets clickResults, currentPopupResult, and triggers raster overlay.
   */
  const fetchAndDisplayItem = useCallback(
    async (collectionId, itemId) => {
      if (!collectionId || !itemId) return

      // If the item is already in search results (e.g. from a map click),
      // use it directly instead of making a redundant API call.
      const searchResults = store.getState().mainSlice.searchResults
      const cachedItem = searchResults?.features?.find((f) => f.id === itemId)
      if (cachedItem) {
        const existingClickResults = store.getState().mainSlice.clickResults
        const { clickResults, selectedIndex, currentResult } =
          syncSelectionWithFetchedItem(existingClickResults, cachedItem)

        dispatch(setClickResults(clickResults))
        dispatch(setselectedPopupResultIndex(selectedIndex))
        dispatch(setCurrentPopupResult(currentResult))
        return
      }

      try {
        const result = await GetItemService(collectionId, itemId)

        if (result.error) {
          if (result.status === 404) {
            showApplicationAlert(
              'error',
              `Item "${itemId}" not found in collection "${collectionId}"`
            )
          } else if (result.status === 403) {
            showApplicationAlert('warning', 'Authentication required')
          } else {
            showApplicationAlert(
              'error',
              'Unable to load item. Please check your network connection.'
            )
          }
          return
        }

        // Add item to search results layer on map if not already there
        if (
          !searchResults?.features ||
          searchResults?.searchType === 'direct-item'
        ) {
          const searchResultsObject = {
            type: 'FeatureCollection',
            features: [result],
            searchType: 'direct-item'
          }
          dispatch(setSearchResults(searchResultsObject))
          dispatch(setmappedScenes(searchResultsObject.features))
          addDataToLayer(
            searchResultsObject,
            'searchResultsLayer',
            { style: footprintLayerStyle },
            true
          )
        }

        // Sync with existing click results
        const existingClickResults = store.getState().mainSlice.clickResults
        const { clickResults, selectedIndex, currentResult } =
          syncSelectionWithFetchedItem(existingClickResults, result)

        dispatch(setClickResults(clickResults))
        dispatch(setselectedPopupResultIndex(selectedIndex))
        dispatch(setCurrentPopupResult(currentResult))
      } catch (error) {
        console.error('Error fetching item:', error)
        showApplicationAlert(
          'error',
          'An unexpected error occurred while loading the item'
        )
      }
    },
    [dispatch]
  )

  /**
   * Clear item selection state.
   */
  const clearItemSelection = useCallback(() => {
    clearMapSelection()
    dispatch(setClickResults([]))
    dispatch(setCurrentPopupResult(null))
    dispatch(setselectedPopupResultIndex(0))
  }, [dispatch])

  /**
   * Initialization from shared URL.
   * Runs once when appConfig, collectionsData, and map are all ready.
   */
  useEffect(() => {
    if (isInitialized.current || isInitializing.current) return
    if (!appConfig || !collectionsData || collectionsData.length === 0) return
    if (!map || Object.keys(map).length === 0) return

    isInitializing.current = true

    function restoreVisualization(col, viz) {
      if (!viz) return
      const { visualizationKeys, hasVisualizations } =
        getCollectionVisualizations(col)
      if (hasVisualizations && visualizationKeys.includes(viz)) {
        dispatch(setSelectedVisualization(viz))
      }
    }

    async function restoreItem(col, item, tab) {
      if (!item) return
      await fetchAndDisplayItem(col, item)
      // Default to details tab for item view, but respect URL tab if set
      if (!tab) {
        dispatch(settabSelected('details'))
      }
    }

    async function initialize() {
      try {
        const urlSearch = search

        // 1. Map view is set from URL params by LeafMap's initial render
        // (MapContainer center/zoom props read from router.state.location.search).
        // No setView call needed here — doing so is unreliable across screen sizes.

        // 2. Set tab from URL
        if (urlSearch.tab) {
          dispatch(settabSelected(urlSearch.tab))
        }

        // 3. If URL has search params, restore search state and auto-search
        if (hasSearchParams(urlSearch)) {
          const collection = collectionsData.find((c) => c.id === urlSearch.col)
          if (collection) {
            // Set collection directly — don't rely on CollectionDropdown's
            // useEffect, which only runs when the Search tab is rendered.
            dispatch(setSelectedCollection(urlSearch.col))
            dispatch(setSelectedCollectionData(collection))

            // Set date range from URL
            if (urlSearch.dt) {
              const parts = urlSearch.dt.split('/')
              if (parts.length === 2) {
                dispatch(setSearchDateRangeValue([parts[0], parts[1]]))
              }
            }

            // Set view mode from URL
            if (urlSearch.view) {
              dispatch(setViewMode(urlSearch.view))
            }

            // Set queryable filters from URL
            const filterParams = extractQueryableParams(urlSearch)
            if (Object.keys(filterParams).length > 0) {
              // collection.queryables is the properties dict directly
              // (e.g. { "eo:cloud_cover": { type: "number", ... } })
              // deserializeQueryableFiltersFromURL expects { properties: ... }
              const queryables = collection.queryables
              if (
                queryables &&
                typeof queryables === 'object' &&
                !queryables.error
              ) {
                const filters = deserializeQueryableFiltersFromURL(
                  filterParams,
                  { properties: queryables }
                )
                if (Object.keys(filters).length > 0) {
                  dispatch(setQueryableFilters(filters))
                }
              }
            }

            restoreVisualization(urlSearch.col, urlSearch.viz)

            // Auto-execute search with explicit overrides to avoid
            // race conditions with ViewSelector's collection-change effect
            // (which auto-selects a default view mode).
            newSearch({
              viewMode: urlSearch.view,
              preserveItem: !!urlSearch.item
            })

            await restoreItem(urlSearch.col, urlSearch.item, urlSearch.tab)
          } else {
            console.warn(
              `Collection "${urlSearch.col}" from URL not found in available collections`
            )
          }
        } else if (urlSearch.item && urlSearch.col) {
          // Item without full search params — try to display it
          const collection = collectionsData.find((c) => c.id === urlSearch.col)
          if (collection) {
            dispatch(setSelectedCollection(urlSearch.col))
            dispatch(setSelectedCollectionData(collection))
            restoreVisualization(urlSearch.col, urlSearch.viz)
            await restoreItem(urlSearch.col, urlSearch.item, urlSearch.tab)
          }
        }

        prevSearch.current = urlSearch
        isInitialized.current = true
      } catch (error) {
        console.error('URL state initialization error:', error)
        prevSearch.current = search
        isInitialized.current = true
      } finally {
        isInitializing.current = false
      }
    }

    initialize()
  }, [
    appConfig,
    collectionsData,
    map,
    search,
    dispatch,
    fetchAndDisplayItem,
    clearItemSelection
  ])

  return { isInitialized, prevSearch, fetchAndDisplayItem, clearItemSelection }
}
