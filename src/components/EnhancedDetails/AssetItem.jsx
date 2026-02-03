import React from 'react'
import PropTypes from 'prop-types'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
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

  // Build metadata lines as separate entries
  const metadataLines = []

  const customRoles = getCustomRoles(asset)
  if (customRoles.length > 0) {
    metadataLines.push(`Roles: ${customRoles.join(', ')}`)
  }

  const fileType = getFileType(asset.type || asset.href)
  if (fileType) {
    const abbreviation = getFileTypeAbbreviation(fileType)
    metadataLines.push(`Type: ${abbreviation}`)
  }

  if (asset.gsd) {
    metadataLines.push(`GSD: ${asset.gsd}`)
  }

  if (asset['file:size'] || asset.size) {
    const sizeBytes = asset['file:size'] || asset.size
    const sizeFormatted = formatFileSize(sizeBytes)
    metadataLines.push(`Size: ${sizeFormatted}`)
  }

  return (
    <div role="listitem" className="asset-card">
      <div className="asset-content">
        <div className="asset-title-row">
          <span className="field-label-inline">
            {sanitizeFieldValue(assetLabel)}
          </span>
        </div>
        {(asset.description || metadataLines.length > 0) && (
          <div className="asset-details-row">
            {asset.description && (
              <div className="asset-description">
                {sanitizeFieldValue(asset.description)}
              </div>
            )}
            {metadataLines.map((line) => (
              <div key={line} className="asset-meta-line">
                {sanitizeFieldValue(line)}
              </div>
            ))}
          </div>
        )}
        <div className="asset-actions">
          <Tooltip
            title={copiedUrl === asset.key ? 'Copied!' : 'Copy link'}
            placement="top-start"
            slotProps={{
              tooltip: {
                className: 'tooltip-field-label'
              }
            }}
          >
            <span
              role="button"
              tabIndex={0}
              onClick={() => onCopyToClipboard(asset.href, asset.key)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onCopyToClipboard(asset.href, asset.key)
                }
              }}
              style={{ display: 'inline-flex', cursor: 'pointer' }}
              aria-label="Copy link to clipboard"
            >
              <ContentCopyIcon fontSize="small" />
            </span>
          </Tooltip>
        </div>
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
