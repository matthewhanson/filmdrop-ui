import { store } from '../redux/store'
import { logoutUser } from '../utils/authHelper'

export async function GetItemService(collectionId, itemId) {
  const requestHeaders = new Headers()
  const JWT = localStorage.getItem('APP_AUTH_TOKEN')
  const isSTACTokenAuthEnabled =
    store.getState().mainSlice.appConfig.APP_TOKEN_AUTH_ENABLED ?? false
  if (JWT && isSTACTokenAuthEnabled) {
    requestHeaders.append('Authorization', `Bearer ${JWT}`)
  }

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
