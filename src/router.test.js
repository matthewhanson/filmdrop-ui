import { describe, it, expect } from 'vitest'
import {
  RESERVED_PARAMS,
  extractQueryableParams,
  normalizeSearch,
  router
} from './router'

describe('RESERVED_PARAMS', () => {
  it('contains exactly the 8 expected keys', () => {
    expect(RESERVED_PARAMS).toEqual(
      new Set(['col', 'dt', 'view', 'viz', 'item', 'tab', 'z', 'c'])
    )
    expect(RESERVED_PARAMS.size).toBe(8)
  })
})

describe('extractQueryableParams', () => {
  it('returns empty object when all params are reserved', () => {
    expect(
      extractQueryableParams({
        col: 'sentinel-2',
        dt: '2024-01-01/2024-01-31',
        view: 'scene',
        tab: 'search',
        item: '',
        viz: '',
        z: 10,
        c: '40,-100'
      })
    ).toEqual({})
  })

  it('returns only non-reserved params', () => {
    expect(
      extractQueryableParams({
        col: 'sentinel-2',
        dt: '2024/2024',
        'eo:cloud_cover': '50',
        platform: 'sentinel-2a'
      })
    ).toEqual({
      'eo:cloud_cover': '50',
      platform: 'sentinel-2a'
    })
  })

  it('preserves _min/_max suffixed params as queryable filters', () => {
    expect(
      extractQueryableParams({
        'eo:cloud_cover_min': '0',
        'eo:cloud_cover_max': '50'
      })
    ).toEqual({
      'eo:cloud_cover_min': '0',
      'eo:cloud_cover_max': '50'
    })
  })

  it('returns empty object for empty input', () => {
    expect(extractQueryableParams({})).toEqual({})
  })
})

describe('normalizeSearch', () => {
  it('defaults missing params to empty strings, z to undefined', () => {
    const result = normalizeSearch({})
    expect(result.col).toBe('')
    expect(result.dt).toBe('')
    expect(result.view).toBe('')
    expect(result.viz).toBe('')
    expect(result.item).toBe('')
    expect(result.tab).toBe('')
    expect(result.z).toBeUndefined()
    expect(result.c).toBe('')
  })

  it('validates view against allowed values and rejects invalid', () => {
    expect(normalizeSearch({ view: 'scene' }).view).toBe('scene')
    expect(normalizeSearch({ view: 'hex' }).view).toBe('hex')
    expect(normalizeSearch({ view: 'grid-code' }).view).toBe('grid-code')
    expect(normalizeSearch({ view: 'mosaic' }).view).toBe('mosaic')
    expect(normalizeSearch({ view: 'invalid' }).view).toBe('')
    expect(normalizeSearch({ view: '' }).view).toBe('')
  })

  it('validates tab against allowed values and rejects invalid', () => {
    expect(normalizeSearch({ tab: 'search' }).tab).toBe('search')
    expect(normalizeSearch({ tab: 'details' }).tab).toBe('details')
    expect(normalizeSearch({ tab: 'bogus' }).tab).toBe('')
  })

  it('converts z to number and handles null/undefined', () => {
    expect(normalizeSearch({ z: '10' }).z).toBe(10)
    expect(normalizeSearch({ z: 5 }).z).toBe(5)
    expect(normalizeSearch({ z: null }).z).toBeUndefined()
    expect(normalizeSearch({}).z).toBeUndefined()
  })
})

describe('stringifySearch', () => {
  const stringify = router.options.stringifySearch

  it('strips empty string values from the query string', () => {
    expect(stringify({ col: 'sentinel', item: '', tab: '' })).toBe(
      '?col=sentinel'
    )
  })

  it('strips undefined and null values', () => {
    expect(stringify({ col: 'test', z: undefined, c: null })).toBe('?col=test')
  })

  it('preserves 0 and false', () => {
    const qs = stringify({ count: 0, active: false })
    expect(qs).toContain('count=0')
    expect(qs).toContain('active=false')
  })

  it('returns empty string when all values are empty', () => {
    expect(stringify({ col: '', dt: '', item: '' })).toBe('')
  })
})
