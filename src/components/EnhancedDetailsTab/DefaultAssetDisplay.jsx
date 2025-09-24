import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { groupAssetsByType } from '../../utils/defaultAssetGrouping.js'
import BaseAssetDisplay from './BaseAssetDisplay.jsx'

/**
 * Default asset display using standard grouping logic
 */
const DefaultAssetDisplay = ({ assets, className = 'asset-list' }) => {
  const groupedAssets = useMemo(() => {
    if (!assets || Object.keys(assets).length === 0) {
      return []
    }
    return groupAssetsByType(assets)
  }, [assets])

  return (
    <BaseAssetDisplay
      assets={assets}
      groupedAssets={groupedAssets}
      className={className}
    />
  )
}

DefaultAssetDisplay.propTypes = {
  assets: PropTypes.object,
  className: PropTypes.string
}

export default DefaultAssetDisplay
