import { useEffect, useRef } from 'react'

/**
 * Custom hook to handle map resize events with debouncing and size change detection.
 * Prevents excessive map invalidation calls during rapid resize events.
 *
 * @param {Object} map - Leaflet map instance
 * @param {Object} containerRef - React ref to the map container element
 * @param {number} debounceMs - Debounce delay in milliseconds (default: 300)
 */
export const useMapResizeHandler = (map, containerRef, debounceMs = 300) => {
  const timeoutRef = useRef(null)
  const lastSizeRef = useRef({ width: 0, height: 0 })

  useEffect(() => {
    if (!map || !containerRef.current) return

    const resizeObserver = new ResizeObserver((entries) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        const entry = entries[0]
        if (!entry) return

        const { width, height } = entry.contentRect
        const lastSize = lastSizeRef.current

        // Only invalidate if size actually changed
        if (width !== lastSize.width || height !== lastSize.height) {
          lastSizeRef.current = { width, height }
          map.invalidateSize()
        }
      }, debounceMs)
    })

    resizeObserver.observe(containerRef.current)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      resizeObserver.disconnect()
    }
  }, [map, containerRef, debounceMs])
}
