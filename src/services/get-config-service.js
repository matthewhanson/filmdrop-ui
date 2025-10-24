import { store } from '../redux/store'
import { setappConfig } from '../redux/slices/mainSlice'
import { showApplicationAlert } from '../utils/alertHelper'
import {
  normalizeCollectionsConfig,
  applyConfigDefaults
} from '../utils/configHelper'

export async function LoadConfigIntoStateService() {
  const cacheBuster = Date.now()
  const configUrl = `${
    import.meta.env.BASE_URL
  }config/config.json?_cb=${cacheBuster}`

  await fetch(configUrl, {
    cache: 'no-store'
  })
    .then((response) => {
      if (response.ok) {
        return response.json()
      }
      throw new Error()
    })
    .then((json) => {
      // Normalize the config to support both old and new formats
      const normalizedConfig = normalizeCollectionsConfig(json)
      // Apply defaults for optional parameters
      const configWithDefaults = applyConfigDefaults(normalizedConfig)
      store.dispatch(setappConfig(configWithDefaults))
    })
    .catch((error) => {
      const message = 'Error Fetching Config File'
      // log full error for diagnosing client side errors if needed
      console.error(message, error)
      showApplicationAlert('error', message, null)
    })
}

export async function DoesFaviconExistService() {
  const cacheBuster = Date.now()

  try {
    const response = await fetch(
      `/config/${
        store.getState().mainSlice.appConfig.APP_FAVICON
      }?_cb=${cacheBuster}`,
      {
        method: 'HEAD',
        cache: 'no-store'
      }
    )

    return response.ok
  } catch (error) {
    console.error('Error Fetching Favicon File', error)
    return false
  }
}
