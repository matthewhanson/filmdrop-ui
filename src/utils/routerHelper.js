/**
 * Build an item route URL with proper encoding for special characters
 * @param {string} collectionId - The collection ID
 * @param {string} itemId - The item ID (may contain colons, slashes, etc.)
 * @param {string|null} visualizationId - Optional visualization ID (only include if collection has >= 1 visualization)
 * @returns {string} The encoded item route URL
 */
export function buildItemUrl(collectionId, itemId, visualizationId = null) {
  const base = `/item/${encodeURIComponent(collectionId)}/${encodeURIComponent(itemId)}`
  // Only include visualization if provided (caller responsible for checking collection supports it)
  return visualizationId
    ? `${base}/${encodeURIComponent(visualizationId)}`
    : base
}
