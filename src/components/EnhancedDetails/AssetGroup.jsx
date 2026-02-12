import React from 'react'
import PropTypes from 'prop-types'
import AssetItem from './AssetItem.jsx'
import GroupContainer from './GroupContainer.jsx'

/**
 * Asset group container component
 */
const AssetGroup = React.memo(
  ({ groupName, assets, copiedUrl, onCopyToClipboard }) => {
    if (!assets || assets.length === 0) {
      return null
    }

    return (
      <GroupContainer
        groupName={groupName}
        gridClassName="asset-grid"
        count={assets.length}
      >
        {assets.map((asset) => (
          <AssetItem
            key={asset.key}
            asset={asset}
            copiedUrl={copiedUrl}
            onCopyToClipboard={onCopyToClipboard}
          />
        ))}
      </GroupContainer>
    )
  }
)

AssetGroup.propTypes = {
  groupName: PropTypes.string.isRequired,
  assets: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      href: PropTypes.string.isRequired,
      title: PropTypes.string,
      description: PropTypes.string
    })
  ).isRequired,
  copiedUrl: PropTypes.string,
  onCopyToClipboard: PropTypes.func.isRequired
}

AssetGroup.displayName = 'AssetGroup'

export default AssetGroup
