import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
)
const lintScript = path.join(repoRoot, 'scripts/lint-config.mjs')
const migrateScript = path.join(repoRoot, 'scripts/migrate-config.mjs')

function createTempConfig(config) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'filmdrop-config-'))
  const filePath = path.join(tempDir, 'config.json')
  fs.writeFileSync(filePath, JSON.stringify(config, null, 2))
  return filePath
}

function runNodeScript(scriptPath, args = []) {
  return execFileSync(process.execPath, [scriptPath, ...args], {
    cwd: repoRoot,
    encoding: 'utf8'
  })
}

describe('config tooling scripts', () => {
  it('lint-config passes for valid modern config', () => {
    const filePath = createTempConfig({
      STAC_API_URL: 'https://example.com',
      COLLECTIONS: { include: ['collection-a'] },
      COLLECTIONS_CONFIG: { 'collection-a': {} }
    })

    const output = runNodeScript(lintScript, [filePath])
    expect(output).toContain('Config is VALID')
    expect(output).toContain('Config format: NEW')
  })

  it('lint-config fails for missing required key', () => {
    const filePath = createTempConfig({ COLLECTIONS_CONFIG: {} })
    try {
      runNodeScript(lintScript, [filePath])
      throw new Error('Expected lint-config to fail')
    } catch (error) {
      const out = `${error.stdout ?? ''}${error.stderr ?? ''}`
      expect(out).toContain('Validation failed')
      expect(error.status).toBe(1)
    }
  })

  it('lint-config passes for minimal legacy without SEARCH_MIN_ZOOM_LEVELS', () => {
    const filePath = createTempConfig({
      STAC_API_URL: 'https://example.com',
      SCENE_TILER_PARAMS: { collectionA: { assets: ['red'] } }
    })

    const output = runNodeScript(lintScript, [filePath])
    expect(output).toContain('Config format: LEGACY')
    expect(output).toContain('Config is VALID')
    expect(output).not.toContain(
      "Legacy config requires 'SEARCH_MIN_ZOOM_LEVELS'"
    )
  })

  it('lint-config verbose hints when legacy omits SEARCH_MIN_ZOOM_LEVELS', () => {
    const filePath = createTempConfig({
      STAC_API_URL: 'https://example.com',
      SCENE_TILER_PARAMS: { collectionA: { assets: ['red'] } }
    })

    const output = runNodeScript(lintScript, ['--verbose', filePath])
    expect(output).toContain('Config format: LEGACY')
    expect(output).toContain('Config is VALID')
    expect(output).toContain('[Verbose]')
    expect(output).toContain('SEARCH_MIN_ZOOM_LEVELS')
  })

  it('lint-config fails for mixed format', () => {
    const filePath = createTempConfig({
      STAC_API_URL: 'https://example.com',
      COLLECTIONS_CONFIG: { collectionA: {} },
      SCENE_TILER_PARAMS: { collectionA: { assets: ['red'] } }
    })
    try {
      runNodeScript(lintScript, [filePath])
      throw new Error('Expected lint-config to fail')
    } catch (error) {
      const out = `${error.stdout ?? ''}${error.stderr ?? ''}`
      expect(out).toContain('Config format: MIXED')
      expect(out).toContain('Mixed format is not supported')
      expect(out).toContain('Conflicting legacy inputs: SCENE_TILER_PARAMS')
      expect(error.status).toBe(1)
    }
  })

  it('lint-config logs legacy COLLECTIONS array in mixed conflicting inputs', () => {
    const filePath = createTempConfig({
      STAC_API_URL: 'https://example.com',
      COLLECTIONS_CONFIG: { collectionA: {} },
      COLLECTIONS: ['collectionA']
    })
    try {
      runNodeScript(lintScript, [filePath])
      throw new Error('Expected lint-config to fail')
    } catch (error) {
      const out = `${error.stdout ?? ''}${error.stderr ?? ''}`
      expect(out).toContain(
        'Conflicting legacy inputs: COLLECTIONS (legacy array)'
      )
      expect(error.status).toBe(1)
    }
  })

  it('migrate-config dry-run maps scene params to visualizations.default', () => {
    const filePath = createTempConfig({
      STAC_API_URL: 'https://example.com',
      SCENE_TILER_PARAMS: {
        collectionA: { assets: ['red', 'green', 'blue'] }
      }
    })

    const output = runNodeScript(migrateScript, [
      '--input',
      filePath,
      '--dry-run'
    ])
    expect(output).toContain('DRY-RUN MODE: No files written')
    expect(output).toContain('"visualizations"')
    expect(output).toContain('"default"')
  })

  it('migrate-config removes meta collection keys', () => {
    const filePath = createTempConfig({
      SCENE_TILER_PARAMS: {
        _comment: { text: 'ignore me' },
        collectionA: { assets: ['red'] }
      }
    })

    const output = runNodeScript(migrateScript, [
      '--input',
      filePath,
      '--dry-run'
    ])
    expect(output).not.toContain('"_comment"')
    expect(output).toContain('"collectionA"')
  })

  it('migrate-config fails for mixed format in validate-only mode', () => {
    const filePath = createTempConfig({
      STAC_API_URL: 'https://example.com',
      COLLECTIONS_CONFIG: { collectionA: {} },
      SCENE_TILER_PARAMS: { collectionA: { assets: ['red'] } }
    })
    try {
      runNodeScript(migrateScript, ['--input', filePath, '--validate-only'])
      throw new Error('Expected migrate-config validate-only to fail')
    } catch (error) {
      const out = `${error.stdout ?? ''}${error.stderr ?? ''}`
      expect(out).toContain('Mixed configuration format is not supported')
      expect(out).toContain('Conflicting legacy inputs: SCENE_TILER_PARAMS')
      expect(error.status).toBe(1)
    }
  })

  it('migrate-config validate-only lists COLLECTIONS legacy array in mixed signals', () => {
    const filePath = createTempConfig({
      STAC_API_URL: 'https://example.com',
      COLLECTIONS_CONFIG: { collectionA: {} },
      COLLECTIONS: ['collectionA']
    })
    try {
      runNodeScript(migrateScript, ['--input', filePath, '--validate-only'])
      throw new Error('Expected migrate-config validate-only to fail')
    } catch (error) {
      const out = `${error.stdout ?? ''}${error.stderr ?? ''}`
      expect(out).toContain(
        'Conflicting legacy inputs: COLLECTIONS (legacy array)'
      )
      expect(out).not.toMatch(/Legacy keys found:\s*$/)
      expect(error.status).toBe(1)
    }
  })

  it('migrate-config fails for mixed format in dry-run mode', () => {
    const filePath = createTempConfig({
      STAC_API_URL: 'https://example.com',
      COLLECTIONS_CONFIG: { collectionA: {} },
      SCENE_TILER_PARAMS: { collectionA: { assets: ['red'] } }
    })
    try {
      runNodeScript(migrateScript, ['--input', filePath, '--dry-run'])
      throw new Error(
        'Expected migrate-config dry-run to fail for mixed format'
      )
    } catch (error) {
      const out = `${error.stdout ?? ''}${error.stderr ?? ''}`
      expect(out).toContain('Mixed configuration format is not supported')
      expect(out).toContain('Resolve the file to one format')
      expect(error.status).toBe(1)
    }
  })
})
