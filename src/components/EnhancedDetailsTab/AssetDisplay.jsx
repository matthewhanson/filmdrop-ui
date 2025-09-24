import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { getFileType } from '../../utils/defaultAssetGrouping.js'
import BaseAssetDisplay from './BaseAssetDisplay.jsx'

/**
 * Displays STAC asset links, excluding thumbnails
 */
const AssetDisplay = ({ assets, className = 'asset-list' }) => {
  // Filter out thumbnails and group by file type
  const groupedAssets = useMemo(() => {
    if (!assets || Object.keys(assets).length === 0) {
      return []
    }

    // Filter out thumbnails
    const filteredAssets = Object.entries(assets).filter(([key, asset]) => {
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
}

AssetDisplay.propTypes = {
  assets: PropTypes.object,
  className: PropTypes.string
}

export default AssetDisplay
