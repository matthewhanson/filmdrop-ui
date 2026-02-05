import { useRef, useCallback, useEffect } from 'react'

/**
 * React hook for debouncing callbacks with proper cleanup
 * @param {Function} callback - Function to debounce
 * @param {number} delay - Debounce delay in milliseconds
 * @returns {Function} Debounced callback with .cancel() method
 */
export const useDebouncedCallback = (callback, delay) => {
  const timeoutRef = useRef(null)
  const callbackRef = useRef(callback)

  // Always keep callback ref current (avoids stale closures)
  callbackRef.current = callback

  const debouncedFn = useCallback(
    (...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args)
      }, delay)
    },
    [delay]
  )

  // Add cancel method
  debouncedFn.cancel = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return debouncedFn
}
