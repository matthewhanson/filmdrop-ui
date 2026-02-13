import { store } from '../redux/store'
import {
  setClickResults,
  setSearchLoading,
  setSearchResults,
  setmappedScenes,
  settabSelected,
  setpaginationNextLink,
  setpaginationPrevLink,
  setcurrentPage,
  settotalPages,
  setpaginationHistory
} from '../redux/slices/mainSlice'
import { addDataToLayer, footprintLayerStyle } from '../utils/mapHelper'
import { appendStacHeaderCookies } from '../utils/stacRequest'
import { DEFAULT_API_MAX_ITEMS } from '../components/defaults'

export async function SearchService(searchParams, typeOfSearch) {
  const requestHeaders = new Headers()
  const JWT = localStorage.getItem('APP_AUTH_TOKEN')
  const isSTACTokenAuthEnabled =
    store.getState().mainSlice.appConfig.APP_TOKEN_AUTH_ENABLED ?? false
  if (JWT && isSTACTokenAuthEnabled) {
    requestHeaders.append('Authorization', `Bearer ${JWT}`)
  }
  appendStacHeaderCookies(requestHeaders)

  const stacApiUrl = `${
    store.getState().mainSlice.appConfig.STAC_API_URL
  }/search?${searchParams}`

  console.log('STAC API Search Request:', stacApiUrl)
  console.log('Search Parameters:', searchParams)

  await fetch(stacApiUrl, {
    credentials:
      store.getState().mainSlice.appConfig.FETCH_CREDENTIALS || 'same-origin',
    headers: requestHeaders
  })
    .then((response) => {
      if (response.ok) {
        return response.json()
      }
      throw new Error()
    })
    .then((json) => {
      if (typeOfSearch === 'scene') {
        store.dispatch(setSearchResults(json))
        store.dispatch(setmappedScenes(json.features))

        // Extract pagination metadata
        const nextLink = json.links?.find((link) => link.rel === 'next')
        const prevLink = json.links?.find((link) => link.rel === 'prev')

        store.dispatch(setpaginationNextLink(nextLink?.href || null))
        store.dispatch(setpaginationPrevLink(prevLink?.href || null))
        store.dispatch(setcurrentPage(1))

        // Initialize pagination history with the current search URL (page 1)
        const currentUrl = `${store.getState().mainSlice.appConfig.STAC_API_URL}/search?${searchParams}`
        store.dispatch(setpaginationHistory([{ page: 1, url: currentUrl }]))

        // Calculate total pages if we have numberMatched
        if (json.context?.matched || json.numberMatched) {
          const totalItems = json.context?.matched || json.numberMatched
          const limit =
            store.getState().mainSlice.appConfig.API_MAX_ITEMS ||
            DEFAULT_API_MAX_ITEMS
          const totalPages = Math.ceil(totalItems / limit)
          store.dispatch(settotalPages(totalPages))
        }

        const options = {
          style: footprintLayerStyle
        }
        store.dispatch(setSearchLoading(false))
        addDataToLayer(json, 'searchResultsLayer', options, true)
      } else {
        store.dispatch(setSearchLoading(false))
        store.dispatch(setClickResults(json.features))
        store.dispatch(settabSelected('details'))
      }
    })
    .catch((error) => {
      store.dispatch(setSearchLoading(false))
      const message = 'Error Fetching Search Results'
      // log full error for diagnosing client side errors if needed
      console.error(message, error)
    })
}
