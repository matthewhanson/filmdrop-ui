/**
 * Check if a field name matches a pattern from the exclusion list.
 * Supports exact matches and prefix patterns (ending with '*').
 *
 * @param {string} fieldName - The field name to check
 * @param {string} pattern - The pattern to match against (can use '*' suffix for prefix matching)
 * @returns {boolean} - True if the field matches the pattern
 *
 * @example
 * fieldMatchesPattern('proj:epsg', 'proj:*') // true
 * fieldMatchesPattern('proj:epsg', 'proj:epsg') // true
 * fieldMatchesPattern('datetime', 'datetime') // true
 * fieldMatchesPattern('eo:cloud_cover', 'proj:*') // false
 */
export function fieldMatchesPattern(fieldName, pattern) {
  if (!fieldName || !pattern) {
    return false
  }

  // Check for wildcard pattern (ends with *)
  if (pattern.endsWith('*')) {
    const prefix = pattern.slice(0, -1) // Remove the *
    return fieldName.startsWith(prefix)
  }

  // Exact match
  return fieldName === pattern
}

/**
 * Check if a field should be excluded based on an array of exclusion patterns.
 *
 * @param {string} fieldName - The field name to check
 * @param {string[]} exclusionPatterns - Array of patterns to match against
 * @returns {boolean} - True if the field should be excluded
 *
 * @example
 * isFieldExcluded('proj:epsg', ['datetime', 'proj:*']) // true
 * isFieldExcluded('eo:cloud_cover', ['datetime', 'proj:*']) // false
 */
export function isFieldExcluded(fieldName, exclusionPatterns) {
  if (!fieldName || !Array.isArray(exclusionPatterns)) {
    return false
  }

  return exclusionPatterns.some((pattern) =>
    fieldMatchesPattern(fieldName, pattern)
  )
}
