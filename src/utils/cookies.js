import Cookies from 'js-cookie'
import { store } from '../redux/store'

// STAC_HEADER_COOKIES config can define cookies whose values we want to include in STAC API call headers. Here we
// get the cookie values, if they exist
export function getStacCookies() {
  const ret = []
  const config = store.getState().mainSlice.appConfig.STAC_HEADER_COOKIES

  config.forEach((el) => {
    const val = Cookies.get(el.cookie_name)
    if (val) {
      const x = {
        headerName: el.header_name,
        headerValPrefix:
          el.header_val_prefix === null ? '' : el.header_val_prefix,
        headerValMain: val
      }
      ret.push(x)
    }
  })

  return ret
}
