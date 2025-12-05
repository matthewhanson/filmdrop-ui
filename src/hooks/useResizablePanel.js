import { useEffect, useRef, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  setLeftPanelWidth,
  setEnhancedColumns
} from '../redux/slices/mainSlice'

// Minimum card width for column calculation (design token)
const CARD_MIN_WIDTH = 250
const MIN_PANEL_WIDTH = 200
const MAX_PANEL_WIDTH = 1200

/**
 * Custom hook for resizable panel with dynamic column calculation
 * @param {Object} panelRef - React ref to the panel element
 * @returns {Object} - Drag handlers and current width
 */
export const useResizablePanel = (panelRef) => {
  const dispatch = useDispatch()
  const leftPanelWidth = useSelector((state) => state.mainSlice.leftPanelWidth)
  const isDraggingRef = useRef(false)
  const startXRef = useRef(0)
  const startWidthRef = useRef(0)

  // Calculate columns based on panel width
  const calculateColumns = useCallback((width) => {
    const columns = Math.floor(width / CARD_MIN_WIDTH)
    return Math.max(1, columns)
  }, [])

  // Debounced column update
  const updateColumnsDebounced = useRef(null)

  const updateColumns = useCallback(
    (width) => {
      if (updateColumnsDebounced.current) {
        clearTimeout(updateColumnsDebounced.current)
      }
      updateColumnsDebounced.current = setTimeout(() => {
        const columns = calculateColumns(width)
        dispatch(setEnhancedColumns(columns))
      }, 100)
    },
    [dispatch, calculateColumns]
  )

  // ResizeObserver to track panel size changes
  useEffect(() => {
    if (!panelRef.current) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width
        if (width > 0) {
          updateColumns(width)
        }
      }
    })

    resizeObserver.observe(panelRef.current)

    // Initial column calculation
    if (panelRef.current) {
      updateColumns(panelRef.current.offsetWidth)
    }

    return () => {
      resizeObserver.disconnect()
      if (updateColumnsDebounced.current) {
        clearTimeout(updateColumnsDebounced.current)
      }
    }
  }, [panelRef, updateColumns])

  // Mouse move handler
  const handleMouseMove = useCallback(
    (e) => {
      if (!isDraggingRef.current) return

      const deltaX = e.clientX - startXRef.current
      const newWidth = Math.min(
        MAX_PANEL_WIDTH,
        Math.max(MIN_PANEL_WIDTH, startWidthRef.current + deltaX)
      )

      dispatch(setLeftPanelWidth(newWidth))
      updateColumns(newWidth)
    },
    [dispatch, updateColumns]
  )

  // Mouse up handler
  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }, [])

  // Mouse down handler for drag handle
  const handleMouseDown = useCallback(
    (e) => {
      e.preventDefault()
      isDraggingRef.current = true
      startXRef.current = e.clientX
      startWidthRef.current = leftPanelWidth
      document.body.style.cursor = 'ew-resize'
      document.body.style.userSelect = 'none'
    },
    [leftPanelWidth]
  )

  // Add/remove event listeners
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  return {
    handleMouseDown,
    currentWidth: leftPanelWidth
  }
}
