# FilmDrop UI Config Helper Scripts

This directory contains helper configs and documentation for the JavaScript config tools.

## CLI Commands

Use the repo-level npm scripts:

```bash
# Validate config format and schema (add --verbose for banner header)
npm run config:lint -- public/config/config.json

# Preview migration from legacy -> modern format
npm run config:migrate -- --input public/config/config.json --dry-run

# Write migrated config to a new file
npm run config:migrate -- --input public/config/config.json --output public/config/config.json.migrated
```

## Maintenance: new top-level config keys

When you add a supported top-level key to the app config:

1. Add it to `MODERN_CONFIG_KEYS` in [src/utils/configFormat.js](../src/utils/configFormat.js) (and legacy list if applicable).
2. Add its **type** to `TOP_LEVEL_CONFIG_EXPECTED_TYPES` in the same file so `config:lint` stays in sync with the runtime.

The unit test `TOP_LEVEL_CONFIG_EXPECTED_TYPES keys match MODERN and LEGACY union` in [src/utils/configFormat.test.js](../src/utils/configFormat.test.js) fails if those lists diverge.

## Mixed-format policy

`config:migrate` and `config:lint` fail on mixed format (`COLLECTIONS_CONFIG` plus legacy keys) to prevent silent data loss from ambiguous precedence.

Use one of these workflows:

1. Start from a legacy-only source file, then run migration.
2. Manually reconcile values into `COLLECTIONS_CONFIG` and remove legacy keys.

## Migration Rules

The migration command converts legacy config keys into modern `COLLECTIONS_CONFIG` entries:

| Legacy Parameter                  | New Location                                    |
| --------------------------------- | ----------------------------------------------- |
| `SCENE_TILER_PARAMS[id]`          | `COLLECTIONS_CONFIG[id].visualizations.default` |
| `MOSAIC_TILER_PARAMS[id]`         | `COLLECTIONS_CONFIG[id].mosaicTilerParams`      |
| `SEARCH_MIN_ZOOM_LEVELS[id].high` | `COLLECTIONS_CONFIG[id].sceneMinZoom`           |
| `POPUP_DISPLAY_FIELDS[id]`        | `COLLECTIONS_CONFIG[id].popupDisplayFields`     |
| `TILE_LAYER_PARAMS[id]`           | `COLLECTIONS_CONFIG[id].tileLayerParams`        |
| `ENHANCED_DISPLAY_CONFIG[id]`     | `COLLECTIONS_CONFIG[id].enhancedDisplayConfig`  |
| `DEFAULT_COLLECTION`              | `COLLECTIONS.default`                           |
| `COLLECTIONS` (array)             | `COLLECTIONS.include`                           |

Reserved metadata keys (for example `_comment*` and `_DEPRECATED_*`) are excluded from collection migration.

## Strict Runtime Behavior

Runtime config loading does not auto-migrates legacy keys. Legacy or mixed configs fail at startup with guidance to run `config:migrate`.

## References

- [CONFIGURATION.md](../CONFIGURATION.md)
- [README.md](../README.md)
- `config.example.json`
- `config-new-format-example.json`
