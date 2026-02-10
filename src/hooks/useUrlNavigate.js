/**
 * Helper hook for components to update URL search params.
 *
 * Instead of dispatching directly to Redux for shareable state,
 * components use these functions to write to the URL. The useUrlStateSync
 * hook then propagates URL changes to Redux.
 *
 * All updates use replace: true — the app intentionally does not create
 * browser history entries, so back/forward navigates away from the app.
 */
import { useNavigate } from '@tanstack/react-router'

export function useUrlNavigate() {
  const navigate = useNavigate()

  return {
    /**
     * Switch sidebar tab.
     * @param {'search'|'details'} tab
     */
    setTab: (tab) =>
      navigate({ search: (prev) => ({ ...prev, tab }), replace: true }),

    /**
     * Change visualization selection.
     * @param {string} viz - Visualization key
     */
    setViz: (viz) =>
      navigate({ search: (prev) => ({ ...prev, viz }), replace: true }),

    /**
     * Select an item (scene). Also switches to details tab.
     * @param {string} itemId - The STAC item ID
     */
    setItem: (itemId) =>
      navigate({
        search: (prev) => ({ ...prev, item: itemId, tab: 'details' }),
        replace: true
      })
  }
}
