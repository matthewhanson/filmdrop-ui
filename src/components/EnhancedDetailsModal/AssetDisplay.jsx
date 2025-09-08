import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { styled } from '@mui/material/styles'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import InfoIcon from '@mui/icons-material/Info'
import Tooltip from '@mui/material/Tooltip'
import { sanitizeFieldValue } from '../../utils/securityHelper.js'

// Styled component for the info icon
const StyledInfoIcon = styled(InfoIcon)(({ theme }) => ({
  marginLeft: theme.spacing(0.5),
  opacity: 0.7,
  transition: 'opacity 0.2s ease',
  fontSize: 'inherit',
  '&:hover': {
    opacity: 1
  }
}))

// Styled component for the copy icon
const StyledCopyIcon = styled(ContentCopyIcon)(({ theme }) => ({
  marginLeft: theme.spacing(0.5),
  opacity: 0.7,
  transition: 'opacity 0.2s ease',
  fontSize: 'inherit',
  cursor: 'pointer',
  '&:hover': {
    opacity: 1
  }
}))

/**
 * Component for displaying STAC asset links
 * Shows data files (TIFF, JPEG, XML, etc.) but excludes thumbnails
 */
const AssetDisplay = ({ assets, className = 'asset-list' }) => {
  const [copiedUrl, setCopiedUrl] = useState(null)

  if (!assets || Object.keys(assets).length === 0) {
    return null
  }

  // Clean up asset title/name for display
  const formatAssetTitle = (title, key) => {
    if (title && title !== key) {
      return title
    }

    // Clean up the key by replacing underscores and dashes with spaces
    const cleaned = key.replace(/[_-]/g, ' ').replace(/\s+/g, ' ').trim()

    // Convert to title case (capitalize first letter of each word)
    return cleaned
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  // Copy URL to clipboard function
  const copyToClipboard = async (url, assetKey) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedUrl(assetKey)
      // Reset the copied state after 2 seconds
      setTimeout(() => setCopiedUrl(null), 2000)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        setCopiedUrl(assetKey)
        setTimeout(() => setCopiedUrl(null), 2000)
      } catch (fallbackErr) {
        console.error('Failed to copy URL:', fallbackErr)
      }
      document.body.removeChild(textArea)
    }
  }

  // Filter out thumbnails and organize assets by type
  const filteredAssets = Object.entries(assets).filter(([key, asset]) => {
    // Exclude thumbnails
    if (
      key.toLowerCase().includes('thumbnail') ||
      key.toLowerCase().includes('preview') ||
      (asset.title && asset.title.toLowerCase().includes('thumbnail'))
    ) {
      return false
    }
    return true
  })

  if (filteredAssets.length === 0) {
    return null
  }

  // Group assets by file type
  const groupedAssets = filteredAssets.reduce((groups, [key, asset]) => {
    const fileType = getFileType(asset.type || asset.href)
    if (!groups[fileType]) {
      groups[fileType] = []
    }
    groups[fileType].push({ key, ...asset })
    return groups
  }, {})

  return (
    <div className={className}>
      {Object.entries(groupedAssets).map(([fileType, assets]) => (
        <div
          key={fileType}
          className="field-group"
          role="group"
          aria-labelledby={`group-${fileType.toLowerCase()}`}
        >
          <h3
            className="field-group-title"
            id={`group-${fileType.toLowerCase()}`}
          >
            {fileType} Files
          </h3>
          <div className="field-list" role="list">
            {assets.map((asset) => (
              <div key={asset.key} className="field-item" role="listitem">
                <div className="field-label">
                  {sanitizeFieldValue(formatAssetTitle(asset.title, asset.key))}
                  {asset.description && (
                    <Tooltip
                      title={sanitizeFieldValue(asset.description)}
                      placement="top-start"
                      arrow
                      componentsProps={{
                        tooltip: {
                          sx: {
                            backgroundColor:
                              'var(--map-alert-overlay-primary-background)',
                            color: 'var(--map-alert-overlay-primary-color)',
                            border:
                              '1px solid var(--map-alert-overlay-accent-color)',
                            borderRadius: '6px',
                            padding: '8px 12px',
                            fontSize: '12px',
                            maxWidth: 300,
                            zIndex: 1000,
                            '& .MuiTooltip-arrow': {
                              color:
                                'var(--map-alert-overlay-primary-background)',
                              '&::before': {
                                border:
                                  '1px solid var(--map-alert-overlay-accent-color)'
                              }
                            }
                          }
                        }
                      }}
                    >
                      <span
                        aria-label={`Information about ${formatAssetTitle(asset.title, asset.key)}`}
                        style={{ display: 'inline-flex' }}
                      >
                        <StyledInfoIcon />
                      </span>
                    </Tooltip>
                  )}
                </div>
                <div className="field-value">
                  <div className="field-value-container">
                    <div className="field-value-actions">
                      <Tooltip
                        title={
                          copiedUrl === asset.key
                            ? 'Copied!'
                            : 'Click to copy link'
                        }
                        placement="top-end"
                        arrow
                        componentsProps={{
                          tooltip: {
                            sx: {
                              backgroundColor:
                                'var(--map-alert-overlay-primary-background)',
                              color: 'var(--map-alert-overlay-primary-color)',
                              border:
                                '1px solid var(--map-alert-overlay-accent-color)',
                              borderRadius: '6px',
                              padding: '8px 12px',
                              fontSize: '12px',
                              maxWidth: 300,
                              zIndex: 1000,
                              '& .MuiTooltip-arrow': {
                                color:
                                  'var(--map-alert-overlay-primary-background)',
                                '&::before': {
                                  border:
                                    '1px solid var(--map-alert-overlay-accent-color)'
                                }
                              }
                            }
                          }
                        }}
                      >
                        <button
                          className="field-value-file-type"
                          onClick={() => copyToClipboard(asset.href, asset.key)}
                          type="button"
                          aria-label="Copy Link to Clipboard"
                        >
                          {getFileExtension(asset.href)} File
                          <StyledCopyIcon />
                        </button>
                      </Tooltip>
                    </div>
                    <div className="field-value-text field-value-url">
                      {sanitizeFieldValue(asset.href)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Determine file type from MIME type or URL
 */
const getFileType = (typeOrUrl) => {
  if (typeOrUrl) {
    // Check MIME type first
    if (typeOrUrl.includes('image/tiff') || typeOrUrl.includes('geotiff')) {
      return 'GeoTIFF'
    }
    if (typeOrUrl.includes('image/jpeg') || typeOrUrl.includes('image/jpg')) {
      return 'JPEG'
    }
    if (
      typeOrUrl.includes('application/xml') ||
      typeOrUrl.includes('text/xml')
    ) {
      return 'XML'
    }
    if (typeOrUrl.includes('application/json')) {
      return 'JSON'
    }

    // Check file extension
    const url = typeOrUrl.toLowerCase()
    if (url.includes('.tif') || url.includes('.tiff')) {
      return 'GeoTIFF'
    }
    if (url.includes('.jpg') || url.includes('.jpeg')) {
      return 'JPEG'
    }
    if (url.includes('.xml')) {
      return 'XML'
    }
    if (url.includes('.json')) {
      return 'JSON'
    }
    if (url.includes('.jp2')) {
      return 'JPEG2000'
    }
  }

  return 'Data'
}

/**
 * Extract file extension from URL
 */
const getFileExtension = (url) => {
  if (!url) return ''
  const match = url.match(/\.([^.]+)$/)
  return match ? match[1].toUpperCase() : 'FILE'
}

AssetDisplay.propTypes = {
  assets: PropTypes.object,
  className: PropTypes.string
}

export default AssetDisplay
