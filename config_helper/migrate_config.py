#!/usr/bin/env python3
"""
migrate_config.py - Convert FilmDrop UI configs from legacy to new format

Automatically transforms old configuration format to the new COLLECTIONS_CONFIG structure.
Supports dry-run mode for preview and validation for input/output JSON.

Usage:
    python migrate_config.py --input config.json --output config.new.json
    python migrate_config.py --input config.json --dry-run
    python migrate_config.py --input config.json --validate-only

Options:
    --input PATH            Input config file (required)
    --output PATH           Output config file (if not provided, prints to stdout)
    --dry-run              Preview changes without writing to file
    --validate-only        Validate input only, don't migrate
    --help                 Show this help message
"""

import json
import sys
import argparse
from pathlib import Path


def load_json(filepath):
    """Load and validate JSON file."""
    try:
        with open(filepath, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: File not found: {filepath}", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in {filepath}: {e}", file=sys.stderr)
        sys.exit(1)


def save_json(filepath, data, pretty=True):
    """Save data to JSON file with validation."""
    try:
        with open(filepath, 'w') as f:
            if pretty:
                json.dump(data, f, indent=2)
            else:
                json.dump(data, f)
        return True
    except (IOError, OSError) as e:
        print(f"Error: Could not write to {filepath}: {e}", file=sys.stderr)
        return False


def print_json(data):
    """Print JSON to stdout."""
    print(json.dumps(data, indent=2))


def detect_config_format(config):
    """
    Detect if config is legacy format, new format, or mixed.
    Returns: ('legacy', 'new', or 'mixed')
    """
    has_legacy_keys = any(key in config for key in [
        'SCENE_TILER_PARAMS',
        'MOSAIC_TILER_PARAMS',
        'SEARCH_MIN_ZOOM_LEVELS',
        'POPUP_DISPLAY_FIELDS',
        'TILE_LAYER_PARAMS',
        'ENHANCED_DISPLAY_CONFIG',
        'DEFAULT_COLLECTION'
    ])
    
    has_new_key = 'COLLECTIONS_CONFIG' in config
    
    if has_new_key and not has_legacy_keys:
        return 'new'
    elif has_legacy_keys and not has_new_key:
        return 'legacy'
    elif has_legacy_keys and has_new_key:
        return 'mixed'
    else:
        return 'unknown'


def migrate_config(config):
    """
    Migrate legacy format config to new format.
    
    Transformation rules:
    - SCENE_TILER_PARAMS[id] -> COLLECTIONS_CONFIG[id].sceneTilerParams
    - MOSAIC_TILER_PARAMS[id] -> COLLECTIONS_CONFIG[id].mosaicTilerParams
    - SEARCH_MIN_ZOOM_LEVELS[id].high -> COLLECTIONS_CONFIG[id].sceneMinZoom
    - POPUP_DISPLAY_FIELDS[id] -> COLLECTIONS_CONFIG[id].popupDisplayFields
    - TILE_LAYER_PARAMS[id] -> COLLECTIONS_CONFIG[id].tileLayerParams
    - ENHANCED_DISPLAY_CONFIG[id] -> COLLECTIONS_CONFIG[id].enhancedDisplayConfig
    - DEFAULT_COLLECTION -> COLLECTIONS.default
    - COLLECTIONS (array) -> COLLECTIONS.include
    """
    migrated = config.copy()
    
    # If already new format or mixed format with COLLECTIONS_CONFIG, return as-is
    if 'COLLECTIONS_CONFIG' in migrated:
        if detect_config_format(config) == 'mixed':
            print("Warning: Config contains both legacy and new format keys.", file=sys.stderr)
            print("         COLLECTIONS_CONFIG will be used and legacy keys will be removed.", file=sys.stderr)
        # Remove legacy keys if present
        legacy_keys = [
            'SCENE_TILER_PARAMS',
            'MOSAIC_TILER_PARAMS',
            'SEARCH_MIN_ZOOM_LEVELS',
            'POPUP_DISPLAY_FIELDS',
            'TILE_LAYER_PARAMS',
            'ENHANCED_DISPLAY_CONFIG'
        ]
        for key in legacy_keys:
            migrated.pop(key, None)
        return migrated, 0  # 0 = no migration needed
    
    # Collect all collection IDs from legacy parameters
    collection_ids = set()
    
    if 'SCENE_TILER_PARAMS' in migrated and isinstance(migrated['SCENE_TILER_PARAMS'], dict):
        collection_ids.update(migrated['SCENE_TILER_PARAMS'].keys())
    
    if 'MOSAIC_TILER_PARAMS' in migrated and isinstance(migrated['MOSAIC_TILER_PARAMS'], dict):
        collection_ids.update(migrated['MOSAIC_TILER_PARAMS'].keys())
    
    if 'SEARCH_MIN_ZOOM_LEVELS' in migrated and isinstance(migrated['SEARCH_MIN_ZOOM_LEVELS'], dict):
        collection_ids.update(migrated['SEARCH_MIN_ZOOM_LEVELS'].keys())
    
    if 'POPUP_DISPLAY_FIELDS' in migrated and isinstance(migrated['POPUP_DISPLAY_FIELDS'], dict):
        collection_ids.update(migrated['POPUP_DISPLAY_FIELDS'].keys())
    
    if 'TILE_LAYER_PARAMS' in migrated and isinstance(migrated['TILE_LAYER_PARAMS'], dict):
        collection_ids.update(migrated['TILE_LAYER_PARAMS'].keys())
    
    if 'ENHANCED_DISPLAY_CONFIG' in migrated and isinstance(migrated['ENHANCED_DISPLAY_CONFIG'], dict):
        collection_ids.update(migrated['ENHANCED_DISPLAY_CONFIG'].keys())
    
    # Build new COLLECTIONS_CONFIG structure
    collections_config = {}
    
    for collection_id in sorted(collection_ids):  # Sort for consistent output
        collection_config = {}
        
        # Migrate SCENE_TILER_PARAMS
        if (migrated.get('SCENE_TILER_PARAMS') and 
            isinstance(migrated['SCENE_TILER_PARAMS'], dict) and
            collection_id in migrated['SCENE_TILER_PARAMS']):
            collection_config['sceneTilerParams'] = migrated['SCENE_TILER_PARAMS'][collection_id]
        
        # Migrate MOSAIC_TILER_PARAMS
        if (migrated.get('MOSAIC_TILER_PARAMS') and 
            isinstance(migrated['MOSAIC_TILER_PARAMS'], dict) and
            collection_id in migrated['MOSAIC_TILER_PARAMS']):
            collection_config['mosaicTilerParams'] = migrated['MOSAIC_TILER_PARAMS'][collection_id]
        
        # Migrate SEARCH_MIN_ZOOM_LEVELS (extract .high value)
        if (migrated.get('SEARCH_MIN_ZOOM_LEVELS') and 
            isinstance(migrated['SEARCH_MIN_ZOOM_LEVELS'], dict) and
            collection_id in migrated['SEARCH_MIN_ZOOM_LEVELS']):
            zoom_levels = migrated['SEARCH_MIN_ZOOM_LEVELS'][collection_id]
            if isinstance(zoom_levels, dict):
                # Extract 'high' value if available, otherwise use the value itself
                if 'high' in zoom_levels:
                    collection_config['sceneMinZoom'] = zoom_levels['high']
                elif isinstance(zoom_levels, (int, float)):
                    collection_config['sceneMinZoom'] = zoom_levels
            elif isinstance(zoom_levels, (int, float)):
                collection_config['sceneMinZoom'] = zoom_levels
        
        # Migrate POPUP_DISPLAY_FIELDS
        if (migrated.get('POPUP_DISPLAY_FIELDS') and 
            isinstance(migrated['POPUP_DISPLAY_FIELDS'], dict) and
            collection_id in migrated['POPUP_DISPLAY_FIELDS']):
            collection_config['popupDisplayFields'] = migrated['POPUP_DISPLAY_FIELDS'][collection_id]
        
        # Migrate TILE_LAYER_PARAMS
        if (migrated.get('TILE_LAYER_PARAMS') and 
            isinstance(migrated['TILE_LAYER_PARAMS'], dict) and
            collection_id in migrated['TILE_LAYER_PARAMS']):
            collection_config['tileLayerParams'] = migrated['TILE_LAYER_PARAMS'][collection_id]
        
        # Migrate ENHANCED_DISPLAY_CONFIG
        if (migrated.get('ENHANCED_DISPLAY_CONFIG') and 
            isinstance(migrated['ENHANCED_DISPLAY_CONFIG'], dict) and
            collection_id in migrated['ENHANCED_DISPLAY_CONFIG']):
            collection_config['enhancedDisplayConfig'] = migrated['ENHANCED_DISPLAY_CONFIG'][collection_id]
        
        if collection_config:  # Only add if we found any config for this collection
            collections_config[collection_id] = collection_config
    
    # Build COLLECTIONS object
    collections_obj = {}
    
    # Migrate DEFAULT_COLLECTION
    if 'DEFAULT_COLLECTION' in migrated and isinstance(migrated['DEFAULT_COLLECTION'], str):
        collections_obj['default'] = migrated['DEFAULT_COLLECTION']
    
    # Migrate COLLECTIONS array to include filter
    if 'COLLECTIONS' in migrated:
        if isinstance(migrated['COLLECTIONS'], list):
            collections_obj['include'] = migrated['COLLECTIONS']
        elif isinstance(migrated['COLLECTIONS'], dict):
            # Already in new format, preserve as-is
            collections_obj = migrated['COLLECTIONS']
    
    # Add migrated structures to config
    if collections_config:
        migrated['COLLECTIONS_CONFIG'] = collections_config
    
    if collections_obj:
        migrated['COLLECTIONS'] = collections_obj
    
    # Remove legacy keys
    legacy_keys = [
        'SCENE_TILER_PARAMS',
        'MOSAIC_TILER_PARAMS',
        'SEARCH_MIN_ZOOM_LEVELS',
        'POPUP_DISPLAY_FIELDS',
        'TILE_LAYER_PARAMS',
        'ENHANCED_DISPLAY_CONFIG',
        'DEFAULT_COLLECTION'
    ]
    
    removed_keys = []
    for key in legacy_keys:
        if key in migrated:
            migrated.pop(key)
            removed_keys.append(key)
    
    return migrated, len(removed_keys)


def print_migration_report(original, migrated, removed_count):
    """Print a human-readable report of changes."""
    print("\n" + "="*70)
    print("MIGRATION REPORT")
    print("="*70)
    
    original_format = detect_config_format(original)
    migrated_format = detect_config_format(migrated)
    
    print(f"\nOriginal format: {original_format.upper()}")
    print(f"Migrated format: {migrated_format.upper()}")
    
    if removed_count > 0:
        print(f"\nLegacy keys removed: {removed_count}")
        print(f"New COLLECTIONS_CONFIG created with {len(migrated.get('COLLECTIONS_CONFIG', {}))} collections")
        
        if 'COLLECTIONS_CONFIG' in migrated:
            print("\nCollections migrated:")
            for collection_id in sorted(migrated['COLLECTIONS_CONFIG'].keys()):
                config = migrated['COLLECTIONS_CONFIG'][collection_id]
                fields = list(config.keys())
                print(f"  - {collection_id}: {', '.join(fields)}")
        
        print("\nMigration complete!")
    else:
        print("\nNo legacy keys found - config is already in new format.")
    
    print("="*70 + "\n")


def validate_json_structure(data):
    """Validate that the migrated config has valid JSON structure."""
    try:
        json.dumps(data)
        return True
    except (TypeError, ValueError) as e:
        print(f"Error: Invalid JSON structure: {e}", file=sys.stderr)
        return False


def main():
    parser = argparse.ArgumentParser(
        description='Migrate FilmDrop UI config from legacy to new format',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  %(prog)s --input config.json --output config.new.json
  %(prog)s --input config.json --dry-run
  %(prog)s --input config.json --validate-only
        '''
    )
    
    parser.add_argument('--input', required=True, help='Input config file path')
    parser.add_argument('--output', help='Output config file path (if not provided, prints to stdout)')
    parser.add_argument('--dry-run', action='store_true', help='Preview changes without writing')
    parser.add_argument('--validate-only', action='store_true', help='Validate input only')
    
    args = parser.parse_args()
    
    # Load config
    print(f"Loading config from: {args.input}")
    config = load_json(args.input)
    
    # Validate only
    if args.validate_only:
        if not validate_json_structure(config):
            sys.exit(1)
        print("Config is valid JSON.")
        print(f"Config format: {detect_config_format(config).upper()}")
        sys.exit(0)
    
    # Migrate config
    print("Migrating config...")
    migrated_config, removed_count = migrate_config(config)
    
    # Validate migrated config
    if not validate_json_structure(migrated_config):
        sys.exit(1)
    
    # Print report
    print_migration_report(config, migrated_config, removed_count)
    
    # Handle output
    if args.dry_run:
        print("DRY-RUN MODE: No files written")
        print("\nMigrated config output:")
        print_json(migrated_config)
    else:
        if args.output:
            if save_json(args.output, migrated_config):
                print(f"✓ Migrated config written to: {args.output}")
            else:
                sys.exit(1)
        else:
            print("Migrated config (output to stdout):")
            print_json(migrated_config)


if __name__ == '__main__':
    main()
