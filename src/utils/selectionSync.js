/**
 * Keeps overlapping scene selections intact when a fresh item is fetched from the router.
 * Merges the fetched item into an existing matching entry and returns selection state
 * without collapsing the rest of the list. Falls back to a single-item selection when
 * no prior results exist or the item is absent.
 */
function mergeDefinedFields(existingItem, incomingItem) {
  const safeExisting =
    existingItem && typeof existingItem === 'object' ? existingItem : {}
  const safeIncoming =
    incomingItem && typeof incomingItem === 'object' ? incomingItem : {}

  const merged = { ...safeExisting }
  for (const [key, value] of Object.entries(safeIncoming)) {
    if (value !== undefined && value !== null) {
      merged[key] = value
    }
  }

  return merged
}

export function syncSelectionWithFetchedItem(
  existingClickResults,
  fetchedItem
) {
  if (!fetchedItem) {
    return {
      clickResults: [],
      selectedIndex: -1,
      currentResult: null
    }
  }

  const safeExisting = Array.isArray(existingClickResults)
    ? existingClickResults
    : []

  if (safeExisting.length === 0) {
    return {
      clickResults: [fetchedItem],
      selectedIndex: 0,
      currentResult: fetchedItem
    }
  }

  const matchIndex = safeExisting.findIndex(
    (item) =>
      item?.collection === fetchedItem.collection && item?.id === fetchedItem.id
  )

  if (matchIndex === -1) {
    return {
      clickResults: [fetchedItem],
      selectedIndex: 0,
      currentResult: fetchedItem
    }
  }

  const existingMatch = safeExisting[matchIndex] || {}
  const mergedProperties = {
    ...(existingMatch.properties || {}),
    ...(fetchedItem.properties || {})
  }
  const mergedAssets =
    existingMatch.assets || fetchedItem.assets
      ? {
          ...(existingMatch.assets || {}),
          ...(fetchedItem.assets || {})
        }
      : undefined

  const mergedItem = mergeDefinedFields(existingMatch, fetchedItem)
  mergedItem.properties = mergedProperties

  if (mergedAssets) {
    mergedItem.assets = mergedAssets
  }

  const nextClickResults = safeExisting.map((item, index) =>
    index === matchIndex ? mergedItem : item
  )

  return {
    clickResults: nextClickResults,
    selectedIndex: matchIndex,
    currentResult: mergedItem
  }
}
