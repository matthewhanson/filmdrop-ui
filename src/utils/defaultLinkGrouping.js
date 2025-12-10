/**
 * DEFAULT LINK GROUPING MODULE
 * Handles default grouping and filtering of STAC item links
 */

/**
 * Default list of link rel types to exclude from the Links section
 * These are primarily navigation and API plumbing links that aren't useful for end users
 */
export const DEFAULT_REL_TYPE_EXCLUDE_LIST = [
  'parent',
  'collection',
  'root',
  'items',
  'aggregate',
  'aggregations',
  'http://www.opengis.net/def/rel/ogc/1.0/queryables',
  'conformance',
  'service-desc',
  'service-doc',
  'data',
  'thumbnail' // Thumbnails are handled separately in assets
]

/**
 * Map of link rel types to their display titles
 * Provides human-readable names for common STAC link relationships
 */
export const REL_TYPE_TITLE_MAP = {
  self: 'STAC API Item',
  canonical: 'Canonical URL',
  license: 'License',
  derived_from: 'Derived From',
  about: 'About',
  alternate: 'Alternate',
  via: 'Via',
  prev: 'Previous',
  next: 'Next',
  'cite-as': 'Cite As'
}

/**
 * Filter links based on exclude list
 * @param {Array} links - Array of STAC link objects
 * @param {Array} excludeList - Array of rel types to exclude
 * @returns {Array} Filtered array of links
 */
export function filterLinks(
  links,
  excludeList = DEFAULT_REL_TYPE_EXCLUDE_LIST
) {
  if (!Array.isArray(links) || links.length === 0) {
    return []
  }

  if (!Array.isArray(excludeList)) {
    excludeList = DEFAULT_REL_TYPE_EXCLUDE_LIST
  }

  return links.filter((link) => {
    if (!link || !link.rel) {
      return false
    }
    return !excludeList.includes(link.rel)
  })
}

/**
 * Group links by rel type with self group appearing first
 * @param {Array} links - Array of STAC link objects
 * @returns {Array} Array of group objects with rel, title, and links
 */
export function groupLinksByRel(links) {
  if (!Array.isArray(links) || links.length === 0) {
    return []
  }

  // Group links by rel type, preserving order within each group
  const groupMap = new Map()

  links.forEach((link) => {
    if (!link || !link.rel) {
      return
    }

    const rel = link.rel
    if (!groupMap.has(rel)) {
      groupMap.set(rel, {
        rel,
        title: getRelTypeTitle(rel),
        links: []
      })
    }

    groupMap.get(rel).links.push(link)
  })

  // Convert to array
  const groups = Array.from(groupMap.values())

  // Sort so 'self' group appears first, then others in order encountered
  groups.sort((a, b) => {
    if (a.rel === 'self') return -1
    if (b.rel === 'self') return 1
    return 0
  })

  return groups
}

/**
 * Check if a link href uses HTTP/HTTPS protocol
 * @param {string} href - The link href
 * @returns {boolean} True if http or https link
 */
export function isHttpLink(href) {
  if (!href || typeof href !== 'string') {
    return false
  }

  return href.startsWith('http://') || href.startsWith('https://')
}

/**
 * Get human-readable title for a rel type
 * @param {string} rel - The link rel type
 * @returns {string} Display title
 */
export function getRelTypeTitle(rel) {
  if (!rel) {
    return 'Link'
  }

  // Check if we have a defined title mapping
  if (REL_TYPE_TITLE_MAP[rel]) {
    return REL_TYPE_TITLE_MAP[rel]
  }

  // Fallback: Convert to Title Case
  return rel
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Infer link type from MIME type or URL extension
 * @param {string} type - The link MIME type
 * @param {string} href - The link href
 * @returns {string} Link type: JSON, HTML, Image, PDF, or Unknown
 */
export function getLinkTypeFromMimeOrUrl(type, href) {
  // Check MIME type first
  if (type) {
    if (type.includes('json')) return 'JSON'
    if (type.includes('html')) return 'HTML'
    if (type.includes('image')) return 'Image'
    if (type.includes('pdf')) return 'PDF'
  }

  // Fallback to URL extension
  if (href && typeof href === 'string') {
    const lowerHref = href.toLowerCase()
    if (lowerHref.endsWith('.json')) return 'JSON'
    if (lowerHref.endsWith('.html') || lowerHref.endsWith('.htm')) return 'HTML'
    if (
      lowerHref.endsWith('.png') ||
      lowerHref.endsWith('.jpg') ||
      lowerHref.endsWith('.jpeg') ||
      lowerHref.endsWith('.gif') ||
      lowerHref.endsWith('.webp')
    )
      return 'Image'
    if (lowerHref.endsWith('.pdf')) return 'PDF'
  }

  return 'Unknown'
}

/**
 * Smart truncation of href showing meaningful parts
 * Shows domain + important path segments + filename for better UX
 * @param {string} href - The link href
 * @param {number} maxLength - Maximum length before truncation (default: 80 for better readability)
 * @returns {string} Truncated href
 */
export function truncateHref(href, maxLength = 80) {
  if (!href || typeof href !== 'string') {
    return ''
  }

  if (href.length <= maxLength) {
    return href
  }

  try {
    // Try to parse as URL
    const url = new URL(href)
    const protocol = url.protocol
    const domain = url.hostname
    const pathname = url.pathname
    const pathParts = pathname.split('/').filter(Boolean)

    // Get the last part (usually filename or item ID)
    const lastPart = pathParts[pathParts.length - 1] || ''

    // Get important middle parts (collections, items, etc.)
    const importantParts = []
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i]
      // Keep important path segments like collection names, 'items', 'collections', version numbers
      if (
        part === 'collections' ||
        part === 'items' ||
        (part.startsWith('v') && /^v\d+/.test(part)) || // version numbers like v1
        (i === pathParts.length - 2 && pathParts.length > 2) || // second to last (often collection name)
        part.length > 15 // Keep long segments as they're often meaningful IDs
      ) {
        importantParts.push(part)
      }
    }

    const domainPart = protocol + '//' + domain

    // Strategy 1: Try to show domain + important parts + last part
    if (importantParts.length > 0 && lastPart) {
      const middle = importantParts.slice(0, 2).join('/') // Limit to 2 important parts
      const attempt = `${domainPart}/${middle}/.../.../${lastPart}`
      if (attempt.length <= maxLength) {
        return attempt
      }
    }

    // Strategy 2: Show domain + ... + last part
    if (lastPart) {
      const attempt = `${domainPart}/.../.../${lastPart}`
      if (attempt.length <= maxLength) {
        return attempt
      }

      // If last part is too long, truncate it but keep the end (often has useful info)
      const availableForLastPart = maxLength - domainPart.length - 8 // 8 for "/.../.../"
      if (availableForLastPart > 15) {
        const truncatedLastPart =
          '...' + lastPart.slice(-(availableForLastPart - 3))
        return `${domainPart}/.../.../${truncatedLastPart}`
      }
    }

    // Strategy 3: Show domain + first path segment + ...
    if (pathParts.length > 0) {
      const firstPart = pathParts[0]
      const attempt = `${domainPart}/${firstPart}/...`
      if (attempt.length <= maxLength) {
        return attempt
      }
    }

    // Fallback: just show domain with ellipsis
    if (domainPart.length <= maxLength - 4) {
      return domainPart + '/...'
    }

    // Last resort: truncate domain
    return domainPart.slice(0, maxLength - 3) + '...'
  } catch (e) {
    // Not a valid URL (e.g., relative path), just truncate smartly
    // Show start and end
    const start = href.slice(0, Math.floor(maxLength / 2) - 2)
    const end = href.slice(-(Math.floor(maxLength / 2) - 2))
    return start + '...' + end
  }
}
