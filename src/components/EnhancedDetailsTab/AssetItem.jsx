import React from 'react'
import PropTypes from 'prop-types'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import InfoIcon from '@mui/icons-material/Info'
import Tooltip from '@mui/material/Tooltip'
import { sanitizeFieldValue } from '../../utils/securityHelper.js'
import { getAssetLabel } from '../../utils/defaultAssetGrouping.js'

/**
 * Individual asset item component
 */
const AssetItem = React.memo(({ asset, copiedUrl, onCopyToClipboard }) => {
  const assetLabel = getAssetLabel(asset.key, asset)

  // Build the details string (excluding media type since it's already grouped by media type)
  const detailsParts = []
  if (asset.roles && asset.roles.length > 0) {
    detailsParts.push(`Roles: ${asset.roles.join(', ')}`)
  }
  if (asset.gsd) {
    detailsParts.push(`GSD: ${asset.gsd}`)
  }
  if (asset.title && asset.title !== assetLabel) {
    detailsParts.push(asset.title)
  }

  const detailsString = detailsParts.join(' | ')

  return (
    <div role="listitem">
      <div className="asset-title-row">
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
            <span className="field-label-inline">
              {sanitizeFieldValue(assetLabel)}
            </span>
            <ContentCopyIcon className="icon-copy" />
          </button>
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
