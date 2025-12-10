import {
  setapplicationAlertMessage,
  setapplicationAlertSeverity,
  setshowApplicationAlert,
  setisAuthErrorAlert
} from '../redux/slices/mainSlice'
import { store } from '../redux/store'

export function showApplicationAlert(
  severity,
  message = null,
  duration = null,
  isAuthError = false
) {
  message
    ? store.dispatch(setapplicationAlertMessage(message))
    : store.dispatch(setapplicationAlertMessage('System Error'))

  store.dispatch(setapplicationAlertSeverity(severity))
  store.dispatch(setisAuthErrorAlert(isAuthError))
  store.dispatch(setshowApplicationAlert(true))

  duration &&
    setTimeout(() => {
      store.dispatch(setshowApplicationAlert(false))
    }, duration)
}
