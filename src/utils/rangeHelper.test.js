import { describe, it, expect } from 'vitest'
import { calculateRangeStep } from './rangeHelper'

describe('calculateRangeStep', () => {
  describe('integer ranges', () => {
    it('returns step of 1 for range [0, 100]', () => {
      const step = calculateRangeStep(0, 100)
      expect(step).toBe(1)
      expect(Number.isInteger(step)).toBe(true)
    })

    it('returns step of 10 for range [0, 1000]', () => {
      const step = calculateRangeStep(0, 1000)
      expect(step).toBe(10)
      expect(Number.isInteger(step)).toBe(true)
    })

    it('returns step of 1 for range [500, 600]', () => {
      const step = calculateRangeStep(500, 600)
      expect(step).toBe(1)
      expect(Number.isInteger(step)).toBe(true)
    })

    it('returns step of 100 for range [0, 10000]', () => {
      const step = calculateRangeStep(0, 10000)
      expect(step).toBe(100)
      expect(Number.isInteger(step)).toBe(true)
    })
  })

  describe('decimal ranges', () => {
    it('returns step of 0.01 for range [0, 1]', () => {
      const step = calculateRangeStep(0, 1)
      expect(step).toBe(0.01)
    })

    it('returns step of 0.005 for range [0, 0.5]', () => {
      const step = calculateRangeStep(0, 0.5)
      expect(step).toBe(0.005)
    })

    it('returns step of 0.001 for range [0.1, 0.2]', () => {
      const step = calculateRangeStep(0.1, 0.2)
      expect(step).toBe(0.001)
    })
  })

  describe('"ugly" ranges that should round to nice numbers', () => {
    it('returns step of 2 (not 2.37) for range [0, 237]', () => {
      const step = calculateRangeStep(0, 237)
      expect(step).toBe(2)
      expect(Number.isInteger(step)).toBe(true)
    })

    it('returns step of 0.002 (not 0.00237) for range [0, 0.237]', () => {
      const step = calculateRangeStep(0, 0.237)
      expect(step).toBe(0.002)
    })

    it('returns step of 5 for range [0, 432]', () => {
      const step = calculateRangeStep(0, 432)
      expect(step).toBe(5)
    })

    it('returns step of 0.05 for range [0, 4.32]', () => {
      const step = calculateRangeStep(0, 4.32)
      expect(step).toBe(0.05)
    })
  })

  describe('large ranges', () => {
    it('returns step of 10000 for range [0, 1000000]', () => {
      const step = calculateRangeStep(0, 1000000)
      expect(step).toBe(10000)
      expect(Number.isInteger(step)).toBe(true)
    })

    it('returns nice step for range [0, 10000000]', () => {
      const step = calculateRangeStep(0, 10000000)
      expect(step).toBe(100000)
      expect(Number.isInteger(step)).toBe(true)
    })
  })

  describe('small ranges', () => {
    it('returns step of 0.00001 for range [0, 0.001]', () => {
      const step = calculateRangeStep(0, 0.001)
      expect(step).toBe(0.00001)
    })

    it('returns nice step for very small range [0, 0.0001]', () => {
      const step = calculateRangeStep(0, 0.0001)
      expect(step).toBe(0.000001)
    })
  })

  describe('negative ranges', () => {
    it('returns step of 2 for range [-100, 100]', () => {
      const step = calculateRangeStep(-100, 100)
      expect(step).toBe(2)
      expect(Number.isInteger(step)).toBe(true)
    })

    it('returns step of 0.5 for range [-50, 0]', () => {
      const step = calculateRangeStep(-50, 0)
      expect(step).toBe(0.5)
    })

    it('returns step of 0.01 for range [-0.5, 0.5]', () => {
      const step = calculateRangeStep(-0.5, 0.5)
      expect(step).toBe(0.01)
    })
  })

  describe('edge cases', () => {
    it('returns 1 when min equals max', () => {
      const step = calculateRangeStep(5, 5)
      expect(step).toBe(1)
    })

    it('handles reversed values (min > max) by swapping', () => {
      const step = calculateRangeStep(100, 0)
      expect(step).toBe(1)
    })

    it('handles reversed decimal values', () => {
      const step = calculateRangeStep(1, 0)
      expect(step).toBe(0.01)
    })
  })

  describe('step count verification (~100 steps)', () => {
    it('produces approximately 100 steps for range [0, 100]', () => {
      const step = calculateRangeStep(0, 100)
      const stepCount = 100 / step
      expect(stepCount).toBe(100)
    })

    it('produces approximately 100 steps for range [0, 1000]', () => {
      const step = calculateRangeStep(0, 1000)
      const stepCount = 1000 / step
      expect(stepCount).toBe(100)
    })

    it('produces approximately 100 steps for range [0, 237]', () => {
      const step = calculateRangeStep(0, 237)
      const stepCount = 237 / step
      expect(stepCount).toBeGreaterThanOrEqual(80)
      expect(stepCount).toBeLessThanOrEqual(120)
    })

    it('produces approximately 100 steps for range [0, 1]', () => {
      const step = calculateRangeStep(0, 1)
      const stepCount = 1 / step
      expect(stepCount).toBe(100)
    })
  })

  describe('nice number verification', () => {
    it('always returns values from nice number sequence', () => {
      const testRanges = [
        [0, 123],
        [0, 456],
        [0, 789],
        [0, 0.123],
        [0, 0.456],
        [0, 0.789]
      ]

      testRanges.forEach(([min, max]) => {
        const step = calculateRangeStep(min, max)
        const magnitude = Math.floor(Math.log10(step))
        const normalized = step / Math.pow(10, magnitude)

        // Should be one of: 1, 2, 2.5, 5, 10 (accounting for floating point)
        const isNice =
          Math.abs(normalized - 1) < 0.001 ||
          Math.abs(normalized - 2) < 0.001 ||
          Math.abs(normalized - 2.5) < 0.001 ||
          Math.abs(normalized - 5) < 0.001 ||
          Math.abs(normalized - 10) < 0.001

        expect(isNice).toBe(true)
      })
    })
  })

  describe('custom target steps', () => {
    it('allows custom target steps parameter', () => {
      const step50 = calculateRangeStep(0, 100, 50)
      expect(step50).toBe(2)

      const step200 = calculateRangeStep(0, 100, 200)
      expect(step200).toBe(0.5)
    })
  })
})
