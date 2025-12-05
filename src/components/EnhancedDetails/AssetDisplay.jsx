import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { getFileType, isThumbnail } from '../../utils/defaultAssetGrouping.js'
import BaseAssetDisplay from './BaseAssetDisplay.jsx'

/**
 * Displays STAC asset links, excluding thumbnails
 */
const AssetDisplay = React.memo(({ assets, className = 'asset-list' }) => {
  // Filter out thumbnails and group by file type
  const groupedAssets = useMemo(() => {
    if (!assets || Object.keys(assets).length === 0) {
      return []
    }

    // Filter out thumbnails
    const filteredAssets = Object.entries(assets).filter(
      ([key, asset]) => !isThumbnail(key, asset)
    )

    if (filteredAssets.length === 0) {
      return []
    }

    // Group by file type
    const grouped = filteredAssets.reduce((groups, [key, asset]) => {
      const fileType = getFileType(asset.type || asset.href)
      if (!groups[fileType]) {
        groups[fileType] = []
      }
      groups[fileType].push({ key, ...asset })
      return groups
    }, {})

    return Object.entries(grouped).map(([fileType, assets]) => ({
      fileType,
      assets
    }))
  }, [assets])

  return (
    <BaseAssetDisplay
      assets={assets}
      groupedAssets={groupedAssets}
      className={className}
    />
  )
})

AssetDisplay.propTypes = {
  assets: PropTypes.object,
  className: PropTypes.string
}

AssetDisplay.displayName = 'AssetDisplay'

export default AssetDisplay
