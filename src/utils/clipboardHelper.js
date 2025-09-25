/**
 * Copy text to clipboard with fallback support
 * @param {string} text - Text to copy
 * @param {Function} setCopiedState - State setter for copied state
 * @param {string} itemKey - Unique key for the item
 * @param {number} resetDelay - Delay before resetting state (default: 2000)
 * @returns {Promise<Object>} Success status and timeout ID
 */
export const copyToClipboard = async (
  text,
  setCopiedState,
  itemKey,
  resetDelay = 2000
) => {
  try {
    await navigator.clipboard.writeText(text)
    setCopiedState(itemKey)

    // Set up cleanup for the copied state
    const timeoutId = setTimeout(() => {
      setCopiedState(null)
    }, resetDelay)

    // Return the timeout ID for potential cleanup
    return { success: true, timeoutId }
  } catch (err) {
    // Fallback for older browsers
    try {
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()

      const successful = document.execCommand('copy')
      document.body.removeChild(textArea)

      if (successful) {
        setCopiedState(itemKey)
        const timeoutId = setTimeout(() => {
          setCopiedState(null)
        }, resetDelay)
        return { success: true, timeoutId }
      }
    } catch (fallbackErr) {
      console.error('Failed to copy URL:', fallbackErr)
    }

    return { success: false, timeoutId: null }
  }
}

/**
 * Hook for managing clipboard state
 * @param {Function} setCopiedState - State setter function
 * @returns {Object} Copy function and cleanup function
 */
export const useClipboard = (setCopiedState) => {
  const timeouts = new Set()

  const copy = async (text, itemKey, resetDelay = 2000) => {
    const result = await copyToClipboard(
      text,
      setCopiedState,
      itemKey,
      resetDelay
    )
    if (result.timeoutId) {
      timeouts.add(result.timeoutId)
    }
    return result.success
  }

  const cleanup = () => {
    timeouts.forEach((timeoutId) => clearTimeout(timeoutId))
    timeouts.clear()
  }

  return { copyToClipboard: copy, cleanup }
}
