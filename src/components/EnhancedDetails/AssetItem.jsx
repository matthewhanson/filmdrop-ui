import React from 'react'
import PropTypes from 'prop-types'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import InfoIcon from '@mui/icons-material/Info'
import Tooltip from '@mui/material/Tooltip'
import { sanitizeFieldValue } from '../../utils/securityHelper.js'
import {
  getAssetLabel,
  getCustomRoles,
  getFileTypeAbbreviation,
  getFileType
} from '../../utils/defaultAssetGrouping.js'

/**
 * Format file size in human-readable format
 */
function formatFileSize(bytes) {
  if (typeof bytes !== 'number' || bytes < 0) return 'Unknown'

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

/**
 * Individual asset item component
 */
const AssetItem = React.memo(({ asset, copiedUrl, onCopyToClipboard }) => {
  const assetLabel = getAssetLabel(asset.key, asset)

  // Build the details string with custom roles and file type abbreviation
  const detailsParts = []

  // Show custom roles (non-standard roles like 'reflectance', 'temperature', etc.)
  const customRoles = getCustomRoles(asset)
  if (customRoles.length > 0) {
    detailsParts.push(`Roles: ${customRoles.join(', ')}`)
  }

  // Show file type abbreviation (e.g., COG, JP2, JSON)
  const fileType = getFileType(asset.type || asset.href)
  if (fileType) {
    const abbreviation = getFileTypeAbbreviation(fileType)
    detailsParts.push(`Type: ${abbreviation}`)
  }

  // Show GSD if available
  if (asset.gsd) {
    detailsParts.push(`GSD: ${asset.gsd}`)
  }

  // Show file size if available
  if (asset['file:size'] || asset.size) {
    const sizeBytes = asset['file:size'] || asset.size
    const sizeFormatted = formatFileSize(sizeBytes)
    detailsParts.push(`Size: ${sizeFormatted}`)
  }

  // Show title if different from label
  if (asset.title && asset.title !== assetLabel) {
    detailsParts.push(asset.title)
  }

  const detailsString = detailsParts.join(' | ')

  return (
    <div role="listitem" className="asset-card">
      <div className="asset-content">
        <div className="asset-title-row">
          <Tooltip
            title={copiedUrl === asset.key ? 'Copied!' : 'Click to copy link'}
            placement="top-start"
            arrow
            slotProps={{
              tooltip: {
                className: 'tooltip-enhancedDetails'
              }
            }}
          >
            <span
              className="field-label-inline copy-target"
              role="button"
              tabIndex={0}
              onClick={() => onCopyToClipboard(asset.href, asset.key)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onCopyToClipboard(asset.href, asset.key)
                }
              }}
            >
              {sanitizeFieldValue(assetLabel)}
            </span>
          </Tooltip>
          {asset.description && (
            <Tooltip
              title={sanitizeFieldValue(asset.description)}
              placement="top-start"
              arrow
              slotProps={{
                tooltip: {
                  className: 'tooltip-enhancedDetails'
                }
              }}
            >
              <span
                aria-label={`Information about ${assetLabel}`}
                style={{ display: 'inline-flex' }}
              >
                <InfoIcon className="icon-info" />
              </span>
            </Tooltip>
          )}
        </div>
        {(asset.description || detailsString) && (
          <div className="asset-details-row">
            {asset.description && (
              <div className="asset-description">
                {sanitizeFieldValue(asset.description)}
              </div>
            )}
            {detailsString && (
              <div className="asset-details">
                {sanitizeFieldValue(detailsString)}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="asset-actions">
        <Tooltip
          title={copiedUrl === asset.key ? 'Copied!' : 'Click to copy link'}
          placement="top-end"
          arrow
          slotProps={{
            tooltip: {
              className: 'tooltip-enhancedDetails'
            }
          }}
        >
          <button
            className="asset-copy-button"
            onClick={() => onCopyToClipboard(asset.href, asset.key)}
            type="button"
            aria-label="Copy Link to Clipboard"
          >
            <ContentCopyIcon className="icon-copy" />
          </button>
        </Tooltip>
      </div>
    </div>
  )
})

AssetItem.propTypes = {
  asset: PropTypes.shape({
    key: PropTypes.string.isRequired,
    href: PropTypes.string.isRequired,
    title: PropTypes.string,
    description: PropTypes.string,
    type: PropTypes.string,
    roles: PropTypes.array,
    gsd: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
  }).isRequired,
  copiedUrl: PropTypes.string,
  onCopyToClipboard: PropTypes.func.isRequired
}

AssetItem.displayName = 'AssetItem'

export default AssetItem
