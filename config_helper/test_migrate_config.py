#!/usr/bin/env python3
"""
test_migrate_config.py - Unit tests for migrate_config.py

Tests the migration script's transformation of legacy to new format.
"""

import unittest
import json
import sys
from io import StringIO
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))
from migrate_config import (
    detect_config_format,
    migrate_config,
    validate_json_structure,
    load_json,
    save_json
)


class TestDetectConfigFormat(unittest.TestCase):
    """Test config format detection."""
    
    def test_detect_new_format(self):
        """Test detection of new format."""
        config = {
            'STAC_API_URL': 'http://example.com',
            'COLLECTIONS_CONFIG': {
                'sentinel-2': {'sceneMinZoom': 7}
            }
        }
        self.assertEqual(detect_config_format(config), 'new')
    
    def test_detect_legacy_format(self):
        """Test detection of legacy format."""
        config = {
            'STAC_API_URL': 'http://example.com',
            'SCENE_TILER_PARAMS': {'sentinel-2': {}},
            'DEFAULT_COLLECTION': 'sentinel-2'
        }
        self.assertEqual(detect_config_format(config), 'legacy')
    
    def test_detect_mixed_format(self):
        """Test detection of mixed format."""
        config = {
            'STAC_API_URL': 'http://example.com',
            'SCENE_TILER_PARAMS': {'sentinel-2': {}},
            'COLLECTIONS_CONFIG': {'sentinel-2': {}}
        }
        self.assertEqual(detect_config_format(config), 'mixed')
    
    def test_detect_unknown_format(self):
        """Test detection with neither format."""
        config = {
            'STAC_API_URL': 'http://example.com',
            'BASEMAP': {}
        }
        self.assertEqual(detect_config_format(config), 'unknown')


class TestMigrateConfig(unittest.TestCase):
    """Test config migration logic."""
    
    def test_migrate_scene_tiler_params(self):
        """Test SCENE_TILER_PARAMS migration."""
        config = {
            'SCENE_TILER_PARAMS': {
                'sentinel-2': {
                    'assets': ['red', 'green', 'blue'],
                    'color_formula': 'Gamma+RGB+3.2'
                }
            }
        }
        migrated, count = migrate_config(config)
        
        self.assertNotIn('SCENE_TILER_PARAMS', migrated)
        self.assertIn('COLLECTIONS_CONFIG', migrated)
        self.assertIn('sentinel-2', migrated['COLLECTIONS_CONFIG'])
        self.assertEqual(
            migrated['COLLECTIONS_CONFIG']['sentinel-2']['sceneTilerParams'],
            {'assets': ['red', 'green', 'blue'], 'color_formula': 'Gamma+RGB+3.2'}
        )
        self.assertEqual(count, 1)
    
    def test_migrate_mosaic_tiler_params(self):
        """Test MOSAIC_TILER_PARAMS migration."""
        config = {
            'MOSAIC_TILER_PARAMS': {
                'sentinel-2': {'assets': ['visual']}
            }
        }
        migrated, count = migrate_config(config)
        
        self.assertNotIn('MOSAIC_TILER_PARAMS', migrated)
        self.assertEqual(
            migrated['COLLECTIONS_CONFIG']['sentinel-2']['mosaicTilerParams'],
            {'assets': ['visual']}
        )
    
    def test_migrate_search_min_zoom_levels(self):
        """Test SEARCH_MIN_ZOOM_LEVELS migration (extract .high)."""
        config = {
            'SEARCH_MIN_ZOOM_LEVELS': {
                'sentinel-2': {'medium': 4, 'high': 7},
                'landsat': {'medium': 4, 'high': 9}
            }
        }
        migrated, count = migrate_config(config)
        
        self.assertNotIn('SEARCH_MIN_ZOOM_LEVELS', migrated)
        self.assertEqual(migrated['COLLECTIONS_CONFIG']['sentinel-2']['sceneMinZoom'], 7)
        self.assertEqual(migrated['COLLECTIONS_CONFIG']['landsat']['sceneMinZoom'], 9)
    
    def test_migrate_popup_display_fields(self):
        """Test POPUP_DISPLAY_FIELDS migration."""
        config = {
            'POPUP_DISPLAY_FIELDS': {
                'sentinel-2': ['datetime', 'platform', 'eo:cloud_cover'],
                'landsat': ['datetime', 'platform']
            }
        }
        migrated, count = migrate_config(config)
        
        self.assertNotIn('POPUP_DISPLAY_FIELDS', migrated)
        self.assertEqual(
            migrated['COLLECTIONS_CONFIG']['sentinel-2']['popupDisplayFields'],
            ['datetime', 'platform', 'eo:cloud_cover']
        )
        self.assertEqual(
            migrated['COLLECTIONS_CONFIG']['landsat']['popupDisplayFields'],
            ['datetime', 'platform']
        )
    
    def test_migrate_tile_layer_params(self):
        """Test TILE_LAYER_PARAMS migration."""
        config = {
            'TILE_LAYER_PARAMS': {
                'sentinel-2': {'minzoom': 0, 'maxzoom': 18}
            }
        }
        migrated, count = migrate_config(config)
        
        self.assertNotIn('TILE_LAYER_PARAMS', migrated)
        self.assertEqual(
            migrated['COLLECTIONS_CONFIG']['sentinel-2']['tileLayerParams'],
            {'minzoom': 0, 'maxzoom': 18}
        )
    
    def test_migrate_enhanced_display_config(self):
        """Test ENHANCED_DISPLAY_CONFIG migration."""
        config = {
            'ENHANCED_DISPLAY_CONFIG': {
                'sentinel-2': {'field1': 'value1', 'field2': 'value2'}
            }
        }
        migrated, count = migrate_config(config)
        
        self.assertNotIn('ENHANCED_DISPLAY_CONFIG', migrated)
        self.assertEqual(
            migrated['COLLECTIONS_CONFIG']['sentinel-2']['enhancedDisplayConfig'],
            {'field1': 'value1', 'field2': 'value2'}
        )
    
    def test_migrate_default_collection(self):
        """Test DEFAULT_COLLECTION migration."""
        config = {
            'DEFAULT_COLLECTION': 'sentinel-2'
        }
        migrated, count = migrate_config(config)
        
        self.assertNotIn('DEFAULT_COLLECTION', migrated)
        self.assertEqual(migrated['COLLECTIONS']['default'], 'sentinel-2')
    
    def test_migrate_collections_array(self):
        """Test COLLECTIONS array migration to include filter."""
        config = {
            'COLLECTIONS': ['sentinel-2', 'landsat', 'naip']
        }
        migrated, count = migrate_config(config)
        
        # COLLECTIONS should be converted to dict with 'include' key
        self.assertIn('COLLECTIONS', migrated)
        self.assertIsInstance(migrated.get('COLLECTIONS'), dict)
        self.assertEqual(
            migrated['COLLECTIONS']['include'],
            ['sentinel-2', 'landsat', 'naip']
        )
    
    def test_migrate_full_legacy_config(self):
        """Test migration of complete legacy config."""
        config = {
            'STAC_API_URL': 'http://example.com',
            'SCENE_TILER_PARAMS': {
                'sentinel-2': {'assets': ['red', 'green', 'blue']},
                'landsat': {'assets': ['red', 'green', 'blue']}
            },
            'MOSAIC_TILER_PARAMS': {
                'sentinel-2': {'assets': ['visual']},
                'landsat': {'assets': ['red']}
            },
            'SEARCH_MIN_ZOOM_LEVELS': {
                'sentinel-2': {'high': 7},
                'landsat': {'high': 8}
            },
            'POPUP_DISPLAY_FIELDS': {
                'sentinel-2': ['datetime', 'platform'],
                'landsat': ['datetime', 'platform']
            },
            'DEFAULT_COLLECTION': 'sentinel-2',
            'COLLECTIONS': ['sentinel-2', 'landsat']
        }
        
        migrated, count = migrate_config(config)
        
        # Check structure
        self.assertIn('COLLECTIONS_CONFIG', migrated)
        self.assertIn('COLLECTIONS', migrated)
        self.assertEqual(len(migrated['COLLECTIONS_CONFIG']), 2)
        
        # Check collections
        self.assertIn('sentinel-2', migrated['COLLECTIONS_CONFIG'])
        self.assertIn('landsat', migrated['COLLECTIONS_CONFIG'])
        
        # Check migration
        self.assertEqual(migrated['COLLECTIONS']['default'], 'sentinel-2')
        self.assertEqual(migrated['COLLECTIONS']['include'], ['sentinel-2', 'landsat'])
        
        # Check removal of legacy keys
        legacy_keys = [
            'SCENE_TILER_PARAMS', 'MOSAIC_TILER_PARAMS', 'SEARCH_MIN_ZOOM_LEVELS',
            'POPUP_DISPLAY_FIELDS', 'DEFAULT_COLLECTION'
        ]
        for key in legacy_keys:
            self.assertNotIn(key, migrated)
        
        # Check preservation of non-config keys
        self.assertEqual(migrated['STAC_API_URL'], 'http://example.com')
    
    def test_migrate_already_new_format(self):
        """Test that new format configs are preserved."""
        config = {
            'STAC_API_URL': 'http://example.com',
            'COLLECTIONS_CONFIG': {
                'sentinel-2': {'sceneMinZoom': 7}
            }
        }
        migrated, count = migrate_config(config)
        
        self.assertEqual(migrated, config)
        self.assertEqual(count, 0)
    
    def test_migrate_mixed_format_cleanup(self):
        """Test that mixed format removes legacy keys."""
        config = {
            'STAC_API_URL': 'http://example.com',
            'SCENE_TILER_PARAMS': {'sentinel-2': {}},  # Legacy
            'COLLECTIONS_CONFIG': {'sentinel-2': {'sceneMinZoom': 7}}  # New
        }
        migrated, count = migrate_config(config)
        
        # Should keep COLLECTIONS_CONFIG and remove SCENE_TILER_PARAMS
        self.assertIn('COLLECTIONS_CONFIG', migrated)
        self.assertNotIn('SCENE_TILER_PARAMS', migrated)
    
    def test_partial_migration(self):
        """Test migration with only some legacy keys present."""
        config = {
            'SCENE_TILER_PARAMS': {
                'sentinel-2': {'assets': ['red', 'green', 'blue']}
            },
            'SEARCH_MIN_ZOOM_LEVELS': {
                'sentinel-2': {'high': 7}
            }
        }
        migrated, count = migrate_config(config)
        
        self.assertIn('COLLECTIONS_CONFIG', migrated)
        config_s2 = migrated['COLLECTIONS_CONFIG']['sentinel-2']
        
        self.assertIn('sceneTilerParams', config_s2)
        self.assertIn('sceneMinZoom', config_s2)
        self.assertEqual(config_s2['sceneMinZoom'], 7)


class TestValidateJsonStructure(unittest.TestCase):
    """Test JSON validation."""
    
    def test_valid_json_structure(self):
        """Test validation of valid JSON."""
        data = {'key': 'value', 'list': [1, 2, 3]}
        self.assertTrue(validate_json_structure(data))
    
    def test_valid_complex_structure(self):
        """Test validation of complex nested structure."""
        data = {
            'COLLECTIONS_CONFIG': {
                'sentinel-2': {
                    'sceneTilerParams': {'assets': ['red']},
                    'sceneMinZoom': 7
                }
            }
        }
        self.assertTrue(validate_json_structure(data))


class TestMigrationEdgeCases(unittest.TestCase):
    """Test edge cases in migration."""
    
    def test_empty_config(self):
        """Test migration of empty config."""
        config = {}
        migrated, count = migrate_config(config)
        self.assertEqual(migrated, {})
        self.assertEqual(count, 0)
    
    def test_config_with_extra_fields(self):
        """Test that non-config fields are preserved."""
        config = {
            'STAC_API_URL': 'http://example.com',
            'BASEMAP': {'url': 'http://example.com/tiles'},
            'SCENE_TILER_PARAMS': {'sentinel-2': {}}
        }
        migrated, count = migrate_config(config)
        
        self.assertEqual(migrated['STAC_API_URL'], 'http://example.com')
        self.assertEqual(migrated['BASEMAP'], {'url': 'http://example.com/tiles'})
    
    def test_numeric_zoom_level(self):
        """Test SEARCH_MIN_ZOOM_LEVELS with numeric value."""
        config = {
            'SEARCH_MIN_ZOOM_LEVELS': {
                'sentinel-2': 7
            }
        }
        migrated, count = migrate_config(config)
        
        self.assertEqual(migrated['COLLECTIONS_CONFIG']['sentinel-2']['sceneMinZoom'], 7)
    
    def test_collections_already_object(self):
        """Test COLLECTIONS that is already an object."""
        config = {
            'COLLECTIONS': {
                'default': 'sentinel-2',
                'include': ['sentinel-2', 'landsat']
            }
        }
        migrated, count = migrate_config(config)
        
        self.assertEqual(
            migrated['COLLECTIONS'],
            {
                'default': 'sentinel-2',
                'include': ['sentinel-2', 'landsat']
            }
        )


if __name__ == '__main__':
    unittest.main()
