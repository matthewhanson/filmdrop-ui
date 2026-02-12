import React from 'react'
import PropTypes from 'prop-types'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import IconButton from '@mui/material/IconButton'
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

  // Build metadata as label/value pairs
  const metadataItems = []

  const customRoles = getCustomRoles(asset)
  if (customRoles.length > 0) {
    metadataItems.push({ label: 'Roles:', value: customRoles.join(', ') })
  }

  const fileType = getFileType(asset.type || asset.href)
  if (fileType) {
    const abbreviation = getFileTypeAbbreviation(fileType)
    metadataItems.push({ label: 'Type:', value: abbreviation })
  }

  if (asset.gsd) {
    metadataItems.push({ label: 'GSD:', value: asset.gsd })
  }

  if (asset['file:size'] || asset.size) {
    const sizeBytes = asset['file:size'] || asset.size
    const sizeFormatted = formatFileSize(sizeBytes)
    metadataItems.push({ label: 'Size:', value: sizeFormatted })
  }

  return (
    <div role="listitem" className="asset-card">
      <div className="asset-content">
        <div className="asset-title-row">
          <span className="field-label-inline">
            {sanitizeFieldValue(assetLabel)}
          </span>
        </div>
        {asset.description && (
          <div className="asset-description">
            {sanitizeFieldValue(asset.description)}
          </div>
        )}
        {metadataItems.length > 0 && (
          <div className="asset-details-row">
            {metadataItems.map((item) => (
              <div key={item.label} className="asset-meta-line asset-meta-pair">
                <span className="asset-meta-label">{item.label}</span>
                <span className="asset-meta-value">
                  {sanitizeFieldValue(item.value)}
                </span>
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
            <IconButton
              size="small"
              onClick={() => onCopyToClipboard(asset.href, asset.key)}
              aria-label="Copy link to clipboard"
              sx={{
                color: 'var(--brand-accent-primary)',
                '&:hover': {
                  backgroundColor: 'var(--mui-hover)'
                }
              }}
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
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
