/**
 * Calculate a reasonable step value for a range slider based on the extent.
 * The algorithm targets approximately 100 steps and returns "nice" round numbers
 * (e.g., 1, 2, 5, 10, 0.1, 0.5, etc.) rather than arbitrary values.
 *
 * @param {number} min - Minimum value of the range
 * @param {number} max - Maximum value of the range
 * @param {number} targetSteps - Target number of steps (default: 100)
 * @returns {number} - A "nice" step value (integer when >= 1, decimal otherwise)
 *
 * @example
 * calculateRangeStep(0, 100) // returns 1
 * calculateRangeStep(0, 1000) // returns 10
 * calculateRangeStep(0, 237) // returns 2
 * calculateRangeStep(0, 1) // returns 0.01
 * calculateRangeStep(0, 0.237) // returns 0.002
 */
export function calculateRangeStep(min, max, targetSteps = 100) {
  // Handle edge case: equal values
  if (min === max) {
    return 1
  }

  // Handle edge case: reversed values (swap them)
  if (min > max) {
    ;[min, max] = [max, min]
  }

  // Calculate the range extent
  const range = max - min

  // Calculate raw step size
  const rawStep = range / targetSteps

  // Handle very small steps (avoid log10 issues with zero/negative)
  if (rawStep <= 0) {
    return 1
  }

  // Determine the order of magnitude
  const magnitude = Math.floor(Math.log10(rawStep))

  // Normalize to 1-10 range
  const normalized = rawStep / Math.pow(10, magnitude)

  // Round to nearest "nice" number
  // For steps >= 1: use [1, 2, 5, 10] (integers only)
  // For steps < 1: use [1, 2, 2.5, 5, 10] (allow 2.5 for small decimals)
  let niceFactor
  if (magnitude >= 0) {
    // Will result in step >= 1, so use integer-friendly factors only
    if (normalized <= 1.5) {
      niceFactor = 1
    } else if (normalized <= 3.5) {
      niceFactor = 2
    } else if (normalized <= 7.5) {
      niceFactor = 5
    } else {
      niceFactor = 10
    }
  } else {
    // Will result in step < 1, can use 2.5
    if (normalized <= 1.5) {
      niceFactor = 1
    } else if (normalized <= 2.25) {
      niceFactor = 2
    } else if (normalized <= 3.5) {
      niceFactor = 2.5
    } else if (normalized <= 7.5) {
      niceFactor = 5
    } else {
      niceFactor = 10
    }
  }

  // Scale back to original magnitude
  return niceFactor * Math.pow(10, magnitude)
}
