/**
 * Build an item route URL with proper encoding for special characters
 * @param {string} collectionId - The collection ID
 * @param {string} itemId - The item ID (may contain colons, slashes, etc.)
 * @returns {string} The encoded item route URL
 */
export function buildItemUrl(collectionId, itemId) {
  return `/item/${encodeURIComponent(collectionId)}/${encodeURIComponent(itemId)}`
}
