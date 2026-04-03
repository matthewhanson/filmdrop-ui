"""
Usage: python3 lint_config.py path/to/config.json

Purpose: Lints a config.json configuration file used by a deployment of the Filmdrop UI application (https://github.com/Element84/filmdrop-ui).
Checks for missing required keys, extra keys, type errors, and optional keys not included.

Supported UI versions: 5.0.0+
Supports both legacy and modern config formats.
"""

import sys
import json
import os


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


def lint_config(file_path):
    # Read the config file
    try:
        with open(file_path, 'r') as file:
            config = json.load(file)
    except FileNotFoundError:
        print(f"File not found: {file_path}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")
        sys.exit(1)

    # Detect config format
    config_format = detect_config_format(config)
    
    # Define the expected keys for new format
    expected_keys_new = {
        "STAC_API_URL": str,
        "PUBLIC_URL": str,
        "LOGO_URL": str,
        "LOGO_ALT": str,
        "DASHBOARD_BTN_URL": str,
        "ANALYZE_BTN_URL": str,
        "API_MAX_ITEMS": int,
        "COLLECTIONS": dict,
        "COLLECTIONS_CONFIG": dict,
        "SCENE_TILER_URL": str,
        "ACTION_BUTTON": dict,
        "MOSAIC_TILER_URL": str,
        "MOSAIC_MAX_ITEMS": int,
        "CONFIG_COLORMAP": str,
        "BASEMAP": dict,
        "THEME_SWITCHING_ENABLED": bool,
        "SEARCH_BY_GEOM_ENABLED": bool,
        "CART_ENABLED": bool,
        "BRAND_LOGO": dict,
        "APP_NAME": str,
        "APP_FAVICON": str,
        "MAP_ZOOM": int,
        "MAP_CENTER": list,
        "LAYER_LIST_SERVICES": list,
        "STAC_LINK_ENABLED": bool,
        "STAC_LINKS_SECTION_ENABLED": bool,
        "STAC_LINKS_EXCLUDE_LIST": list,
        "SHOW_ITEM_AUTO_ZOOM": bool,
        "FETCH_CREDENTIALS": str,
        "APP_TOKEN_AUTH_ENABLED": bool,
        "AUTH_URL": str,
        "SUPPORTS_AGGREGATIONS": bool,
        "EXPORT_ENABLED": bool,
        "STAC_HEADER_COOKIES": list,
        "THEME_SWITCHING_ENABLED": bool,
        "THEME_DEFAULT": str,
    }
    
    # Define expected keys for legacy format (includes old parameter names)
    expected_keys_legacy = {
        "STAC_API_URL": str,
        "PUBLIC_URL": str,
        "LOGO_URL": str,
        "LOGO_ALT": str,
        "DASHBOARD_BTN_URL": str,
        "ANALYZE_BTN_URL": str,
        "API_MAX_ITEMS": int,
        "COLLECTIONS": dict,
        "SCENE_TILER_URL": str,
        "SCENE_TILER_PARAMS": dict,
        "ACTION_BUTTON": dict,
        "MOSAIC_TILER_URL": str,
        "MOSAIC_TILER_PARAMS": dict,
        "MOSAIC_MAX_ITEMS": int,
        "SEARCH_MIN_ZOOM_LEVELS": dict,
        "CONFIG_COLORMAP": str,
        "BASEMAP": dict,
        "THEME_SWITCHING_ENABLED": bool,
        "CART_ENABLED": bool,
        "BRAND_LOGO": dict,
        "APP_NAME": str,
        "APP_FAVICON": str,
        "MAP_ZOOM": int,
        "MAP_CENTER": list,
        "LAYER_LIST_SERVICES": list,
        "STAC_LINK_ENABLED": bool,
        "SHOW_ITEM_AUTO_ZOOM": bool,
        "FETCH_CREDENTIALS": str,
        "APP_TOKEN_AUTH_ENABLED": bool,
        "AUTH_URL": str,
        "SUPPORTS_AGGREGATIONS": bool,
        "EXPORT_ENABLED": bool,
        "STAC_HEADER_COOKIES": list,
        "DEFAULT_COLLECTION": str,
        "TILE_LAYER_PARAMS": dict,
        "ENHANCED_DISPLAY_CONFIG": dict,
    }

    print("*********************************************************************")
    print("**** Running Filmdrop UI Config Lint ********************")
    print("*********************************************************************")
    
    # Print format information
    format_display = config_format.upper()
    print(f"\nConfig format: {format_display}")
    
    if config_format == 'legacy':
        print("Backward compatibility: ✓ Your config will work without changes")
        print("\nSuggestion: Consider migrating to the new format for better maintainability.")
        print("Run: python3 migrate_config.py --input {} --dry-run".format(os.path.basename(file_path)))
    elif config_format == 'mixed':
        print("Backward compatibility: ✓ Config will work (COLLECTIONS_CONFIG takes precedence)")
        print("\nWarning: Mixed format detected. Some legacy keys may be ignored.")
        print("Run: python3 migrate_config.py --input {}".format(os.path.basename(file_path)))
    elif config_format == 'new':
        print("Backward compatibility: ✓ Modern format in use")
    
    print()
    
    # Choose which expected keys to use based on format
    if config_format == 'legacy' or config_format == 'mixed':
        expected_keys = expected_keys_legacy
    else:
        expected_keys = expected_keys_new

    # Check for missing required keys (STAC_API_URL is always required)
    required_keys = ["STAC_API_URL"]
    
    # Only require SEARCH_MIN_ZOOM_LEVELS for legacy format
    if config_format == 'legacy':
        required_keys.append("SEARCH_MIN_ZOOM_LEVELS")
    
    missing_required_keys = [key for key in required_keys if key not in config]
    validation_passed = True
    
    if missing_required_keys:
        print("[Error] Required key(s) missing:")
        for key in missing_required_keys:
            print(f" - {key}")
        print("************************************")
        validation_passed = False
    else:
        print("[Success] Required config - PASSED")

    # Check for extra keys that can't be used
    extra_keys = [key for key in config.keys() if key not in expected_keys]
    if extra_keys:
        print("[Warning] Extra key(s) found that can't be used:")
        for key in extra_keys:
            print(f" - {key}")
        print("************************************")

    # Check for optional keys not included (informational only)
    optional_keys = [key for key in expected_keys.keys() if key not in config]
    # Don't print optional keys unless explicitly requested - too verbose

    # Check for type errors
    has_type_errors = False
    for key, expected_type in expected_keys.items():
        if key in config and not isinstance(config[key], expected_type):
            print(f"[Error] Type error for key '{key}': expected {expected_type.__name__}, got {type(config[key]).__name__}")
            print("************************************")
            has_type_errors = True
            validation_passed = False

    # Perform additional validations
    if "BASEMAP" in config:
        if isinstance(config["BASEMAP"], dict):
            if "url" not in config["BASEMAP"]:
                print("[Warning] BASEMAP.url is recommended")
    
    # Check COLLECTIONS structure
    if config_format == 'new' and "COLLECTIONS" in config:
        if isinstance(config["COLLECTIONS"], dict):
            if "default" not in config["COLLECTIONS"] and "include" not in config["COLLECTIONS"]:
                print("[Warning] COLLECTIONS should have 'default' or 'include' keys")

    # Final validation result
    print()
    if validation_passed:
        print("[Success] Validation config - PASSED")
    else:
        print("[Error] Validation config - FAILED")
    
    print()
    if validation_passed and not has_type_errors:
        print("Config is VALID")
    else:
        print("Config has ERRORS - see above")
    
    print()
    
    return validation_passed

if __name__ == "__main__":
    # Get the file path from command line arguments
    if len(sys.argv) != 2:
        print("Usage: ./lint_config.py path/to/config.json")
        sys.exit(1)

    file_path = sys.argv[1]

    # Check if the file is a JSON file
    if not file_path.endswith(".json"):
        print("Invalid file format. Expected a JSON file.")
        sys.exit(1)

    # Check if the file exists
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        sys.exit(1)

    # Lint the config file
    is_valid = lint_config(file_path)
    
    # Exit with appropriate code
    sys.exit(0 if is_valid else 1)
