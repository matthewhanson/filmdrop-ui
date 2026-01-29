// throttle function to prevent map from rendering too quickly
export default function debounce(func, wait, immediate) {
  let timeout

  const executedFunction = function () {
    const context = this
    const args = arguments

    const later = function () {
      timeout = null
      if (!immediate) func.apply(context, args)
    }

    const callNow = immediate && !timeout

    clearTimeout(timeout)

    timeout = setTimeout(later, wait)

    if (callNow) func.apply(context, args)
  }

  // Add cancel method to allow cleanup of pending debounced calls
  executedFunction.cancel = function () {
    clearTimeout(timeout)
    timeout = null
  }

  return executedFunction
}
