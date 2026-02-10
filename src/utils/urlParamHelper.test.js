import { describe, it, expect } from 'vitest'
import {
  serializeQueryableFiltersForUrl,
  deserializeQueryableFiltersFromURL
} from './urlParamHelper'

describe('serializeQueryableFiltersForUrl', () => {
  it('returns empty object for empty filters', () => {
    expect(serializeQueryableFiltersForUrl({})).toEqual({})
  })

  it('skips null and undefined values', () => {
    expect(
      serializeQueryableFiltersForUrl({ field1: null, field2: undefined })
    ).toEqual({})
  })

  it('serializes range objects to _min/_max string pairs', () => {
    expect(
      serializeQueryableFiltersForUrl({
        'eo:cloud_cover': { min: 0, max: 50 }
      })
    ).toEqual({
      'eo:cloud_cover_min': '0',
      'eo:cloud_cover_max': '50'
    })
  })

  it('serializes arrays as comma-separated strings', () => {
    expect(
      serializeQueryableFiltersForUrl({
        platform: ['sentinel-2a', 'sentinel-2b']
      })
    ).toEqual({ platform: 'sentinel-2a,sentinel-2b' })
  })

  it('skips empty arrays', () => {
    expect(serializeQueryableFiltersForUrl({ platform: [] })).toEqual({})
  })

  it('serializes booleans as strings', () => {
    expect(serializeQueryableFiltersForUrl({ active: true })).toEqual({
      active: 'true'
    })
    expect(serializeQueryableFiltersForUrl({ active: false })).toEqual({
      active: 'false'
    })
  })

  it('serializes numbers as strings', () => {
    expect(serializeQueryableFiltersForUrl({ gsd: 10.5 })).toEqual({
      gsd: '10.5'
    })
  })

  it('passes through string values', () => {
    expect(
      serializeQueryableFiltersForUrl({ constellation: 'sentinel-2' })
    ).toEqual({ constellation: 'sentinel-2' })
  })

  it('handles mixed filter types in one call', () => {
    const filters = {
      'eo:cloud_cover': { min: 0, max: 50 },
      platform: ['sentinel-2a', 'sentinel-2b'],
      active: true,
      gsd: 10,
      constellation: 'sentinel-2',
      empty: null
    }
    expect(serializeQueryableFiltersForUrl(filters)).toEqual({
      'eo:cloud_cover_min': '0',
      'eo:cloud_cover_max': '50',
      platform: 'sentinel-2a,sentinel-2b',
      active: 'true',
      gsd: '10',
      constellation: 'sentinel-2'
    })
  })
})

describe('deserializeQueryableFiltersFromURL', () => {
  it('returns empty object when queryables is null', () => {
    expect(deserializeQueryableFiltersFromURL({ foo: 'bar' }, null)).toEqual({})
  })

  it('returns empty object when queryables has no properties', () => {
    expect(deserializeQueryableFiltersFromURL({ foo: 'bar' }, {})).toEqual({})
  })

  it('deserializes _min/_max pairs into range objects for number type', () => {
    const params = {
      'eo:cloud_cover_min': '0',
      'eo:cloud_cover_max': '50.5'
    }
    const queryables = {
      properties: { 'eo:cloud_cover': { type: 'number' } }
    }
    expect(deserializeQueryableFiltersFromURL(params, queryables)).toEqual({
      'eo:cloud_cover': { min: 0, max: 50.5 }
    })
  })

  it('deserializes _min/_max pairs for integer type with parseInt', () => {
    const params = { count_min: '10', count_max: '100' }
    const queryables = { properties: { count: { type: 'integer' } } }
    const result = deserializeQueryableFiltersFromURL(params, queryables)
    expect(result).toEqual({ count: { min: 10, max: 100 } })
    expect(Number.isInteger(result.count.min)).toBe(true)
    expect(Number.isInteger(result.count.max)).toBe(true)
  })

  it('skips range when only _min is present', () => {
    const params = { 'eo:cloud_cover_min': '0' }
    const queryables = {
      properties: { 'eo:cloud_cover': { type: 'number' } }
    }
    expect(deserializeQueryableFiltersFromURL(params, queryables)).toEqual({})
  })

  it('deserializes comma-separated strings into arrays', () => {
    const params = { platform: 'sentinel-2a,sentinel-2b' }
    const queryables = { properties: { platform: { type: 'array' } } }
    expect(deserializeQueryableFiltersFromURL(params, queryables)).toEqual({
      platform: ['sentinel-2a', 'sentinel-2b']
    })
  })

  it('deserializes number type with parseFloat', () => {
    const params = { gsd: '10.5' }
    const queryables = { properties: { gsd: { type: 'number' } } }
    expect(deserializeQueryableFiltersFromURL(params, queryables)).toEqual({
      gsd: 10.5
    })
  })

  it('deserializes integer type with parseInt', () => {
    const params = { count: '42' }
    const queryables = { properties: { count: { type: 'integer' } } }
    const result = deserializeQueryableFiltersFromURL(params, queryables)
    expect(result).toEqual({ count: 42 })
    expect(Number.isInteger(result.count)).toBe(true)
  })

  it('passes through string type unchanged', () => {
    const params = { constellation: 'sentinel-2' }
    const queryables = {
      properties: { constellation: { type: 'string' } }
    }
    expect(deserializeQueryableFiltersFromURL(params, queryables)).toEqual({
      constellation: 'sentinel-2'
    })
  })

  it('ignores params not in queryables schema', () => {
    const params = { unknown_field: 'value' }
    const queryables = {
      properties: { known_field: { type: 'string' } }
    }
    expect(deserializeQueryableFiltersFromURL(params, queryables)).toEqual({})
  })
})

describe('serialize/deserialize roundtrip', () => {
  it('preserves filter state through serialization roundtrip', () => {
    const originalFilters = {
      'eo:cloud_cover': { min: 0, max: 50 },
      platform: ['sentinel-2a', 'sentinel-2b'],
      gsd: 10.5,
      count: 42,
      constellation: 'sentinel-2'
    }

    const queryables = {
      properties: {
        'eo:cloud_cover': { type: 'number' },
        platform: { type: 'array' },
        gsd: { type: 'number' },
        count: { type: 'integer' },
        constellation: { type: 'string' }
      }
    }

    const serialized = serializeQueryableFiltersForUrl(originalFilters)
    const deserialized = deserializeQueryableFiltersFromURL(
      serialized,
      queryables
    )

    expect(deserialized).toEqual(originalFilters)
  })
})
