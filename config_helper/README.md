# FilmDrop UI Config Helper Scripts

This directory contains utility scripts for managing FilmDrop UI configuration files.

## Scripts

### migrate_config.py

Automatically migrates FilmDrop UI configuration files from legacy format to the modern format.
The migration transforms collection-specific parameters from scattered top-level objects into a unified `COLLECTIONS_CONFIG` structure.

**Prerequisites:**

- Python 3.6+

**Usage:**

```bash
# Preview changes without writing (dry-run mode)
python3 migrate_config.py --input config.json --dry-run

# Migrate to new file
python3 migrate_config.py --input config.json --output config.migrated.json

# Validate input only
python3 migrate_config.py --input config.json --validate-only

# Output to stdout
python3 migrate_config.py --input config.json
```

**Options:**

- `--input PATH` (required): Input config file path
- `--output PATH`: Output config file path (if not provided, outputs to stdout)
- `--dry-run`: Preview changes without writing to file
- `--validate-only`: Validate input only, don't perform migration
- `--help`: Show help message

**Transformation Rules:**

The script transforms legacy format parameters into the new `COLLECTIONS_CONFIG` structure:

| Legacy Parameter                  | New Location                                   | Transformation        |
| --------------------------------- | ---------------------------------------------- | --------------------- |
| `SCENE_TILER_PARAMS[id]`          | `COLLECTIONS_CONFIG[id].sceneTilerParams`      | Copy object directly  |
| `MOSAIC_TILER_PARAMS[id]`         | `COLLECTIONS_CONFIG[id].mosaicTilerParams`     | Copy object directly  |
| `SEARCH_MIN_ZOOM_LEVELS[id].high` | `COLLECTIONS_CONFIG[id].sceneMinZoom`          | Extract `.high` value |
| `POPUP_DISPLAY_FIELDS[id]`        | `COLLECTIONS_CONFIG[id].popupDisplayFields`    | Copy array directly   |
| `TILE_LAYER_PARAMS[id]`           | `COLLECTIONS_CONFIG[id].tileLayerParams`       | Copy object directly  |
| `ENHANCED_DISPLAY_CONFIG[id]`     | `COLLECTIONS_CONFIG[id].enhancedDisplayConfig` | Copy object directly  |
| `DEFAULT_COLLECTION`              | `COLLECTIONS.default`                          | Copy string value     |
| `COLLECTIONS` (array)             | `COLLECTIONS.include`                          | Wrap array in object  |

**Example Workflow:**

```bash
# 1. Check what will change
python3 migrate_config.py --input public/config/config.json --dry-run

# 2. Create migrated version
python3 migrate_config.py --input public/config/config.json --output public/config/config.new.json

# 3. Validate the new config
python3 lint_config.py public/config/config.new.json

# 4. Test in application (update public/config/config.json to point to new file)
# 5. Replace original if satisfied
mv public/config/config.new.json public/config/config.json
```

### lint_config.py

Validates FilmDrop UI configuration files for correctness and consistency. Checks for required parameters, type correctness, and provides suggestions for improvements.

**Prerequisites:**

- Python 3.6+

**Usage:**

```bash
python3 lint_config.py config.json
python3 lint_config.py public/config/config.json
```

**Output:**

The linter provides:

- ✓ Validation of required fields
- ✓ Type checking for parameters
- ✓ Format detection (legacy vs. new)
- ✓ Configuration structure validation
- ✓ Suggestions for improvements

**Example Output:**

```plaintext
*********************************************************************
**** Running Filmdrop UI Config Lint on config.json ****
*********************************************************************

Config format: New

[Success] Validation config - PASSED
[Success] Required config - PASSED

Config is VALID
```

**Format Detection:**

The linter automatically detects your config format:

- **New format**: Uses `COLLECTIONS_CONFIG` structure (recommended)
- **Legacy format**: Uses separate `SCENE_TILER_PARAMS`, `MOSAIC_TILER_PARAMS`, etc.
- **Mixed format**: Contains both old and new format keys (suggests migration)

For legacy configs, the linter suggests using `migrate_config.py` for automatic migration.

### test_migrate_config.py

Unit tests for the migration script. Tests transformation logic, edge cases, and data validation.

**Prerequisites:**

- Python 3.6+

**Usage:**

```bash
# Run all tests
python3 -m pytest test_migrate_config.py -v

# Or with unittest
python3 -m unittest test_migrate_config.py -v

# Run specific test class
python3 -m unittest test_migrate_config.TestMigrateConfig -v
```

**Test Coverage:**

- Format detection (new, legacy, mixed)
- Parameter transformation for each legacy field
- Full config migration
- Mixed format cleanup
- Partial migrations
- Edge cases (empty config, extra fields, etc.)
- JSON validation

## Complete Migration Workflow

If you're using legacy configuration format, here's the recommended migration path:

### Step 1: Check Current Format

```bash
python3 lint_config.py public/config/config.json
```

If it shows "Legacy format detected", continue to Step 2.

### Step 2: Preview Migration

```bash
python3 migrate_config.py --input public/config/config.json --dry-run
```

Review the output to ensure it looks correct.

### Step 3: Run Migration

```bash
python3 migrate_config.py \
  --input public/config/config.json \
  --output public/config/config.json.migrated
```

### Step 4: Validate Result

```bash
python3 lint_config.py public/config/config.json.migrated
```

Ensure it shows "New format" and passes validation.

### Step 5: Test Application

Update your app config to use the migrated file and test thoroughly:

```bash
# In your development environment
cp public/config/config.json.migrated public/config/config.json
npm start
```

Verify:

- App loads without errors
- Collections appear correctly
- Visualizations work
- All features function normally

### Step 6: Deploy

Once testing is complete, replace the original config:

```bash
mv public/config/config.json.migrated public/config/config.json
```

## Troubleshooting

### Script Fails with "Invalid JSON"

Your config file has JSON syntax errors. Use a JSON validator:

```bash
python3 -m json.tool public/config/config.json
```

This will show you the exact line with the error.

### Migration Produces Unexpected Output

1. Verify input format: `python3 lint_config.py public/config/config.json`
2. Check for mixed format keys
3. Review the transformation rules above
4. Run with `--dry-run` to preview before writing

### After Migration, App Doesn't Load

1. Check console for JavaScript errors
2. Verify migrated config is valid JSON: `python3 -m json.tool public/config/config.json`
3. Run linter on migrated config: `python3 lint_config.py public/config/config.json`
4. Compare against example in `config-new-format-example.json`

## Configuration Examples

### Legacy Format Example

See `config.example.json` for a comprehensive example using the old format.

### New Format Example

See `config-new-format-example.json` for a comprehensive example using the modern format.

## Additional Resources

- [CONFIGURATION.md](../CONFIGURATION.md) - Complete configuration reference
- [README.md](../README.md) - Project overview
- [CodeResearch.md](.paw/work/config-backward-compatibility/CodeResearch.md) - Technical details on format changes
