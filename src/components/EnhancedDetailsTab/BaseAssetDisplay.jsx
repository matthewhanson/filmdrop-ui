import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { useAssetClipboard } from '../../hooks/useAssetClipboard.js'
import AssetGroup from './AssetGroup.jsx'

/**
 * Base asset display component with common logic
 */
const BaseAssetDisplay = React.memo(
  ({ assets, groupedAssets, className = 'asset-list' }) => {
    const { copiedUrl, handleCopyToClipboard } = useAssetClipboard()

    if (!assets || Object.keys(assets).length === 0) {
      return null
    }

    if (groupedAssets.length === 0) {
      return null
    }

    // Memoize the rendered groups to prevent unnecessary re-renders
    const renderedGroups = useMemo(() => {
      return groupedAssets.map((group, index, array) => (
        <React.Fragment key={group.name || group.fileType}>
          <AssetGroup
            groupName={group.name || `${group.fileType} Files`}
            assets={group.assets}
            copiedUrl={copiedUrl}
            onCopyToClipboard={handleCopyToClipboard}
          />
          {index < array.length - 1 && <div className="group-divider" />}
        </React.Fragment>
      ))
    }, [groupedAssets, copiedUrl, handleCopyToClipboard])

    return <div className={className}>{renderedGroups}</div>
  }
)

BaseAssetDisplay.propTypes = {
  assets: PropTypes.object,
  groupedAssets: PropTypes.array.isRequired,
  className: PropTypes.string
}

BaseAssetDisplay.displayName = 'BaseAssetDisplay'

export default BaseAssetDisplay
