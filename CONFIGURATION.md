# FilmDrop UI Configuration Guide

Complete reference for configuring FilmDrop UI.

## Table of Contents

- [Overview](#overview)
- [Configuration File Location](#configuration-file-location)
- [Configuration Parameters](#configuration-parameters)
  - [Required Parameters](#required-parameters)
  - [Optional Parameters](#optional-parameters)
  - [Collection Configuration](#collection-configuration)
- [Configuration Examples](#configuration-examples)
- [Migration Guide](#migration-guide)
- [Advanced Configuration](#advanced-configuration)

## Overview

FilmDrop UI uses a "build-once, deploy-anywhere" approach with configuration variables.
The config is read on application load by fetching `/config/config.json` with a
cache-breaker to prevent stale files.

**Key Features:**

- JSON-based configuration
- Runtime loading (no rebuild needed for config changes)
- Support for both legacy and modern configuration formats
- Automatic migration for backward compatibility

## Configuration File Location

### Development

Create `./public/config/config.json` with your configuration.

### Production

After building with `npm run build`, place your config at `build/config/config.json`.

**Example files:**

- `config_helper/config.example.json` - Legacy format example with comprehensive options
- `config_helper/config-new-format-example.json` - Modern format with COLLECTIONS_CONFIG

## Configuration Parameters

### Required Parameters

| Parameter      | Type   | Description                   |
| -------------- | ------ | ----------------------------- |
| `STAC_API_URL` | String | URL for the STAC API endpoint |

> **Note:** `SEARCH_MIN_ZOOM_LEVELS` was previously required but is now **deprecated**.
> Use `sceneMinZoom` within `COLLECTIONS_CONFIG` instead.
> Legacy configurations with `{ "medium": X, "high": Y }` format will automatically use the "high" value.

### Optional Parameters

#### Application Branding

| Parameter     | Type   | Default         | Description                                                                                                         |
| ------------- | ------ | --------------- | ------------------------------------------------------------------------------------------------------------------- |
| `APP_NAME`    | String | `"FilmDrop UI"` | Application name used in HTML title and UI                                                                          |
| `APP_FAVICON` | String | -               | Custom favicon filename (`.ico` or `.png`) in `/config` directory                                                   |
| `LOGO_URL`    | String | -               | URL to custom logo image (as of 7.0, client-side routing introduced this should be absolute path, i.e. `/logo.png`) |
| `LOGO_ALT`    | String | -               | Alt text for custom logo                                                                                            |
| `PUBLIC_URL`  | String | -               | Public URL for the application (useful with CDNs)                                                                   |
| `BRAND_LOGO`  | Object | -               | Brand logo configuration with clickable hyperlink. See [Brand Logo Configuration](#brand-logo-configuration)        |

#### UI Features

| Parameter                    | Type    | Default  | Description                                             |
| ---------------------------- | ------- | -------- | ------------------------------------------------------- |
| `CART_ENABLED`               | Boolean | `false`  | Enable shopping cart features for scene selection       |
| `EXPORT_ENABLED`             | Boolean | `true`   | Enable GeoJSON export of search results                 |
| `SEARCH_BY_GEOM_ENABLED`     | Boolean | `true`   | Allow users to draw or upload GeoJSON for search bounds |
| `STAC_LINK_ENABLED`          | Boolean | `false`  | Show STAC API Item link in Links section                |
| `STAC_LINKS_SECTION_ENABLED` | Boolean | `false`  | Show comprehensive Links section (grouped by rel type)  |
| `STAC_LINKS_EXCLUDE_LIST`    | Array   | See note | Link rel types to hide from Links section (power-users) |
| `SHOW_ITEM_AUTO_ZOOM`        | Boolean | `true`   | Show toggle to auto-center map on selected item         |
| `THEME_SWITCHING_ENABLED`    | Boolean | `true`   | Enable light/dark theme switching                       |

**STAC Links Configuration:**

The Links section displays STAC item links through two independent feature flags:

- **`STAC_LINK_ENABLED`** (`false` by default): Shows the STAC API Item link (the item's canonical link to itself)
- **`STAC_LINKS_SECTION_ENABLED`** (`false` by default): Shows a comprehensive Links section with all other item links grouped by relationship type

Both flags can be enabled independently. Links are displayed under a single "Links" header when at least one flag is enabled.

#### Configuration Examples

**Show only STAC API Item link:**

```json
{
  "STAC_LINK_ENABLED": true,
  "STAC_LINKS_SECTION_ENABLED": false
}
```

**Show only comprehensive Links section:**

```json
{
  "STAC_LINK_ENABLED": false,
  "STAC_LINKS_SECTION_ENABLED": true,
  "STAC_LINKS_EXCLUDE_LIST": [
    "parent",
    "collection",
    "root",
    "items",
    "aggregate",
    "aggregations",
    "http://www.opengis.net/def/rel/ogc/1.0/queryables",
    "conformance",
    "service-desc",
    "service-doc",
    "data",
    "thumbnail"
  ]
}
```

**Show both STAC API Item and comprehensive Links section:**

```json
{
  "STAC_LINK_ENABLED": true,
  "STAC_LINKS_SECTION_ENABLED": true,
  "STAC_LINKS_EXCLUDE_LIST": [
    "parent",
    "collection",
    "root",
    "items",
    "aggregate",
    "aggregations",
    "http://www.opengis.net/def/rel/ogc/1.0/queryables",
    "conformance",
    "service-desc",
    "service-doc",
    "data",
    "thumbnail"
  ]
}
```

**Hide all links (default):**

```json
{
  "STAC_LINK_ENABLED": false,
  "STAC_LINKS_SECTION_ENABLED": false
}
```

#### STAC_LINKS_EXCLUDE_LIST Configuration

By default, the comprehensive Links section excludes navigation and API plumbing links:

**Default excluded rels:**

- **Navigation hierarchy:** `parent`, `collection`, `root` — organizational links not useful in per-item context
- **API endpoints:** `items`, `aggregate`, `aggregations` — programmatic API navigation
- **Technical links:** OGC queryables, conformance, service descriptors — low-level API plumbing

**To show all links** (including navigation/API links for power-users), set to an empty array:

```json
{ "STAC_LINKS_EXCLUDE_LIST": [] }
```

**Links shown by default:** `canonical` (original JSON), `license` (license information), `derived_from` (source data), `about` (item information), `alternate` (alternate formats), and custom links.

#### Navigation Buttons

| Parameter           | Type   | Description                                                    |
| ------------------- | ------ | -------------------------------------------------------------- |
| `DASHBOARD_BTN_URL` | String | URL for Dashboard button (top right). Button hidden if not set |
| `ANALYZE_BTN_URL`   | String | URL for Analyze button (bottom left). Button hidden if not set |
| `ACTION_BUTTON`     | Object | Call-to-action button with `text` and `url` properties         |

#### API Configuration

| Parameter               | Type    | Default         | Description                                                                                                                                 |
| ----------------------- | ------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `API_MAX_ITEMS`         | Number  | `200`           | Maximum items requested from STAC API                                                                                                       |
| `FETCH_CREDENTIALS`     | String  | `"same-origin"` | Fetch credentials mode: `"same-origin"`, `"include"`, or `"omit"`                                                                           |
| `STAC_HEADER_COOKIES`   | String  | undefined       | Include cookie value(s) in STAC API request headers. `cookie_name` and `header_name` are required properties, `header_val_prefix` optional. |
| `SUPPORTS_AGGREGATIONS` | Boolean | `true`          | Enable aggregation features (requires STAC API Aggregation Extension)                                                                       |

#### Authentication

| Parameter                | Type    | Description                           |
| ------------------------ | ------- | ------------------------------------- |
| `APP_TOKEN_AUTH_ENABLED` | Boolean | Enable JWT token authentication       |
| `AUTH_URL`               | String  | Authentication endpoint returning JWT |

> **Security Note:** Client-side authentication provides limited security. Ensure STAC API also validates tokens.

#### Map Configuration

| Parameter         | Type   | Default       | Description                                                                                                                     |
| ----------------- | ------ | ------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `BASEMAP`         | Object | OpenStreetMap | Basemap provider configuration. See [Basemap Configuration](#basemap-configuration). Defaults to OpenStreetMap if not provided. |
| `MAP_CENTER`      | Array  | `[30, 0]`     | Initial map center `[lat, lon]`                                                                                                 |
| `MAP_ZOOM`        | Number | `3`           | Initial map zoom level                                                                                                          |
| `MAP_ZOOM_MAX`    | Number | `18`          | Maximum map zoom level                                                                                                          |
| `CONFIG_COLORMAP` | String | `"viridis"`   | Colormap for hex grid results. See [bpostlethwaite/colormap](https://github.com/bpostlethwaite/colormap)                        |

#### Tiling Configuration

| Parameter          | Type   | Description                                                                                           |
| ------------------ | ------ | ----------------------------------------------------------------------------------------------------- |
| `SCENE_TILER_URL`  | String | TiTiler endpoint for scene tiling                                                                     |
| `MOSAIC_TILER_URL` | String | TiTiler mosaic endpoint (requires [NASA IMPACT TiTiler fork](https://github.com/NASA-IMPACT/titiler)) |
| `MOSAIC_MAX_ITEMS` | Number | Maximum items in mosaic (default: `100`)                                                              |

#### Layer Configuration

| Parameter             | Type   | Description                                                                       |
| --------------------- | ------ | --------------------------------------------------------------------------------- |
| `LAYER_LIST_SERVICES` | Array  | WMS service definitions for reference layers. Auto-enables layer list widget.     |
|                       |        | See [Layer List](#layer-list-configuration)                                       |
| `COLLECTIONS`         | Object | Auto-configure collections from STAC API with include/exclude filters and default |
|                       |        | selection. See [Collections Auto-Configuration](#collections-auto-configuration). |
|                       |        | If omitted, all collections will be used.                                         |

### Collections Auto-Configuration

The `COLLECTIONS` parameter allows you to automatically fetch and filter the list of collections from
your STAC API, rather than hardcoding collection IDs. It also lets you specify which collection should
be selected by default.

#### Configuration Format

```json
{
  "STAC_API_URL": "https://your-stac-api.com",
  "COLLECTIONS": {
    "default": "sentinel-2-l2a",
    "include": ["collection-1", "collection-2"],
    "exclude": ["deprecated-collection"]
  }
}
```

#### Properties

- `default` (String, optional): Collection ID to select by default. If not provided, the first collection will be selected.
- `include` (Array, optional): Whitelist of collection IDs to use. Only these collections will be available.
- `exclude` (Array, optional): Blacklist of collection IDs to exclude from the available collections.

#### Behavior

- If `COLLECTIONS` is **not provided**: All collections from the STAC API will be available
- If `COLLECTIONS.include` is provided: **Only** these collections will be used (whitelist)
- If `COLLECTIONS.exclude` is provided: These collections will be removed from the list (blacklist)
- Both `include` and `exclude` can be used together (include is applied first, then exclude)

#### Examples

**Use only specific collections:**

```json
{
  "COLLECTIONS": {
    "include": ["sentinel-2-l2a", "landsat-8-c2-l2"]
  }
}
```

**Use all collections except specific ones:**

```json
{
  "COLLECTIONS": {
    "exclude": ["test-collection", "deprecated-collection"]
  }
}
```

**Use all collections (default behavior):**

```json
{
  "COLLECTIONS": {}
}
```

or simply omit the `COLLECTIONS` parameter entirely.

#### Integration with COLLECTIONS_CONFIG

The `COLLECTIONS_CONFIG` parameter can still be used to configure collection-specific settings. If a
collection is configured in `COLLECTIONS_CONFIG` but is not in the filtered list (not included or is
excluded), that configuration will be ignored with a debug message in the console.

```json
{
  "COLLECTIONS": {
    "include": ["sentinel-2-l2a", "landsat-8-c2-l2"]
  },
  "COLLECTIONS_CONFIG": {
    "sentinel-2-l2a": {
      "sceneMinZoom": 8,
      "sceneTilerParams": { "assets": "visual" }
    },
    "deprecated-collection": {
      "sceneMinZoom": 6
    }
  }
}
```

In this example, the configuration for `deprecated-collection` will be ignored since it's not in the include list.

### Rendering Auto-Configuration

When both `STAC_API_URL` and `SCENE_TILER_URL` are configured, FilmDrop UI can automatically configure
rendering parameters for collections that use the [STAC Render Extension](https://github.com/stac-extensions/render).
This eliminates the need to manually specify visualization parameters for each collection.

#### How It Works

FilmDrop UI reads the `renders` object from each STAC Collection and automatically maps it to TiTiler
parameters. The render extension allows data providers to define how their data should be visualized.

**Requirements:**

- `STAC_API_URL` must be configured
- `SCENE_TILER_URL` must be configured
- STAC Collections must include the `renders` extension

#### Supported Render Extension Fields

The following fields from the render extension are automatically mapped to `sceneTilerParams`:

| Render Field    | TiTiler Parameter | Description                                                           |
| --------------- | ----------------- | --------------------------------------------------------------------- |
| `assets`        | `assets`          | Array of asset keys to render (required)                              |
| `rescale`       | `rescale`         | Value ranges for stretching (e.g., `[[0,10000],[0,10000],[0,10000]]`) |
| `colormap_name` | `colormap_name`   | Predefined colormap (e.g., `"viridis"`, `"ylgn"`)                     |
| `colormap`      | `colormap`        | Custom colormap object                                                |
| `color_formula` | `color_formula`   | Color adjustment formula (e.g., `"Gamma RGB 3.5"`)                    |
| `nodata`        | `nodata`          | No-data value to mask                                                 |
| `expression`    | `expression`      | Band math expression (e.g., `"(nir-red)/(nir+red)"`)                  |
| `resampling`    | `resampling`      | Resampling method (e.g., `"nearest"`, `"bilinear"`)                   |

#### Example STAC Collection with Render Extension

```json
{
  "id": "sentinel-2-l2a",
  "stac_extensions": [
    "https://stac-extensions.github.io/render/v2.0.0/schema.json"
  ],
  "renders": {
    "true-color": {
      "title": "True Color",
      "assets": ["red", "green", "blue"],
      "rescale": [
        [0, 10000],
        [0, 10000],
        [0, 10000]
      ],
      "color_formula": "Gamma RGB 3.5"
    },
    "ndvi": {
      "title": "NDVI",
      "assets": ["nir", "red"],
      "expression": "(nir-red)/(nir+red)",
      "rescale": [[-1, 1]],
      "colormap_name": "rdylgn"
    }
  }
}
```

FilmDrop UI will automatically:

- Store **all render definitions** in the `renders` field of `COLLECTIONS_CONFIG`
- Use the **first render definition** (`true-color` in this example) to populate `sceneTilerParams` for backwards compatibility

This means you have access to all available render options while maintaining compatibility with existing code that uses `sceneTilerParams`.

#### Overriding Auto-Configuration

Auto-configuration is **skipped** for collections where you have manually configured
`sceneTilerParams` in `COLLECTIONS_CONFIG`. This allows you to override the automatic
configuration when needed.

```json
{
  "COLLECTIONS_CONFIG": {
    "sentinel-2-l2a": {
      "sceneTilerParams": {
        "assets": ["B08", "B04", "B03"],
        "rescale": ["0,3000", "0,3000", "0,3000"]
      }
    }
  }
}
```

#### Example Auto-Configured Scenarios

**Scenario 1: True color visualization**

```json
// STAC Collection renders:
{
  "true-color": {
    "assets": ["red", "green", "blue"],
    "rescale": [
      [0, 10000],
      [0, 10000],
      [0, 10000]
    ]
  }
}
// Result:
// sceneTilerParams.assets = ["red", "green", "blue"]
// sceneTilerParams.rescale = ["0,10000,0,10000,0,10000"]
```

**Scenario 2: NDVI with colormap**

```json
// STAC Collection renders:
{
  "ndvi": {
    "assets": ["nir", "red"],
    "expression": "(nir-red)/(nir+red)",
    "rescale": [[-1, 1]],
    "colormap_name": "rdylgn",
    "resampling": "nearest"
  }
}
// Result:
// sceneTilerParams.assets = ["nir", "red"]
// sceneTilerParams.expression = "(nir-red)/(nir+red)"
// sceneTilerParams.rescale = ["-1,1"]
// sceneTilerParams.colormap_name = "rdylgn"
// sceneTilerParams.resampling = "nearest"
```

**Scenario 3: Custom colormap for elevation**

```json
// STAC Collection renders:
{
  "elevation": {
    "assets": ["data"],
    "colormap": {
      "0": "#d7191c",
      "1000": "#fdae61",
      "2000": "#ffffbf",
      "3000": "#a6d96a",
      "4000": "#1a9641"
    },
    "nodata": -9999
  }
}
// Result:
// sceneTilerParams.assets = ["data"]
// sceneTilerParams.colormap = { "0": "#d7191c", ... }
// sceneTilerParams.nodata = -9999
```

### Collection Configuration

#### Modern Format (Recommended): COLLECTIONS_CONFIG

The `COLLECTIONS_CONFIG` parameter consolidates all collection-specific settings into a
single structure. This is the **recommended approach** as it reduces repetition and
improves maintainability.

```json
{
  "COLLECTIONS_CONFIG": {
    "collection-id": {
      "visualizations": {},
      "sceneTilerParams": {},
      "mosaicTilerParams": {},
      "sceneMinZoom": 7,
      "popupDisplayFields": [],
      "tileLayerParams": {},
      "enhancedDisplayConfig": {}
    }
  }
}
```

**Properties:**

| Property                | Type   | Description                                                                                                                   |
| ----------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `visualizations`        | Object | Dictionary of visualization definitions, keyed by name. Auto-populated from STAC Render Extension when available.             |
|                         |        | **Note:** This is the recommended way to define visualizations. The first visualization is used as the default for rendering. |
| `mosaicTilerParams`     | Object | TiTiler mosaic parameters (same structure as sceneTilerParams)                                                                |
| `sceneMinZoom`          | Number | Minimum zoom level required for Scene and Mosaic views (default: 7)                                                           |
| `popupDisplayFields`    | Array  | STAC property names to display in popup (e.g., `["datetime", "platform"]`)                                                    |
| `tileLayerParams`       | Object | Leaflet tile layer options (e.g., `minZoom`, `maxZoom`, `opacity`)                                                            |
| `enhancedDisplayConfig` | Object | Enhanced details configuration with `property_groups` and `asset_groups`                                                      |

**Example:**

```json
{
  "COLLECTIONS_CONFIG": {
    "sentinel-2-l2a": {
      "visualizations": {
        "true-color": {
          "title": "True Color",
          "assets": ["red", "green", "blue"],
          "rescale": ["0,10000,0,10000,0,10000"],
          "color_formula": "Gamma RGB 3.5"
        },
        "false-color": {
          "title": "False Color (NIR, Red, Green)",
          "assets": ["nir", "red", "green"],
          "rescale": ["0,10000,0,10000,0,10000"]
        },
        "ndvi": {
          "title": "NDVI",
          "assets": ["nir", "red"],
          "expression": "(nir-red)/(nir+red)",
          "colormap_name": "rdylgn",
          "rescale": ["-1,1"]
        }
      },
      "mosaicTilerParams": {
        "assets": ["visual"]
      },
      "sceneMinZoom": 7,
      "popupDisplayFields": ["datetime", "platform", "eo:cloud_cover"],
      "tileLayerParams": {
        "minZoom": 2,
        "maxZoom": 26
      }
    }
  }
}
```

**Note:** The `visualizations` field is automatically populated when auto-configuration is enabled. All render definitions from
the STAC Collection are stored here. The first visualization is used as the default for rendering.

#### Legacy Format (Deprecated)

The following parameters are **deprecated** but still supported for backward compatibility:

- `SCENE_TILER_PARAMS` - Converted to `visualizations` dictionary with key `"default"`
- `MOSAIC_TILER_PARAMS`
- `SEARCH_MIN_ZOOM_LEVELS` - Legacy format `{ "medium": number, "high": number }` converted to `sceneMinZoom` (uses the "high" value)
- `POPUP_DISPLAY_FIELDS`
- `TILE_LAYER_PARAMS`
- `ENHANCED_DISPLAY_CONFIG`

**Migration:** Use `COLLECTIONS_CONFIG` instead. See [Migration Guide](#migration-guide).

## Configuration Examples

### Basemap Configuration

**Default:** If not provided, defaults to OpenStreetMap:

```json
{
  "url": "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  "attribution": "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a>"
}
```

**Single Basemap:**

```json
{
  "BASEMAP": {
    "url": "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    "attribution": "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a>"
  }
}
```

**Theme-Aware Basemap** (requires `THEME_SWITCHING_ENABLED: true`):

```json
{
  "BASEMAP": {
    "light": {
      "url": "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      "attribution": "&copy; OpenStreetMap"
    },
    "dark": {
      "url": "https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png",
      "attribution": "&copy; OpenStreetMap &copy; CartoDB"
    }
  }
}
```

### Brand Logo Configuration

**Disabled:**

```json
{
  "BRAND_LOGO": null
}
```

**Single Logo:**

```json
{
  "BRAND_LOGO": {
    "url": "https://your-company.com",
    "title": "Visit Your Company",
    "alt": "Your Company Logo",
    "image": "/your-logo.png"
  }
}
```

**Theme-Aware Logo** (requires `THEME_SWITCHING_ENABLED: true`):

```json
{
  "BRAND_LOGO": {
    "url": "https://your-company.com",
    "title": "Visit Your Company",
    "alt": "Your Company Logo",
    "image": null,
    "image_light": "/your-logo-light.png",
    "image_dark": "/your-logo-dark.png"
  }
}
```

> Note: As of 7.0 with client-side routing introduced, the path to `image`, `image_light`, and `image_dark` should be absolute
> (✅ `/brand_logo.png`) and not relative (🚫 ~~`./brand_logo.png`~~ or 🚫 ~~`brand_logo.png`~~).

### Layer List Configuration

The reference layer list widget is automatically enabled when `LAYER_LIST_SERVICES` is populated.

```json
{
  "LAYER_LIST_SERVICES": [
    {
      "name": "USGS Topography",
      "type": "wms",
      "url": "https://basemap.nationalmap.gov/arcgis/services/USGSTopo/MapServer/WMSServer",
      "layers": [
        {
          "name": "0",
          "alias": "USGS Topo",
          "default_visibility": false,
          "crs": "EPSG:3857"
        }
      ]
    }
  ]
}
```

**Supported CRS:** `EPSG:4326`, `EPSG:3857`

### Enhanced Display Configuration

```json
{
  "COLLECTIONS_CONFIG": {
    "sentinel-2-l2a": {
      "enhancedDisplayConfig": {
        "property_groups": [
          {
            "name": "Core Fields",
            "fields": [
              { "name": "datetime", "label": "Acquisition Time" },
              { "name": "platform" },
              { "name": "constellation" }
            ]
          },
          {
            "name": "Data Quality",
            "fields": [{ "name": "eo:cloud_cover" }]
          }
        ],
        "asset_groups": [
          {
            "name": "10m Bands",
            "fields": [
              { "name": "red" },
              { "name": "green" },
              { "name": "blue" },
              { "name": "nir" }
            ]
          }
        ]
      }
    }
  }
}
```

### TiTiler Parameters

TiTiler automatically reads metadata from COG files and STAC items, including nodata values, CRS,
scale/offset, and band information. The parameters below allow you to override these automatic values
when needed. For complete parameter documentation, see [TiTiler Docs](https://devseed.com/titiler/).

**Basic RGB:**

```json
{
  "sceneTilerParams": {
    "assets": ["red", "green", "blue"]
  }
}
```

**With Color Formula:**

```json
{
  "sceneTilerParams": {
    "assets": ["red", "green", "blue"],
    "color_formula": "Gamma+RGB+3.2+Saturation+0.8+Sigmoidal+RGB+12+0.35"
  }
}
```

**Single Band with Colormap:**

```json
{
  "sceneTilerParams": {
    "assets": ["data"],
    "colormap_name": "terrain",
    "rescale": ["-1000,4000"]
  }
}
```

**Custom Colormap:**

```json
{
  "sceneTilerParams": {
    "assets": ["supercell"],
    "colormap": {
      "0": "#000000",
      "1": "#419bdf",
      "2": "#397d49",
      "10": "#616161"
    }
  }
}
```

**Expression:**

```json
{
  "sceneTilerParams": {
    "assets": ["red", "nir"],
    "expression": "(nir-red)/(nir+red)"
  }
}
```

## Migration Guide

### Overview

The FilmDrop UI configuration has been refactored to consolidate collection-specific
parameters into a single `COLLECTIONS_CONFIG` object. This reduces repetition and makes
configuration files easier to maintain.

### What Changed

#### Before (Legacy Format)

Collection-specific settings were scattered across multiple top-level configuration
parameters:

- `SCENE_TILER_PARAMS`
- `MOSAIC_TILER_PARAMS`
- `SEARCH_MIN_ZOOM_LEVELS`
- `POPUP_DISPLAY_FIELDS`
- `TILE_LAYER_PARAMS`
- `ENHANCED_DISPLAY_CONFIG`

Each parameter required repeating the collection IDs, leading to verbose and error-prone
configurations.

#### After (New Format)

All collection-specific settings are now grouped under `COLLECTIONS_CONFIG`, with each
collection ID appearing only once:

```json
{
  "COLLECTIONS_CONFIG": {
    "collection-id": {
      "sceneTilerParams": {},
      "mosaicTilerParams": {},
      "sceneMinZoom": 7,
      "popupDisplayFields": [],
      "tileLayerParams": {},
      "enhancedDisplayConfig": {}
    }
  }
}
```

### Backward Compatibility

**Your existing configuration files will continue to work!** The application automatically
converts legacy format to the new format on load. However, we recommend migrating to the
new format for better maintainability.

If both formats are present in a config file, `COLLECTIONS_CONFIG` takes precedence, and a warning will be logged to the console.

### Migration Example

**Legacy Configuration (Still Supported)**

```json
{
  "SCENE_TILER_PARAMS": {
    "sentinel-2-l2a": {
      "assets": ["red", "green", "blue"],
      "color_formula": "Gamma+RGB+3.2"
    },
    "landsat-c2-l2": {
      "assets": ["red", "green", "blue"],
      "color_formula": "Gamma+RGB+1.7"
    }
  },
  "MOSAIC_TILER_PARAMS": {
    "sentinel-2-l2a": {
      "assets": ["visual"]
    },
    "landsat-c2-l2": {
      "assets": ["red"]
    }
  },
  "SEARCH_MIN_ZOOM_LEVELS": {
    "sentinel-2-l2a": {
      "medium": 4,
      "high": 7
    },
    "landsat-c2-l2": {
      "medium": 4,
      "high": 7
    }
  },
  "POPUP_DISPLAY_FIELDS": {
    "sentinel-2-l2a": ["datetime", "platform", "eo:cloud_cover"],
    "landsat-c2-l2": ["datetime", "platform", "instruments"]
  }
}
```

**New Configuration (Recommended)**

```json
{
  "COLLECTIONS_CONFIG": {
    "sentinel-2-l2a": {
      "sceneTilerParams": {
        "assets": ["red", "green", "blue"],
        "color_formula": "Gamma+RGB+3.2"
      },
      "mosaicTilerParams": {
        "assets": ["visual"]
      },
      "sceneMinZoom": 7,
      "popupDisplayFields": ["datetime", "platform", "eo:cloud_cover"]
    },
    "landsat-c2-l2": {
      "sceneTilerParams": {
        "assets": ["red", "green", "blue"],
        "color_formula": "Gamma+RGB+1.7"
      },
      "mosaicTilerParams": {
        "assets": ["red"]
      },
      "sceneMinZoom": 7,
      "popupDisplayFields": ["datetime", "platform", "instruments"]
    }
  }
}
```

## Advanced Configuration

### Theme Configuration

FilmDrop UI supports two theming modes requiring different CSS structures in `src/themes/theme.css`.

**Theme Switching Mode** (`THEME_SWITCHING_ENABLED: true`):

- `:root[data-theme='filmdrop-dark']` - Dark theme variables
- `:root[data-theme='filmdrop-light']` - Light theme variables

**Single Theme Mode** (`THEME_SWITCHING_ENABLED: false`):

- `:root[data-theme='filmdrop']` - Single theme variables

### Scene Minimum Zoom Level

The `sceneMinZoom` configuration specifies the minimum zoom level required to view individual scenes and mosaic tiles:

- **Below `sceneMinZoom`:** Aggregation views only (Hex or Grid, if available)
- **At or above `sceneMinZoom`:** Scene and Mosaic views become available

The application automatically switches between Hex aggregation (if available) and Scene view based on the zoom level.
Users can manually select any view mode at any time (Grid is always available if supported by the collection).

**Example:**

```json
{
  "sceneMinZoom": 7
}
```

Default value is `7` if not specified.

### Favicon Configuration

1. Place `.ico` or `.png` file in `public/config/` (dev) or `build/config/` (production)
2. Reference in config:

```json
{
  "APP_FAVICON": "custom-favicon.ico"
}
```

Filename must match exactly. Falls back to default FilmDrop favicon if file missing.

### Action Button

Create a prominent call-to-action button:

```json
{
  "ACTION_BUTTON": {
    "text": "Order Imagery",
    "url": "https://order.example.com"
  }
}
```

### Minimal Configuration

Minimum required configuration:

```json
{
  "STAC_API_URL": "https://api.example.com",
  "BASEMAP": {
    "url": "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    "attribution": "&copy; OpenStreetMap"
  },
  "COLLECTIONS_CONFIG": {
    "your-collection": {
      "sceneMinZoom": 7
    }
  }
}
```

### Complete Example

See `config_helper/config-new-format-example.json` for a comprehensive example with all options.

## Troubleshooting

### Config not loading

- Check browser console for fetch errors
- Verify `config.json` path is `/config/config.json` relative to app root
- Ensure JSON is valid (use a JSON validator)

### Collections not appearing

- Verify `STAC_API_URL` is correct and accessible
- Check `COLLECTIONS` filter if set
- Ensure collection IDs match STAC API

### Tiling not working

- Verify `SCENE_TILER_URL` and `MOSAIC_TILER_URL` are accessible
- Check collection has `sceneTilerParams` configured
- Ensure assets specified exist in STAC items

### Theme issues

- Verify CSS theme selectors match configuration
- Check `THEME_SWITCHING_ENABLED` matches CSS structure
- See [CSS Theme Configuration](#theme-configuration)

## Additional Resources

- [Main README](README.md) - Quick start and overview
- [Changelog](CHANGELOG.md) - Version history and changes
- [Example Configs](config_helper/) - Reference configurations
