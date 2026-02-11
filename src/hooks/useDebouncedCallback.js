import { useRef, useMemo, useEffect } from 'react'
import debounce from '../utils/debounce'

/**
 * React hook for debouncing callbacks with proper cleanup
 * @param {Function} callback - Function to debounce
 * @param {number} delay - Debounce delay in milliseconds
 * @returns {Function} Debounced callback with .cancel() method
 */
export const useDebouncedCallback = (callback, delay) => {
  const callbackRef = useRef(callback)

  // Always keep callback ref current (avoids stale closures)
  callbackRef.current = callback

  const debouncedFn = useMemo(
    () => debounce((...args) => callbackRef.current(...args), delay),
    [delay]
  )

  // Cleanup on unmount
  useEffect(() => () => debouncedFn.cancel(), [debouncedFn])

  return debouncedFn
}
