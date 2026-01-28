import Cookies from 'js-cookie'
import { store } from '../redux/store'

// STAC_HEADER_COOKIES config can define cookies whose values we want to
// include in STAC API request headers. if any exist, append them to the
// request headers
export function appendStacHeaderCookies(requestHeaders) {
  try {
    console.log(
      'appendStacHeaderCookies headers:',
      Object.fromEntries(Array.from(requestHeaders.entries()))
    )
    console.log('appendStacHeaderCookies mainSlice:', store.getState().mainSlice)
  } catch (e) {
    console.error(e)
  }

  const headerArr =
    store.getState().mainSlice.appConfig.STAC_HEADER_COOKIES ?? []

  if (headerArr.length > 0) {
    const cooks = getStacCookies(headerArr)
    cooks.forEach((el) => {
      requestHeaders.append(
        el.headerName,
        `${el.headerValPrefix}${el.headerValMain}`
      )
    })
  }
}

function getStacCookies(headerArr) {
  const ret = []

  headerArr.forEach((el) => {
    console.log('headerArr element:', el)
    if (!el.header_name?.trim() || !el.cookie_name?.trim()) {
      console.warn('Invalid STAC_HEADER_COOKIES config:', el)
      return
    }

    const val = Cookies.get(el.cookie_name)
    if (val) {
      const x = {
        headerName: el.header_name,
        headerValPrefix:
          el.header_val_prefix === null ? '' : el.header_val_prefix,
        headerValMain: val
      }
      console.log('pushing x:', x)
      ret.push(x)
    }
  })

  return ret
}
