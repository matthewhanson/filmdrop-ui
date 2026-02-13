/**
 * Helper hook for components to update URL params.
 *
 * Instead of dispatching directly to Redux for shareable state,
 * components use these functions to write to the URL. The useUrlStateSync
 * hook then propagates URL changes to Redux.
 *
 * Collection and item are path params (/:collectionId/:itemId).
 * All other state uses search params.
 *
 * All updates use replace: true — the app intentionally does not create
 * browser history entries, so back/forward navigates away from the app.
 */
import { useNavigate, useParams } from '@tanstack/react-router'

export function useUrlNavigate() {
  const navigate = useNavigate()
  const params = useParams({ strict: false })

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
     * Navigates to /:collectionId/:itemId path.
     * @param {string} itemId - The STAC item ID
     */
    setItem: (itemId) =>
      navigate({
        to: '/$collectionId/$itemId',
        params: { collectionId: params.collectionId, itemId },
        search: (prev) => ({ ...prev, tab: 'details' }),
        replace: true
      }),

    /**
     * Clear item selection. Navigates back to /:collectionId (or /).
     */
    clearItem: () =>
      navigate({
        to: params.collectionId ? '/$collectionId' : '/',
        params: params.collectionId
          ? { collectionId: params.collectionId }
          : {},
        search: (prev) => ({ ...prev }),
        replace: true
      })
  }
}
