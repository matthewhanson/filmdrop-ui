import React, { useState } from 'react'
import PropTypes from 'prop-types'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import LaunchIcon from '@mui/icons-material/Launch'
import DescriptionIcon from '@mui/icons-material/Description'
import LanguageIcon from '@mui/icons-material/Language'
import ImageIcon from '@mui/icons-material/Image'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import Tooltip from '@mui/material/Tooltip'
import { sanitizeFieldValue } from '../../utils/securityHelper.js'
import {
  isHttpLink,
  getRelTypeTitle,
  getLinkTypeFromMimeOrUrl,
  truncateHref
} from '../../utils/defaultLinkGrouping.js'

/**
 * Get Material-UI icon component for link type
 */
function getLinkTypeIcon(linkType) {
  switch (linkType) {
    case 'JSON':
      return DescriptionIcon
    case 'HTML':
      return LanguageIcon
    case 'Image':
      return ImageIcon
    case 'PDF':
      return PictureAsPdfIcon
    default:
      return DescriptionIcon
  }
}

/**
 * Individual link item component
 */
const LinkItem = React.memo(({ link }) => {
  const [copiedUrl, setCopiedUrl] = useState(null)

  const linkTitle = link.title || getRelTypeTitle(link.rel)
  const linkType = getLinkTypeFromMimeOrUrl(link.type, link.href)
  const isHttp = isHttpLink(link.href)
  const truncated = truncateHref(link.href, 80)

  const TypeIcon = getLinkTypeIcon(linkType)

  const handleCopyToClipboard = () => {
    if (link.href) {
      navigator.clipboard.writeText(link.href)
      setCopiedUrl(link.href)
      setTimeout(() => setCopiedUrl(null), 2000)
    }
  }

  const handleOpen = () => {
    if (isHttp && link.href) {
      window.open(link.href, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div role="listitem" className="link-card">
      <div className="link-content">
        <div className="link-title">{sanitizeFieldValue(linkTitle)}</div>
        <div className="link-href-display">{sanitizeFieldValue(truncated)}</div>
        <div className="link-actions">
          <Tooltip
            title={copiedUrl === link.href ? 'Copied!' : 'Copy link'}
            placement="top"
            arrow
            slotProps={{
              tooltip: {
                className: 'tooltip-enhancedDetails'
              }
            }}
          >
            <span
              role="button"
              tabIndex={0}
              onClick={handleCopyToClipboard}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleCopyToClipboard()
                }
              }}
              style={{ display: 'inline-flex', cursor: 'pointer' }}
              aria-label="Copy link to clipboard"
            >
              <ContentCopyIcon fontSize="small" />
            </span>
          </Tooltip>

          <Tooltip
            title={link.type || linkType}
            placement="top"
            arrow
            slotProps={{
              tooltip: {
                className: 'tooltip-enhancedDetails'
              }
            }}
          >
            <span
              className="link-type-hint"
              style={{ display: 'inline-flex' }}
              aria-label={`Link type: ${linkType}`}
            >
              <TypeIcon fontSize="small" />
            </span>
          </Tooltip>

          <Tooltip
            title={isHttp ? 'Open in new tab' : 'Requires S3 access'}
            placement="top"
            arrow
            slotProps={{
              tooltip: {
                className: 'tooltip-enhancedDetails'
              }
            }}
          >
            <span
              role="button"
              tabIndex={isHttp ? 0 : -1}
              onClick={isHttp ? handleOpen : undefined}
              onKeyDown={
                isHttp
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleOpen()
                      }
                    }
                  : undefined
              }
              className={isHttp ? '' : 'link-action-disabled'}
              style={{
                display: 'inline-flex',
                cursor: isHttp ? 'pointer' : 'not-allowed'
              }}
              aria-label={
                isHttp
                  ? 'Open link in new tab'
                  : 'Link not accessible (non-HTTP)'
              }
              aria-disabled={!isHttp}
            >
              <LaunchIcon fontSize="small" />
            </span>
          </Tooltip>
        </div>
      </div>
    </div>
  )
})

LinkItem.displayName = 'LinkItem'

LinkItem.propTypes = {
  link: PropTypes.shape({
    rel: PropTypes.string.isRequired,
    href: PropTypes.string.isRequired,
    type: PropTypes.string,
    title: PropTypes.string
  }).isRequired
}

export default LinkItem
