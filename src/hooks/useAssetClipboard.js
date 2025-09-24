import { useState, useRef, useEffect } from 'react'
import { copyToClipboard } from '../utils/clipboardHelper.js'

/**
 * Asset clipboard functionality hook
 */
export const useAssetClipboard = () => {
  const [copiedUrl, setCopiedUrl] = useState(null)
  const timeoutRef = useRef(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleCopyToClipboard = async (url, assetKey) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    const result = await copyToClipboard(url, setCopiedUrl, assetKey)
    if (result.timeoutId) {
      timeoutRef.current = result.timeoutId
    }
  }

  return {
    copiedUrl,
    handleCopyToClipboard
  }
}
