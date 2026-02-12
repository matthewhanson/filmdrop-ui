import React from 'react'
import PropTypes from 'prop-types'
import { useSelector } from 'react-redux'
import GroupContainer from './GroupContainer.jsx'
import LinkItem from './LinkItem.jsx'
import {
  filterLinks,
  groupLinksByRel,
  DEFAULT_REL_TYPE_EXCLUDE_LIST,
  getRelTypeTitle
} from '../../utils/defaultLinkGrouping.js'

/**
 * Link display component - displays STAC API Item link and grouped other links
 * Accepts selfLink and otherLinks as separate props for independent control
 */
const LinkDisplay = React.memo(({ selfLink, otherLinks }) => {
  const _appConfig = useSelector((state) => state.mainSlice.appConfig)

  // Get exclude list from config or use default
  const excludeList =
    _appConfig?.STAC_LINKS_EXCLUDE_LIST || DEFAULT_REL_TYPE_EXCLUDE_LIST

  // Filter and group otherLinks (excluding self rel)
  const filteredOtherLinks = filterLinks(otherLinks || [], excludeList).filter(
    (link) => link.rel !== 'self'
  )

  const hasSelfLink = selfLink && _appConfig.STAC_LINK_ENABLED
  const hasOtherLinks =
    filteredOtherLinks &&
    filteredOtherLinks.length > 0 &&
    _appConfig.STAC_LINKS_SECTION_ENABLED

  // Return null if neither section should be displayed
  if (!hasSelfLink && !hasOtherLinks) {
    return null
  }

  const otherLinkGroups = hasOtherLinks
    ? groupLinksByRel(filteredOtherLinks)
    : []

  return (
    <div className="link-display">
      {/* Render self link as STAC API Item group */}
      {hasSelfLink && (
        <GroupContainer
          groupName={getRelTypeTitle('self')}
          className="link-group"
          gridClassName="link-grid"
          renderChildrenInGrid={true}
          count={1}
        >
          <LinkItem link={selfLink} />
        </GroupContainer>
      )}

      {/* Render other links grouped by rel type */}
      {hasOtherLinks &&
        otherLinkGroups &&
        otherLinkGroups.length > 0 &&
        otherLinkGroups.map((group) => (
          <GroupContainer
            key={group.rel}
            groupName={group.title}
            className="link-group"
            gridClassName="link-grid"
            renderChildrenInGrid={true}
            count={group.links.length}
          >
            {group.links.map((link, index) => (
              <LinkItem key={`${group.rel}-${index}`} link={link} />
            ))}
          </GroupContainer>
        ))}
    </div>
  )
})

LinkDisplay.displayName = 'LinkDisplay'

LinkDisplay.propTypes = {
  selfLink: PropTypes.shape({
    rel: PropTypes.string.isRequired,
    href: PropTypes.string.isRequired,
    type: PropTypes.string,
    title: PropTypes.string
  }),
  otherLinks: PropTypes.arrayOf(
    PropTypes.shape({
      rel: PropTypes.string.isRequired,
      href: PropTypes.string.isRequired,
      type: PropTypes.string,
      title: PropTypes.string
    })
  )
}

LinkDisplay.defaultProps = {
  selfLink: null,
  otherLinks: []
}

export default LinkDisplay
