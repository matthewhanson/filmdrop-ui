import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useUrlNavigate } from './useUrlNavigate'

const mockNavigate = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate
}))

describe('useUrlNavigate', () => {
  const prev = {
    col: 'sentinel-2',
    dt: '2024-01-01/2024-01-31',
    view: 'scene',
    viz: 'true-color',
    item: '',
    tab: 'search',
    z: 10,
    c: '40,-100'
  }

  beforeEach(() => {
    mockNavigate.mockClear()
  })

  /** Helper: call the navigate search function with prev */
  function getSearchResult() {
    const searchFn = mockNavigate.mock.calls[0][0].search
    return searchFn(prev)
  }

  it('setTab updates tab and uses replace', () => {
    const { result } = renderHook(() => useUrlNavigate())
    result.current.setTab('details')

    expect(mockNavigate).toHaveBeenCalledOnce()
    expect(mockNavigate.mock.calls[0][0].replace).toBe(true)
    expect(getSearchResult()).toEqual({ ...prev, tab: 'details' })
  })

  it('setViz updates viz and uses replace', () => {
    const { result } = renderHook(() => useUrlNavigate())
    result.current.setViz('false-color')

    expect(mockNavigate).toHaveBeenCalledOnce()
    expect(mockNavigate.mock.calls[0][0].replace).toBe(true)
    expect(getSearchResult()).toEqual({ ...prev, viz: 'false-color' })
  })

  it('setItem sets item and switches to details tab', () => {
    const { result } = renderHook(() => useUrlNavigate())
    result.current.setItem('SCENE-123')

    expect(mockNavigate).toHaveBeenCalledOnce()
    expect(mockNavigate.mock.calls[0][0].replace).toBe(true)
    const search = getSearchResult()
    expect(search.item).toBe('SCENE-123')
    expect(search.tab).toBe('details')
  })

  it('clearItem clears item and switches to search tab', () => {
    const { result } = renderHook(() => useUrlNavigate())
    result.current.clearItem()

    expect(mockNavigate).toHaveBeenCalledOnce()
    expect(mockNavigate.mock.calls[0][0].replace).toBe(true)
    const search = getSearchResult()
    expect(search.item).toBe('')
    expect(search.tab).toBe('search')
  })

  it('setMapView updates z and c', () => {
    const { result } = renderHook(() => useUrlNavigate())
    result.current.setMapView(12, '51.5074,-0.1278')

    expect(mockNavigate).toHaveBeenCalledOnce()
    expect(mockNavigate.mock.calls[0][0].replace).toBe(true)
    const search = getSearchResult()
    expect(search.z).toBe(12)
    expect(search.c).toBe('51.5074,-0.1278')
  })
})
