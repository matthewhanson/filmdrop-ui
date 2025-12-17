import { store } from '../redux/store'
import { logoutUser } from '../utils/authHelper'
import { appendStacHeaderCookies } from '../utils/stacRequest'

/**
 * Fetches a single STAC item from the API
 * @param {string} collectionId - The collection ID containing the item
 * @param {string} itemId - The unique identifier for the item
 * @returns {Promise<Object>} The STAC item GeoJSON feature or error object {error: true, status: number}
 * @example
 * const item = await GetItemService('sentinel-2-l2a', 'S2A_17SNB_20230617_0_L2A')
 * if (item.error) {
 *   // Handle error based on status code
 * } else {
 *   // Process valid STAC item
 * }
 */
export async function GetItemService(collectionId, itemId) {
  const requestHeaders = new Headers()
  const JWT = localStorage.getItem('APP_AUTH_TOKEN')
  const isSTACTokenAuthEnabled =
    store.getState().mainSlice.appConfig.APP_TOKEN_AUTH_ENABLED ?? false
  if (JWT && isSTACTokenAuthEnabled) {
    requestHeaders.append('Authorization', `Bearer ${JWT}`)
  }
  appendStacHeaderCookies(requestHeaders)

  try {
    const response = await fetch(
      `${store.getState().mainSlice.appConfig.STAC_API_URL}/collections/${collectionId}/items/${itemId}`,
      {
        credentials:
          store.getState().mainSlice.appConfig.FETCH_CREDENTIALS ||
          'same-origin',
        headers: requestHeaders
      }
    )

    if (response.ok) {
      return await response.json()
    }

    // Handle 403 by logging out user (token expired or invalid)
    if (response.status === 403) {
      logoutUser()
    }

    // Return error info for caller to handle
    return { error: true, status: response.status }
  } catch (error) {
    console.error('Error fetching STAC item:', error)
    return { error: true, status: null }
  }
}
