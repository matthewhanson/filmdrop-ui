#!/usr/bin/env python3
"""
test_lint_config.py - Unit tests for lint_config.py

Tests the linter's format detection and validation logic.
"""

import unittest
import sys
from io import StringIO
from pathlib import Path
import json
import tempfile
import os

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))
from lint_config import detect_config_format, lint_config


class TestDetectConfigFormat(unittest.TestCase):
    """Test config format detection in linter."""
    
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
            'SEARCH_MIN_ZOOM_LEVELS': {'sentinel-2': {'high': 7}},
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


class TestLintConfigValidation(unittest.TestCase):
    """Test linter validation logic."""
    
    def create_config_file(self, config_dict):
        """Helper to create a temporary config file."""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(config_dict, f)
            return f.name
    
    def tearDown(self):
        """Clean up temp files."""
        # Note: In a real scenario, we'd track and delete all temp files
        pass
    
    def test_lint_new_format_valid(self):
        """Test linting a valid new format config."""
        config = {
            'STAC_API_URL': 'http://example.com',
            'BASEMAP': {'url': 'http://tiles.example.com'},
            'COLLECTIONS_CONFIG': {'sentinel-2': {'sceneMinZoom': 7}}
        }
        filepath = self.create_config_file(config)
        
        try:
            # Capture output
            old_stdout = sys.stdout
            sys.stdout = StringIO()
            
            result = lint_config(filepath)
            
            output = sys.stdout.getvalue()
            sys.stdout = old_stdout
            
            self.assertTrue(result)
            self.assertIn('NEW', output)
            self.assertIn('VALID', output)
        finally:
            os.unlink(filepath)
    
    def test_lint_legacy_format_valid(self):
        """Test linting a valid legacy format config."""
        config = {
            'STAC_API_URL': 'http://example.com',
            'SEARCH_MIN_ZOOM_LEVELS': {'sentinel-2': {'high': 7}},
            'BASEMAP': {'url': 'http://tiles.example.com'},
        }
        filepath = self.create_config_file(config)
        
        try:
            # Capture output
            old_stdout = sys.stdout
            sys.stdout = StringIO()
            
            result = lint_config(filepath)
            
            output = sys.stdout.getvalue()
            sys.stdout = old_stdout
            
            self.assertTrue(result)
            self.assertIn('LEGACY', output)
            self.assertIn('VALID', output)
            self.assertIn('migrate_config', output)  # Should suggest migration
        finally:
            os.unlink(filepath)
    
    def test_lint_mixed_format(self):
        """Test linting a mixed format config."""
        config = {
            'STAC_API_URL': 'http://example.com',
            'SCENE_TILER_PARAMS': {'sentinel-2': {}},  # Legacy
            'COLLECTIONS_CONFIG': {'sentinel-2': {}},  # New
        }
        filepath = self.create_config_file(config)
        
        try:
            # Capture output
            old_stdout = sys.stdout
            sys.stdout = StringIO()
            
            result = lint_config(filepath)
            
            output = sys.stdout.getvalue()
            sys.stdout = old_stdout
            
            self.assertIn('MIXED', output)
            self.assertIn('migrate_config', output)  # Should suggest migration
        finally:
            os.unlink(filepath)
    
    def test_lint_missing_required_stac_api_url(self):
        """Test linting config without STAC_API_URL."""
        config = {
            'BASEMAP': {'url': 'http://tiles.example.com'},
        }
        filepath = self.create_config_file(config)
        
        try:
            # Capture output
            old_stdout = sys.stdout
            sys.stdout = StringIO()
            
            result = lint_config(filepath)
            
            output = sys.stdout.getvalue()
            sys.stdout = old_stdout
            
            self.assertFalse(result)
            self.assertIn('Error', output)
        finally:
            os.unlink(filepath)
    
    def test_lint_legacy_missing_search_min_zoom(self):
        """Test linting legacy config without SEARCH_MIN_ZOOM_LEVELS."""
        config = {
            'STAC_API_URL': 'http://example.com',
            'SCENE_TILER_PARAMS': {'sentinel-2': {}},
            # Missing SEARCH_MIN_ZOOM_LEVELS
        }
        filepath = self.create_config_file(config)
        
        try:
            # Capture output
            old_stdout = sys.stdout
            sys.stdout = StringIO()
            
            result = lint_config(filepath)
            
            output = sys.stdout.getvalue()
            sys.stdout = old_stdout
            
            self.assertFalse(result)
            self.assertIn('LEGACY', output)
            self.assertIn('Error', output)
        finally:
            os.unlink(filepath)
    
    def test_lint_new_format_no_search_min_zoom_required(self):
        """Test that new format doesn't require SEARCH_MIN_ZOOM_LEVELS."""
        config = {
            'STAC_API_URL': 'http://example.com',
            'COLLECTIONS_CONFIG': {
                'sentinel-2': {'sceneMinZoom': 7}
            }
        }
        filepath = self.create_config_file(config)
        
        try:
            # Capture output
            old_stdout = sys.stdout
            sys.stdout = StringIO()
            
            result = lint_config(filepath)
            
            output = sys.stdout.getvalue()
            sys.stdout = old_stdout
            
            self.assertTrue(result)
            self.assertIn('NEW', output)
        finally:
            os.unlink(filepath)
    
    def test_lint_type_error(self):
        """Test linting config with type error."""
        config = {
            'STAC_API_URL': 'http://example.com',
            'COLLECTIONS_CONFIG': {'sentinel-2': {}},
            'API_MAX_ITEMS': 'not-a-number'  # Should be int
        }
        filepath = self.create_config_file(config)
        
        try:
            # Capture output
            old_stdout = sys.stdout
            sys.stdout = StringIO()
            
            result = lint_config(filepath)
            
            output = sys.stdout.getvalue()
            sys.stdout = old_stdout
            
            self.assertFalse(result)
            self.assertIn('Error', output)
            self.assertIn('Type error', output)
        finally:
            os.unlink(filepath)


if __name__ == '__main__':
    unittest.main()
