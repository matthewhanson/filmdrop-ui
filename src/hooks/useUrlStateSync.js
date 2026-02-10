/**
 * URL → Redux synchronization hook.
 *
 * Orchestrates two phases:
 * 1. Initialization (delegated to useUrlInitialize): one-time state
 *    restoration from a shared URL on app load.
 * 2. Ongoing sync (this file): propagates URL param changes to Redux
 *    so components re-render via useSelector.
 *
 * Data flow is one-directional (URL → Redux only).
 * Components write to URL via useUrlNavigate or router.navigate.
 */
import { useEffect } from 'react'
import { useSearch } from '@tanstack/react-router'
import { useDispatch } from 'react-redux'
import {
  setSelectedCollection,
  setSelectedVisualization,
  settabSelected,
  setSearchDateRangeValue,
  setViewMode,
  setQueryableFilters
} from '../redux/slices/mainSlice'
import { extractQueryableParams } from '../router'
import { deserializeQueryableFiltersFromURL } from '../utils/urlParamHelper'
import { store } from '../redux/store'
import { useUrlInitialize } from './useUrlInitialize'

/**
 * Declarative map for simple URL param → Redux sync.
 * Each entry defines how a single param maps to a Redux action.
 *
 * - param: URL search param key
 * - action: Redux action creator to dispatch
 * - defaultValue: fallback when param is falsy (omit to dispatch raw value)
 * - transform: optional (value) => dispatchable value; return null to skip
 * - requireTruthy: if true, skip dispatch when value is falsy
 */
const SIMPLE_PARAM_HANDLERS = [
  { param: 'tab', action: settabSelected, defaultValue: 'search' },
  { param: 'viz', action: setSelectedVisualization, defaultValue: null },
  { param: 'view', action: setViewMode, defaultValue: 'scene' },
  { param: 'col', action: setSelectedCollection, requireTruthy: true },
  {
    param: 'dt',
    action: setSearchDateRangeValue,
    requireTruthy: true,
    transform: (value) => {
      const parts = value.split('/')
      return parts.length === 2 ? parts : null
    }
  }
]

export function useUrlStateSync() {
  const search = useSearch({ from: '__root__' })
  const dispatch = useDispatch()

  const { isInitialized, prevSearch, fetchAndDisplayItem, clearItemSelection } =
    useUrlInitialize(search, dispatch)

  /**
   * Ongoing URL → Redux sync.
   * Runs whenever URL search params change after initialization.
   */
  useEffect(() => {
    if (!isInitialized.current) return
    if (prevSearch.current === null) return

    const prev = prevSearch.current
    prevSearch.current = search

    // Process simple params via handler map
    for (const {
      param,
      action,
      defaultValue,
      transform,
      requireTruthy
    } of SIMPLE_PARAM_HANDLERS) {
      if (search[param] !== prev[param]) {
        if (requireTruthy && !search[param]) continue
        const raw =
          defaultValue !== undefined
            ? search[param] || defaultValue
            : search[param]
        if (transform) {
          const value = transform(raw)
          if (value !== null) dispatch(action(value))
        } else {
          dispatch(action(raw))
        }
      }
    }

    // Sync queryable filters (needs JSON comparison across multiple keys)
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

    // Sync item selection (async fetch or clear)
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
