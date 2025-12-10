import { describe, it, expect } from 'vitest'
import { buildItemUrl } from './routerHelper'

describe('routerHelper', () => {
  describe('buildItemUrl', () => {
    it('constructs basic item URL with collection and item IDs', () => {
      const url = buildItemUrl('sentinel-2-l2a', 'S2A_17SNB_20230617_0_L2A')
      expect(url).toBe('/item/sentinel-2-l2a/S2A_17SNB_20230617_0_L2A')
    })

    it('encodes item IDs with colons', () => {
      const url = buildItemUrl('test-collection', 'item:with:colons')
      expect(url).toBe('/item/test-collection/item%3Awith%3Acolons')
    })

    it('encodes item IDs with slashes', () => {
      const url = buildItemUrl('test-collection', 'path/to/item')
      expect(url).toBe('/item/test-collection/path%2Fto%2Fitem')
    })

    it('encodes item IDs with mixed special characters', () => {
      const url = buildItemUrl('test-collection', 'S2A:17SNB/20230617_0_L2A')
      expect(url).toBe('/item/test-collection/S2A%3A17SNB%2F20230617_0_L2A')
    })

    it('encodes collection IDs with special characters', () => {
      const url = buildItemUrl('collection:name', 'item-id')
      expect(url).toBe('/item/collection%3Aname/item-id')
    })

    it('handles spaces in item IDs', () => {
      const url = buildItemUrl('test-collection', 'item with spaces')
      expect(url).toBe('/item/test-collection/item%20with%20spaces')
    })

    it('handles dots and underscores without encoding', () => {
      const url = buildItemUrl('test-collection', 'item_id.v1.0')
      expect(url).toBe('/item/test-collection/item_id.v1.0')
    })

    it('handles percent signs (double encoding prevention)', () => {
      const url = buildItemUrl('test-collection', 'item%20id')
      // encodeURIComponent encodes the % sign itself
      expect(url).toBe('/item/test-collection/item%2520id')
    })

    it('handles empty item IDs gracefully', () => {
      const url = buildItemUrl('test-collection', '')
      expect(url).toBe('/item/test-collection/')
    })

    it('handles very long item IDs', () => {
      const longItemId = 'a'.repeat(200)
      const url = buildItemUrl('test-collection', longItemId)
      expect(url).toBe(`/item/test-collection/${longItemId}`)
      expect(url.length).toBe('/item/test-collection/'.length + 200)
    })
  })
})
