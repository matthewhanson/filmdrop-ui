import React, { useState } from 'react'
import PropTypes from 'prop-types'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import LaunchIcon from '@mui/icons-material/Launch'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import { sanitizeFieldValue } from '../../utils/securityHelper.js'
import { isHttpLink, getLinkTypeFromMimeOrUrl } from '../../utils/defaultLinkGrouping.js'

/**
 * Extract domain from URL
 */
function getDomain(url) {
  try {
    const parsed = new URL(url)
    return parsed.hostname
  } catch {
    return null
  }
}

/**
 * Individual link item component
 */
const LinkItem = React.memo(({ link }) => {
  const [copiedUrl, setCopiedUrl] = useState(null)

  const linkTitle = link.title
  const linkType = getLinkTypeFromMimeOrUrl(link.type, link.href)
  const linkDomain = getDomain(link.href)
  const isHttp = isHttpLink(link.href)

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
        {linkTitle && (
          <div className="link-title">{sanitizeFieldValue(linkTitle)}</div>
        )}
        {linkDomain && (
          <div className="link-meta-line">Host: {sanitizeFieldValue(linkDomain)}</div>
        )}
        {linkType && linkType !== 'Unknown' && (
          <div className="link-meta-line">Type: {sanitizeFieldValue(linkType)}</div>
        )}
        <div className="link-actions">
          <Tooltip
            title={copiedUrl === link.href ? 'Copied!' : 'Copy link'}
            placement="top"
            arrow
            slotProps={{
              tooltip: {
                className: 'tooltip-field-label'
              }
            }}
          >
            <IconButton
              size="small"
              onClick={handleCopyToClipboard}
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

          <Tooltip
            title={isHttp ? 'Open in new tab' : 'Requires S3 access'}
            placement="top"
            arrow
            slotProps={{
              tooltip: {
                className: 'tooltip-field-label'
              }
            }}
          >
            <span>
              <IconButton
                size="small"
                onClick={handleOpen}
                disabled={!isHttp}
                aria-label={
                  isHttp
                    ? 'Open link in new tab'
                    : 'Link not accessible (non-HTTP)'
                }
                sx={{
                  color: 'var(--brand-accent-primary)',
                  '&:hover': {
                    backgroundColor: 'var(--mui-hover)'
                  },
                  '&.Mui-disabled': {
                    color: 'var(--side-panel-text-color-secondary)',
                    opacity: 0.4
                  }
                }}
              >
                <LaunchIcon fontSize="small" />
              </IconButton>
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
