import { store } from '../redux/store'
import {
  setCollectionsData,
  setShowAppLoading,
  setapplicationAlertMessage,
  setshowApplicationAlert
} from '../redux/slices/mainSlice'
import { buildCollectionsData, loadLocalGridData } from '../utils/dataHelper'
import { logoutUser } from '../utils/authHelper'
import { getCollections } from './stac-api'
import { appendStacHeaderCookies } from '../utils/stacRequest'

export async function GetCollectionsService(searchParams) {
  const appConfig = store.getState().mainSlice.appConfig
  const JWT = localStorage.getItem('APP_AUTH_TOKEN')
  const isSTACTokenAuthEnabled = appConfig.APP_TOKEN_AUTH_ENABLED ?? false

  // Build custom headers for authentication
  const customHeaders = {}
  if (JWT && isSTACTokenAuthEnabled) {
    customHeaders.Authorization = `Bearer ${JWT}`
  }
  appendStacHeaderCookies(requestHeaders)

  try {
    // Use stac-api client to fetch collections
    const json = await getCollections(appConfig.STAC_API_URL, {
      headers: customHeaders,
      credentials: appConfig.FETCH_CREDENTIALS || 'same-origin'
    })

    const collections = appConfig.COLLECTIONS

    // Filter collections based on auto-configured _ids
    if (collections?._ids && Array.isArray(collections._ids)) {
      json.collections = json.collections.filter((collection) =>
        collections._ids.includes(collection.id)
      )
    }

    const formattedData = await buildCollectionsData(json)

    if (Object.values(formattedData).length === 0) {
      store.dispatch(setapplicationAlertMessage('Error: No Collections Found'))
      store.dispatch(setshowApplicationAlert(true))
    }

    store.dispatch(setCollectionsData(formattedData))
    store.dispatch(setShowAppLoading(false))
    loadLocalGridData()
  } catch (error) {
    // Set empty collections data to prevent UI errors
    store.dispatch(setCollectionsData([]))
    store.dispatch(setShowAppLoading(false))

    if (error.status === 403) {
      store.dispatch(
        setapplicationAlertMessage(
          'STAC API returned 403. Bad Token OR needs STAC Auth Enabled in config.',
          'error'
        )
      )
      store.dispatch(setshowApplicationAlert(true))
      logoutUser()
    } else {
      store.dispatch(setapplicationAlertMessage('Error Fetching Collections'))
      store.dispatch(setshowApplicationAlert(true))
    }
    const message = 'Error Fetching Collections'
    // log full error for diagnosing client side errors if needed
    console.error(message, error)
  }
  await fetch(
    `${store.getState().mainSlice.appConfig.STAC_API_URL}/collections`,
    {
      credentials:
        store.getState().mainSlice.appConfig.FETCH_CREDENTIALS || 'same-origin',
      headers: requestHeaders
    }
  )
    .then((response) => {
      if (response.ok) {
        return response.json()
      }
      const contentType = response.headers.get('content-type')
      const error = new Error('Server responded with an error')
      error.status = response.status
      error.statusText = response.statusText
      if (contentType && contentType.includes('application/json')) {
        return response.json().then((err) => {
          error.response = err
          throw error
        })
      } else {
        throw error
      }
    })
    .then((json) => {
      if (!store.getState().mainSlice.appConfig.COLLECTIONS) {
        const builtCollectionData = buildCollectionsData(json)
        return builtCollectionData
      }
      if (json && json.collections && Array.isArray(json.collections)) {
        json.collections = json.collections.filter((collection) => {
          return store
            .getState()
            .mainSlice.appConfig.COLLECTIONS.includes(collection.id)
        })
        const builtCollectionData = buildCollectionsData(json)
        return builtCollectionData
      }
    })
    .then((formattedData) => {
      if (Object.values(formattedData).length === 0) {
        store.dispatch(
          setapplicationAlertMessage('Error: No Collections Found')
        )
        store.dispatch(setshowApplicationAlert(true))
      }
      store.dispatch(setCollectionsData(formattedData))
      store.dispatch(setShowAppLoading(false))
      loadLocalGridData()
    })
    .catch((error) => {
      if (error.status === 403) {
        store.dispatch(
          setapplicationAlertMessage(
            'STAC API returned 403. Bad Token OR needs STAC Auth Enabled in config.',
            'error'
          )
        )
        store.dispatch(setshowApplicationAlert(true))
        logoutUser()
      }
      const message = 'Error Fetching Collections'
      // log full error for diagnosing client side errors if needed
      console.error(message, error)
    })
}
