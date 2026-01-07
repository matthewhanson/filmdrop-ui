import { describe, expect, it } from 'vitest'
import { syncSelectionWithFetchedItem } from './selectionSync'

describe('syncSelectionWithFetchedItem', () => {
  const baseClickResults = [
    {
      id: 'scene-a',
      collection: 'sentinel-2',
      properties: { title: 'first scene' }
    },
    {
      id: 'scene-b',
      collection: 'sentinel-2',
      properties: { title: 'second scene', keepMe: true },
      assets: {
        thumbnail: { href: 'old-thumb' }
      }
    }
  ]

  it('merges fetched item into existing list without collapsing overlaps', () => {
    const fetchedItem = {
      id: 'scene-b',
      collection: 'sentinel-2',
      properties: { title: 'updated title' },
      assets: {
        data: { href: 'new-asset' }
      },
      geometry: { type: 'Point', coordinates: [0, 0] }
    }

    const { clickResults, selectedIndex, currentResult } =
      syncSelectionWithFetchedItem(baseClickResults, fetchedItem)

    expect(selectedIndex).toBe(1)
    expect(clickResults).toHaveLength(2)
    expect(clickResults[0]).toBe(baseClickResults[0])
    expect(clickResults[1].properties.title).toBe('updated title')
    expect(clickResults[1].properties.keepMe).toBe(true)
    expect(clickResults[1].assets).toEqual({
      thumbnail: { href: 'old-thumb' },
      data: { href: 'new-asset' }
    })
    expect(currentResult).toEqual(clickResults[1])
  })

  it('creates single-item selection when no prior click results', () => {
    const fetchedItem = {
      id: 'scene-c',
      collection: 'landsat-8',
      properties: { title: 'solo scene' }
    }

    const { clickResults, selectedIndex, currentResult } =
      syncSelectionWithFetchedItem([], fetchedItem)

    expect(selectedIndex).toBe(0)
    expect(clickResults).toEqual([fetchedItem])
    expect(currentResult).toBe(fetchedItem)
  })

  it('falls back to single-item selection when requested item is absent', () => {
    const existingClickResults = [
      { id: 'scene-x', collection: 'sentinel-2', properties: { title: 'x' } }
    ]
    const fetchedItem = {
      id: 'scene-y',
      collection: 'sentinel-2',
      properties: { title: 'new scene' }
    }

    const { clickResults, selectedIndex, currentResult } =
      syncSelectionWithFetchedItem(existingClickResults, fetchedItem)

    expect(selectedIndex).toBe(0)
    expect(clickResults).toEqual([fetchedItem])
    expect(currentResult).toBe(fetchedItem)
  })
})
