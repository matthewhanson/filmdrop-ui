import { describe, it, expect } from 'vitest'
import {
  LEGACY_CONFIG_KEYS,
  MODERN_CONFIG_KEYS,
  TOP_LEVEL_CONFIG_EXPECTED_TYPES,
  detectConfigFormat,
  migrateLegacyConfig,
  getLegacyKeysPresent
} from './configFormat'

describe('configFormat', () => {
  it('TOP_LEVEL_CONFIG_EXPECTED_TYPES keys match MODERN and LEGACY union', () => {
    const typedKeys = Object.keys(TOP_LEVEL_CONFIG_EXPECTED_TYPES).sort()
    const unionKeys = [
      ...new Set([...MODERN_CONFIG_KEYS, ...LEGACY_CONFIG_KEYS])
    ].sort()
    expect(typedKeys).toEqual(unionKeys)
  })

  it('detects config formats', () => {
    expect(detectConfigFormat({ COLLECTIONS_CONFIG: {} })).toBe('new')
    expect(detectConfigFormat({ SCENE_TILER_PARAMS: {} })).toBe('legacy')
    expect(
      detectConfigFormat({ COLLECTIONS_CONFIG: {}, SCENE_TILER_PARAMS: {} })
    ).toBe('mixed')
    expect(detectConfigFormat({ STAC_API_URL: 'https://example.com' })).toBe(
      'unknown'
    )
  })

  it('returns present legacy keys', () => {
    const keys = getLegacyKeysPresent({
      SCENE_TILER_PARAMS: {},
      DEFAULT_COLLECTION: 'test'
    })
    expect(keys).toEqual(['SCENE_TILER_PARAMS', 'DEFAULT_COLLECTION'])
  })

  it('migrates scene tiler params to visualizations.default', () => {
    const { migratedConfig } = migrateLegacyConfig({
      SCENE_TILER_PARAMS: {
        collectionA: {
          assets: ['red', 'green', 'blue']
        }
      }
    })
    expect(
      migratedConfig.COLLECTIONS_CONFIG.collectionA.visualizations.default
    ).toEqual({
      assets: ['red', 'green', 'blue']
    })
    expect(migratedConfig.SCENE_TILER_PARAMS).toBeUndefined()
  })

  it('keeps new format as no-op during migration', () => {
    const input = {
      COLLECTIONS: { include: ['collectionA'] },
      COLLECTIONS_CONFIG: { collectionA: { visualizations: { default: {} } } }
    }
    const { migratedConfig, removedKeys, format } = migrateLegacyConfig(input)
    expect(format).toBe('new')
    expect(removedKeys).toEqual([])
    expect(migratedConfig).toEqual(input)
  })

  it('throws for mixed format migration to prevent silent data loss', () => {
    expect(() =>
      migrateLegacyConfig({
        COLLECTIONS_CONFIG: {
          collectionA: { visualizations: { default: {} } }
        },
        SCENE_TILER_PARAMS: { collectionA: { assets: ['red'] } }
      })
    ).toThrow('Mixed configuration format is not supported for migration')
  })

  it('throws for unknown format migration', () => {
    expect(() =>
      migrateLegacyConfig({
        STAC_API_URL: 'https://example.com'
      })
    ).toThrow('Unknown configuration format')
  })

  it('filters reserved metadata keys from migrated collection ids', () => {
    const { migratedConfig } = migrateLegacyConfig({
      SCENE_TILER_PARAMS: {
        _comment: { text: 'ignored' },
        collectionA: { assets: ['red'] }
      },
      ENHANCED_DISPLAY_CONFIG: {
        _DEPRECATED_SCENE_TILER_PARAMS: { text: 'ignored' }
      }
    })

    expect(migratedConfig.COLLECTIONS_CONFIG._comment).toBeUndefined()
    expect(
      migratedConfig.COLLECTIONS_CONFIG._DEPRECATED_SCENE_TILER_PARAMS
    ).toBeUndefined()
    expect(migratedConfig.COLLECTIONS_CONFIG.collectionA).toBeDefined()
  })
})
