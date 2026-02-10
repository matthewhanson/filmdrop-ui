/**
 * URL ↔ Redux synchronization hook.
 *
 * This hook is the bridge between TanStack Router's URL search params and
 * the Redux store. It handles two responsibilities:
 *
 * 1. Initial load: When the app loads from a shared URL, it reads all URL
 *    params and populates Redux state, then auto-executes a search if
 *    search params are present.
 *
 * 2. Ongoing sync: When URL params change (from user interactions that
 *    write to URL), it syncs the changes to Redux so components re-render.
 *
 * Data flow is one-directional for ongoing changes (URL → Redux only).
 * Components write to URL via useUrlNavigate or router.navigate, then this
 * hook propagates those changes to Redux.
 */
import { useEffect, useRef, useCallback } from 'react'
import { useSearch } from '@tanstack/react-router'
import { useDispatch, useSelector } from 'react-redux'
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

export function useUrlStateSync() {
  const search = useSearch({ from: '__root__' })
  const dispatch = useDispatch()

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
        const searchResults = store.getState().mainSlice.searchResults
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
   * Phase 1: Initialization from shared URL.
   * Runs once when appConfig, collectionsData, and map are all ready.
   */
  useEffect(() => {
    if (isInitialized.current || isInitializing.current) return
    if (!appConfig || !collectionsData || collectionsData.length === 0) return
    if (!map || Object.keys(map).length === 0) return

    isInitializing.current = true

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
              // selectedCollectionData.queryables is the properties dict directly
              // (e.g. { "eo:cloud_cover": { type: "number", ... } })
              // deserializeQueryableFiltersFromURL expects { properties: ... }
              const collData = store.getState().mainSlice.selectedCollectionData
              const queryables = collData?.queryables
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
              } else {
                // No queryables schema — combine _min/_max pairs into range objects
                const rawFilters = {}
                const processedRangeFields = new Set()
                for (const [key, value] of Object.entries(filterParams)) {
                  const minMatch = key.match(/^(.+)_min$/)
                  const maxMatch = key.match(/^(.+)_max$/)
                  if (minMatch) {
                    const fieldName = minMatch[1]
                    if (!processedRangeFields.has(fieldName)) {
                      processedRangeFields.add(fieldName)
                      const minVal = filterParams[`${fieldName}_min`]
                      const maxVal = filterParams[`${fieldName}_max`]
                      if (minVal != null && maxVal != null) {
                        rawFilters[fieldName] = {
                          min: parseFloat(minVal),
                          max: parseFloat(maxVal)
                        }
                      }
                    }
                  } else if (!maxMatch) {
                    rawFilters[key] = value
                  }
                }
                if (Object.keys(rawFilters).length > 0) {
                  dispatch(setQueryableFilters(rawFilters))
                }
              }
            }

            // Set visualization from URL
            if (urlSearch.viz) {
              const { visualizationKeys, hasVisualizations } =
                getCollectionVisualizations(urlSearch.col)
              if (
                hasVisualizations &&
                visualizationKeys.includes(urlSearch.viz)
              ) {
                dispatch(setSelectedVisualization(urlSearch.viz))
              }
            }

            // Auto-execute search with explicit overrides to avoid
            // race conditions with ViewSelector's collection-change effect
            // (which auto-selects a default view mode).
            newSearch({
              viewMode: urlSearch.view,
              preserveItem: !!urlSearch.item
            })

            // If URL has an item, fetch and display it
            if (urlSearch.item) {
              await fetchAndDisplayItem(urlSearch.col, urlSearch.item)
              // Default to details tab for item view, but respect URL tab if set
              if (!urlSearch.tab) {
                dispatch(settabSelected('details'))
              }
            }
          } else {
            console.warn(
              `Collection "${urlSearch.col}" from URL not found in available collections`
            )
          }
        } else {
          // No search params — just restore immediate params
          if (urlSearch.viz) {
            dispatch(setSelectedVisualization(urlSearch.viz))
          }
          if (urlSearch.item && urlSearch.col) {
            // Item without full search params — try to display it
            const collection = collectionsData.find(
              (c) => c.id === urlSearch.col
            )
            if (collection) {
              dispatch(setSelectedCollection(urlSearch.col))
              dispatch(setSelectedCollectionData(collection))
              if (urlSearch.viz) {
                const { visualizationKeys, hasVisualizations } =
                  getCollectionVisualizations(urlSearch.col)
                if (
                  hasVisualizations &&
                  visualizationKeys.includes(urlSearch.viz)
                ) {
                  dispatch(setSelectedVisualization(urlSearch.viz))
                }
              }
              await fetchAndDisplayItem(urlSearch.col, urlSearch.item)
              if (!urlSearch.tab) {
                dispatch(settabSelected('details'))
              }
            }
          }
        }

        prevSearch.current = urlSearch
        isInitialized.current = true
      } catch (error) {
        console.error('URL state initialization error:', error)
        prevSearch.current = urlSearch
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

  /**
   * Phase 2: Ongoing URL → Redux sync.
   * Runs whenever URL search params change after initialization.
   */
  useEffect(() => {
    if (!isInitialized.current) return
    if (prevSearch.current === null) return

    const prev = prevSearch.current
    prevSearch.current = search

    // Sync tab
    if (search.tab !== prev.tab) {
      dispatch(settabSelected(search.tab || 'search'))
    }

    // Sync visualization
    if (search.viz !== prev.viz) {
      dispatch(setSelectedVisualization(search.viz || null))
    }

    // Sync view mode
    if (search.view !== prev.view) {
      dispatch(setViewMode(search.view || 'scene'))
    }

    // Sync collection
    if (search.col !== prev.col && search.col) {
      dispatch(setSelectedCollection(search.col))
    }

    // Sync date range
    if (search.dt !== prev.dt && search.dt) {
      const parts = search.dt.split('/')
      if (parts.length === 2) {
        dispatch(setSearchDateRangeValue([parts[0], parts[1]]))
      }
    }

    // Sync queryable filters
    const prevFilters = extractQueryableParams(prev)
    const currFilters = extractQueryableParams(search)
    if (JSON.stringify(prevFilters) !== JSON.stringify(currFilters)) {
      const collData = store.getState().mainSlice.selectedCollectionData
      const queryables = collData?.queryables
      if (queryables && typeof queryables === 'object' && !queryables.error) {
        const filters = deserializeQueryableFiltersFromURL(currFilters, {
          properties: queryables
        })
        dispatch(setQueryableFilters(filters))
      }
    }

    // Sync item selection
    if (search.item !== prev.item) {
      if (search.item) {
        const col = search.col || prev.col
        fetchAndDisplayItem(col, search.item)
      } else {
        clearItemSelection()
      }
    }
  }, [search, dispatch, fetchAndDisplayItem, clearItemSelection])
}
