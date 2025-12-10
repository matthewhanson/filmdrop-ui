# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## Unreleased

### Added

- Added direct URL routing to STAC items using TanStack Router, enabling users to share
  links like `/item/sentinel-2-l2a/S2A_17SNB_20230617_0_L2A` that display items
  immediately with full map visualization, browser navigation support, and authentication
- Added STAC API client library (`src/services/stac-api/`) for programmatic interaction with STAC APIs:
  - Core client functions: `getRootCatalog()`, `getCollections()`, `getCollection()`
  - Conformance checking: `supportsConformance()`, `getConformance()`, `checkConformance()`
  - Comprehensive conformance class constants for STAC API Core, Extensions, and Community extensions
  - Support for custom headers and credentials for authenticated APIs
  - Fully tested (38 tests) and ready for extraction as standalone npm package
  - Complete documentation in `src/services/stac-api/README.md`
- Added collections auto-configuration from STAC API:
  - Collections are now automatically fetched from the STAC API instead of being hardcoded
  - New `COLLECTIONS` config parameter with `default`, `include` and `exclude` options:
    - `default`: Specify which collection should be selected by default (e.g., `"sentinel-2-l2a"`)
    - `include`: Whitelist specific collections (e.g., `["sentinel-2-l2a", "landsat-8-c2-l2"]`)
    - `exclude`: Blacklist specific collections (e.g., `["deprecated-collection"]`)
    - If omitted, all collections from the API are available
  - `COLLECTIONS_CONFIG` automatically filtered to only include active collections
  - Added `autoConfigureCollections()` function in `src/utils/configHelper.js`
  - Full collection objects stored in `_STAC_COLLECTIONS` for future use
- Added rendering auto-configuration based on STAC Render Extension:
  - Automatically configures visualization parameters for collections using the [STAC Render Extension](https://github.com/stac-extensions/render)
  - Eliminates need to manually specify TiTiler visualization parameters for collections
  - Only activates when both `STAC_API_URL` and `SCENE_TILER_URL` are configured
  - Reads `renders` object from STAC Collections and stores all render definitions in `COLLECTIONS_CONFIG`:
    - All render definitions stored in `visualizations` field (e.g., `"true-color"`, `"false-color"`, `"ndvi"`)
    - First visualization is used as the default for rendering
    - Each visualization includes: `title`, `assets`, `rescale`, `colormap_name`, `colormap`, `color_formula`, `nodata`, `expression`, `resampling`
    - Rescale values flattened to comma-separated format for TiTiler
  - Preserves all available visualization options for future UI enhancements (e.g., visualization selector)
  - Respects user overrides - skips auto-configuration for collections manually configured
  - Added `autoConfigureRendering()` function in `src/utils/configHelper.js`
  - Comprehensive test coverage (10 new tests)
  - Full documentation in `CONFIGURATION.md`
- Added enhanced details component library (`src/components/EnhancedDetails/`) for React-based STAC item field and asset rendering:
  - Core field rendering components: `FieldRenderer`, `FieldValue`, `FieldsGroup`, `FieldGroup`, `Field` for type-safe field display
  - Specialized field type components: `GridCoordinateField`, `CoordinateField`, `ShapeField`, `BooleanField`, `PercentageField`, `TransformField`, `ProcessingField` for domain-specific rendering
  - Item header component: `EnhancedDetailsHeader` for displaying STAC item ID and collection information
  - Asset display components: `AssetsContainer`, `AssetCard`, `AssetGroup`, `DefaultAssetDisplay` with file type grouping and thumbnail exclusion
  - Styling: `EnhancedDetails.css` with comprehensive styles for all enhanced details components
  - Replaces unsafe HTML string rendering with component-based approach for improved security and maintainability
- Added field type detection and discovery system (`src/utils/fieldDiscovery.js` enhanced):
  - Automatic field type detection with caching for performance optimization
  - Support for grid systems: MGRS (Military Grid Reference System), WRS (Worldwide Reference System), UTM (Universal Transverse Mercator), and generic grid codes
  - Pattern matching for field names and values to identify coordinates, shapes, transforms, processing metadata, booleans, and percentages
  - Grid type classification with intelligent component selection
- Added field value extraction and formatting (`src/utils/fieldFormatting.js` enhanced):
  - Component extraction for structured rendering of complex field types
  - Grid system parsing with coordinate and component detection
  - Bbox and coordinate extraction from arrays and objects
  - Image dimension extraction from nested field structures
  - HTML generation with sanitization for safe rendering of formatted values
- Added security infrastructure (`src/utils/sanitizer.js`) for XSS prevention:
  - DOMPurify integration with configurable strictness levels
  - Safe field value rendering supporting strings, arrays, objects, booleans, and numbers
  - Array and object-specific sanitization functions
  - Strict mode (no HTML allowed) and regular mode (safe HTML tags only)
- Added clipboard management hook (`src/hooks/useAssetClipboard.js`):
  - React hook for managing copy-to-clipboard functionality for asset URLs
  - Tracks which asset was most recently copied
  - Handles clipboard write operations with error handling
- Added comprehensive test coverage (14 new/enhanced test files):
  - Security tests for sanitization and XSS prevention
  - Field discovery tests for grid systems and field type detection
  - Field formatting tests for component extraction and value parsing
  - Field grouping tests for display configuration
  - Asset grouping tests for file type classification and thumbnail detection
- Asset cards now display file size when available in STAC data (`file:size` or `size` field)
- Added STAC item links section with independent feature flags (`src/components/EnhancedDetails/LinkDisplay.jsx` and related components):
  - Two independent feature flags control link display:
    - `STAC_LINK_ENABLED`: Shows STAC API Item link (the item's canonical self-reference)
    - `STAC_LINKS_SECTION_ENABLED`: Shows comprehensive Links section with all other links grouped by rel type
  - Both flags default to `false` (opt-in feature for backwards compatibility)
  - Links render under single "Links" header when at least one flag is enabled
  - New `LinkDisplay` component handles orchestration of self-link and grouped links
  - New `LinkItem` component for individual link cards with copy-to-clipboard, type icons, and open actions
  - New `defaultLinkGrouping.js` utility with filtering, grouping, and formatting functions
  - Smart href truncation showing meaningful URL parts (domain + important segments + filename)
  - Links grouped by rel type (e.g., "STAC API Item", "License", "Canonical URL")
  - Supports multiple links per rel type with count display (e.g., "License (3)")
  - Copy-to-clipboard functionality for all links with tooltip feedback
  - Type hint icons (JSON, HTML, Image, PDF) inferred from MIME type or URL extension
  - Special handling for non-HTTP links (S3, etc.) with "Requires S3 access" tooltip
  - Responsive grid layout respecting the column resize control (same as Assets section)
  - Configurable link rel type exclusion via `STAC_LINKS_EXCLUDE_LIST` for power users
  - Links exclude navigation/API plumbing by default: `parent`, `collection`, `root`, `items`, `aggregate`, `aggregations`, `conformance`, `service-desc`, `service-doc`, `data`, OGC queryables, `thumbnail`
  - Comprehensive links section displays: `canonical`, `license`, `derived_from`, `about`, `alternate`, and custom links
- Added `LayoutContext` for managing UI layout state (panel width, visibility)
- Added `EnhancedDetailsContext` for sharing STAC item and rendering data across component hierarchy
- Added strict ISO 8601 datetime validation to field discovery system
- Added `DatetimeFieldDisplay` component for formatted datetime rendering
- Added collection-specific visualization dropdown to search filters panel:
  - New `VisualizationSelector` component allows users to switch between available scene renderings (e.g., true-color, false-color, NDVI) for each collection
  - Dropdown dynamically populates from the `visualizations` field in `COLLECTIONS_CONFIG`
  - Only displays in Scene view mode (hidden in Mosaic view)
  - Automatically hides when collection has 0 or 1 visualizations (no selection needed)
  - Respects user selection across view mode changes (state persists when switching to Mosaic and back)
  - Added `selectedVisualization` to Redux state in `mainSlice.js` with `setSelectedVisualization` action
  - Updated `constructSceneTilerParams()` in `mapHelper.js` to accept and use selected visualization key
  - Updated `addImageOverlay()` to retrieve selected visualization from Redux and pass to tiler params
  - Component follows existing patterns from `CollectionDropdown` and `ViewSelector` for consistency
  - Comprehensive test coverage (14 tests) including view mode switching, collection changes, and state persistence

### Changed

- Replaced `sceneTilerParams` with `visualizations` field:
  - Old configs with `SCENE_TILER_PARAMS` are automatically upgraded to `visualizations` dictionary
  - Old `SCENE_TILER_PARAMS` converted to `visualizations: { "default": {...} }`
  - Use the new `visualizations` field for defining multiple rendering options
  - This change enables future UI enhancements like visualization selectors
- Added sensible defaults and auto-population for configuration to reduce required parameters:
  - Added `applyConfigDefaults()` function in `src/utils/configHelper.js` to centralize default value handling
  - `BASEMAP` now defaults to OpenStreetMap if not provided in config
  - `THEME_SWITCHING_ENABLED` now defaults to `true` (was `false`)
  - `EXPORT_ENABLED` now defaults to `true` (was `false`)
  - `SHOW_ITEM_AUTO_ZOOM` now defaults to `true` (was `false`)
  - `SEARCH_BY_GEOM_ENABLED` now defaults to `true` (was `false`)
  - `API_MAX_ITEMS` defaults to `200`
  - `MOSAIC_MAX_ITEMS` defaults to `100`
  - `MAP_CENTER` defaults to `[30, 0]`
  - `MAP_ZOOM` defaults to `3`
  - `MAP_ZOOM_MAX` defaults to `18`
  - `CONFIG_COLORMAP` defaults to `"viridis"`
  - Users can completely omit these configuration parameters for better out-of-box experience
- Added unified View Mode selector with four buttons (Hex, Grid, Scene, Mosaic) for
  user-selectable aggregation and viewing options
- Added automatic view mode switching based on zoom level with manual override capability:
  automatically switches between Hex (if available) and Scene views based on zoom
- Added `sceneMinZoom` configuration parameter to specify minimum zoom level for
  Scene and Mosaic views (replaces `searchMinZoomLevels.high`)
- Added `COLLECTIONS_CONFIG` structure to consolidate collection-specific parameters
  (sceneTilerParams, mosaicTilerParams, sceneMinZoom, popupDisplayFields,
  tileLayerParams, enhancedDisplayConfig)
- Added automatic configuration migration from legacy format to new format on load
- Added `normalizeCollectionsConfig()` helper function in `src/utils/configHelper.js`
  for backward compatibility
- Added `getCollectionConfig()` helper function for unified access to collection settings
- Added comprehensive `CONFIGURATION.md` documentation with parameter reference,
  examples, and migration guide
- Added `config-new-format-example.json` demonstrating new `COLLECTIONS_CONFIG` structure
- Added comprehensive test coverage for `normalizeCollectionsConfig()` and
  `getCollectionConfig()` functions (16 new tests covering backward compatibility,
  migration, new format, and parameter mapping)
- Added `.remarkrc.js` configuration file to customize markdown linting rules for technical
  documentation (allows longer lines, relaxed table formatting, etc.)
- Migrated from `pre-commit` package to Husky for git hooks management (developers should
  run `npm install` to set up hooks automatically)
- Added `.husky/` directory for git hooks
- Git hooks now properly source nvm to ensure consistent Node.js version across all
  environments (fixes Node version mismatch issues in VS Code/GitLens) due to moving
  from pre-commit to husky
- Added config `STAC_HEADER_COOKIES` to optionally inject STAC request header values from cookies. ([455](https://github.com/Element84/filmdrop-ui/pull/455))
- STAC item field and asset rendering refactored to use React components instead of string-based HTML:
  - `src/components/PopupResults/PopupResults.jsx` integrated with new enhanced details components
  - New 3-step field processing pipeline: validation → type detection → component extraction → React rendering
  - Error handling for field processing failures with graceful degradation
  - Field rendering delegated to `FieldRenderer` component for type-safe display
  - Asset rendering delegated to `AssetsContainer` component with file type grouping
  - Item metadata displayed via `EnhancedDetailsHeader` component
- Enhanced details rendering extracted to dedicated `EnhancedDetailsDisplay` component:
  - Created new `src/components/EnhancedDetails/EnhancedDetailsDisplay.jsx` for improved maintainability
  - Separates field grouping, asset rendering, and link display logic from popup navigation concerns
  - Reduces `PopupResults.jsx` complexity from 350 to 180 lines (50% reduction)
  - Enables independent testing of enhanced details rendering following React Testing Library principles
  - Component accepts `currentPopupResult` and `enhancedColumns` props for clean interface
- Enhanced CSS variable infrastructure for responsive layout:
  - Added `--columns` CSS variable to both dark and light themes in `src/themes/theme.css`
  - Ensures robust grid layout inheritance across `.field-grid`, `.asset-grid`, and `.link-grid` containers
  - Improves browser compatibility and eliminates potential CSS variable inheritance edge cases
- Code consistency improvements across Enhanced Details components:
  - Renamed `copiedHref` state variable to `copiedUrl` in `LinkItem.jsx` for naming alignment with `AssetItem` component
  - Fixed `enhancedColumns` initialization in Redux state to use correct panel width (320px) for semantic accuracy
  - Restored JSDoc comment above `GridFieldDisplay.propTypes` for improved code documentation
- Asset display now automatically groups by file type and excludes thumbnails from main asset view:
  - `src/utils/defaultAssetGrouping.js` enhanced with file type detection and asset classification
  - Thumbnails excluded from asset container (displayed separately if needed)
  - Asset groups created by MIME type for organized presentation
- Grid system recognition extended to support multiple coordinate system formats:
  - MGRS (Military Grid Reference System) with component parsing
  - WRS (Worldwide Reference System) for Landsat imagery
  - UTM (Universal Transverse Mercator) with zone and band detection
  - Generic grid codes with intelligent pattern matching
  - Each grid type renders with specialized `GridCoordinateField` component
- New `enhancedDisplayConfig` parameter within `COLLECTIONS_CONFIG[id]` for field and asset grouping:
  - Allows configuration of which fields appear in popup and their display order
  - Supports field grouping with collapsible sections
  - Asset grouping configuration with custom group labels
  - Optional configuration—if omitted, all fields and assets are displayed
  - See `CONFIGURATION.md` for detailed parameter structure and examples
- `src/utils/configHelper.js` enhanced with `createEnhancedDisplayFieldPredicate()` function:
  - Factory function for creating field filtering predicates based on `enhancedDisplayConfig`
  - Enables declarative field inclusion/exclusion logic
  - Integrates with field grouping system
- `src/utils/fieldGrouping.js` updated to make `appConfig` parameter optional in `createEnhancedDisplayFieldPredicate()`:
  - When `appConfig` omitted, all fields included in grouping logic
  - Reduces required parameters for utility function usage

### Changed

- Simplified zoom-based view switching: removed medium zoom level and grid-code auto-switching
- Consolidated Redux state from separate `viewMode` and `aggregationViewMode` to single
  `viewMode` state with values: 'hex', 'grid-code', 'scene', 'mosaic'
- Changed initial `viewMode` state from 'hex' to 'scene' (universally supported)
- Unified Mosaic and Scene zoom level requirements to both use `sceneMinZoom`
- Updated Scene and Mosaic buttons to share same zoom-based enabling/disabling behavior
- Updated `src/services/get-config-service.js` to normalize configuration on load
- Updated `src/utils/searchHelper.js` to use `getCollectionConfig()` for accessing
  scene min zoom level and removed unused `getTilerParams` import
- Updated `src/utils/mapHelper.js` to use `getCollectionConfig()` for tile layer and
  tiler parameters
- Simplified `constructSceneTilerParams()` and `constructMosaicTilerParams()` to work
  directly with collection config without unnecessary wrapping/unwrapping
- Refactored `parameters` helper functions in `src/utils/mapHelper.js` to accept tiler
  params directly instead of requiring collection lookup
- Updated `constructSceneAssetsParam()` to work with params directly without collection
  parameter
- Updated `src/components/PopupResult/PopupResult.jsx` to use `getCollectionConfig()`
  without passing redundant `_appConfig` parameter
- Updated `src/components/EnhancedDetailsTab/EnhancedDetailsTab.jsx` to call
  `createEnhancedDisplayFieldPredicate()` without passing redundant `appConfig` parameter
- Updated `src/utils/fieldGrouping.js` to make `appConfig` parameter optional in
  `createEnhancedDisplayFieldPredicate()`
- Updated `src/utils/configHelper.js` JSDoc to clarify third parameter is for testing purposes
- Updated `public/config/config.json` to use new `COLLECTIONS_CONFIG` structure
- Overhauled `README.md` following best practices with improved structure, quick start guide, and developer section
- Added `CONFIGURATION.md` with details on Config structure and including a migration guide
- Consolidated duplicate sections in `README.md` for clearer documentation
- Added backwards compatibility for stac-server aggregation names
  - Now supports both new (stac-server >= 3.6.0) and old (deprecated) aggregation names
  - Automatically detects and uses appropriate aggregation name based on STAC API capabilities
  - New names: `centroid_geohex_grid_frequency`, `centroid_geohash_grid_frequency`, `centroid_geotile_grid_frequency`
  - Old names: `grid_geohex_frequency`, `grid_geohash_frequency`, `grid_geotile_frequency`
  - Ensures compatibility with Earth Search STAC API and other APIs using deprecated names
- Asset grouping now prioritizes STAC roles (data, visual, metadata, thumbnail) with MIME type fallback for legacy items.
- Asset cards display custom roles and file type abbreviations for improved clarity.
- Processing software information now displays correctly in Enhanced Details (e.g., "sentinel2-to-stac (0.1.0)")
- STAC API Item link moved from top of popup to bottom, after all asset groups
- Refactored panel state management from Redux to React Context API:
  - `leftPanelWidth`, `isLeftPanelVisible`, and `enhancedColumns` now managed by `LayoutContext`
  - Reduces Redux store footprint and improves component isolation
- Eliminated prop drilling through EnhancedDetails component hierarchy using Context API:
  - Item data, enhanced columns, and app config now provided via `EnhancedDetailsContext`
  - Simplifies component signatures and improves maintainability
- DateTime field detection moved from regex fallback in `EnhancedFieldRenderer` to structured `fieldDiscovery` system
  - Validates ISO 8601 format (YYYY-MM-DDTHH:MM:SS[.sss][Z|±HH:MM])
  - Outputs formatted datetime as "YYYY-MM-DD HH:MM:SS"

### Fixed

- Fixed bug in `constructMosaicAssetVal()` that mutated Redux state by calling `.pop()` on
  the assets array, causing crashes in development mode and silent failures on subsequent
  mosaic searches in production (bug introduced in May 2023)
- Fixed bug where Dashboard and Analyze buttons would appear even when `DASHBOARD_BTN_URL`
  and `ANALYZE_BTN_URL` were set to empty strings or whitespace in configuration
- Updated `src/components/Layout/PageHeader/PageHeader.jsx` to use `.trim()` when checking
  button URL values to properly hide buttons when URLs are empty or whitespace-only
- Added test cases for whitespace-only URL values in `PageHeader.test.jsx`
- Fixed `TypeError: Invalid URL` warnings in test output by adding global fetch mock in
  `src/setupTests.js`
- Suppressed expected console.error messages in tests to reduce noise in test output
- Fixed XSS (Cross-Site Scripting) vulnerabilities by replacing string-based HTML rendering with React components:
  - STAC item field values no longer generated as HTML strings; instead rendered through type-safe `FieldRenderer` component
  - All user-controlled content in field display sanitized before rendering
  - DOMPurify integration provides additional HTML sanitization layer
  - Eliminates unsafe `dangerouslySetInnerHTML` pattern previously used in field rendering
- Fixed smart text truncation for long field values without spaces:
  - Long values without spaces (e.g., URLs, coordinate strings) now truncated intelligently
  - Full value displayed in tooltip on hover for accessibility
  - Text overflow detection prevents UI layout issues
- Fixed asset processing corrected for proper file type grouping and consistent thumbnail exclusion:
  - Assets now reliably grouped by MIME type and file extension
  - Thumbnails consistently excluded from main asset display across all collection types
  - Asset metadata (roles, GSD, description) properly extracted and displayed
- Fixed duplicate `rescale` parameter being added twice in TiTiler scene requests in `src/utils/mapHelper.js`
  - Removed duplicate parameter push that caused malformed query strings
- Fixed missing validation in `autoConfigureCollections()` function in `src/utils/configHelper.js`
  - Added check for empty `collectionIds` array after filtering to prevent invalid configuration state
  - Now returns early with warning when all collections have falsy IDs
- Fixed incomplete error handling in visualization system in `src/utils/mapHelper.js`
  - Added comprehensive validation to `constructSceneTilerParams()` with actionable warning messages
  - Validates visualizations exist, are proper object type, and contain at least one definition
  - Added specific error messaging in `addImageOverlay()` when visualizations are missing
  - All failures now provide clear diagnostic information for developers
- Fixed duplicate promise-based code in `src/services/get-collections-service.js`
  - Removed dead code that was trying to use `.includes()` on COLLECTIONS object
  - Consolidated to single async/await implementation that properly handles new COLLECTIONS object structure
  - Prevents TypeError when collections are auto-configured from STAC API
- Fixed empty "Processing" and "Software:" labels appearing when processing software data was present but not rendering
- Fixed authentication session error persistence bug (#484):
  - Error alerts now automatically clear when user successfully re-authenticates
  - Closing error alerts no longer logs out user unless the error was authentication-related
  - Added `isAuthErrorAlert` Redux state flag to distinguish auth errors from generic errors
  - Added `clearApplicationAlert` action for atomic alert state reset on successful login
  - Enhanced `showApplicationAlert()` helper with optional `isAuthError` parameter
  - Removed immediate logout on 403 errors to allow re-authentication attempts

### Removed

- Removed `DEFAULT_COLLECTION` configuration parameter - moved into `COLLECTIONS.default` for
  better organization. For backward compatibility, code still supports the old `DEFAULT_COLLECTION`
  parameter, but new configurations should use `COLLECTIONS.default` instead.
- Removed `LAYER_LIST_ENABLED` configuration parameter - layer list widget is now automatically
  enabled when `LAYER_LIST_SERVICES` array is populated (follows convention over configuration)
- Removed `pre-commit` npm package (replaced by Husky) and configuration
- Removed `MOSAIC_MIN_ZOOM_LEVEL` configuration parameter (mosaic views now use
  per-collection `sceneMinZoom` parameter, same as scene views)
- Removed unused `setShowZoomNotice` import from `src/utils/mapHelper.js` (functionality
  moved to `searchHelper.js`)
- Removed deprecated `setMosaicZoomMessage()` function from `src/utils/mapHelper.js`
  (zoom notice handling now centralized in `searchHelper.js`)

### Deprecated

- Deprecated `SCENE_TILER_PARAMS` (use `COLLECTIONS_CONFIG[id].sceneTilerParams` instead, backward compatible)
- Deprecated `MOSAIC_TILER_PARAMS` (use `COLLECTIONS_CONFIG[id].mosaicTilerParams` instead, backward compatible)
- Deprecated `SEARCH_MIN_ZOOM_LEVELS` (use `COLLECTIONS_CONFIG[id].sceneMinZoom` instead, backward compatible - automatically converts `{ medium, high }` format to use "high" value)
- Deprecated `searchMinZoomLevels` parameter (use `sceneMinZoom` instead)
- Deprecated `POPUP_DISPLAY_FIELDS` (use `COLLECTIONS_CONFIG[id].popupDisplayFields` instead, backward compatible)
- Deprecated `TILE_LAYER_PARAMS` (use `COLLECTIONS_CONFIG[id].tileLayerParams` instead, backward compatible)
- Deprecated `ENHANCED_DISPLAY_CONFIG` (use `COLLECTIONS_CONFIG[id].enhancedDisplayConfig` instead, backward compatible)
- Deprecated `getTilerParams()` in `src/utils/mapHelper.js` (no longer used internally, use `getCollectionConfig()` instead)

## 6.1.0 - 2025-09-25

### Changed

- Improves Presentation of STAC Search Results. ([441](https://github.com/Element84/filmdrop-ui/pull/441))
- Resolves moderate vulnerabilities in npm packages
  - Upgrades `vite` from 5.x to 7.17
    - and associated peer deps
  - Upgrades `remark-preset-lint-markdown-style-guide` from 5.1.3 to 6.0.1
    - Triggered a config change for `remark-lint-list-item-indent` value
  - Upgrades `dompurify` from 3.2.4 to 3.2.6
  - Upgrades `h3-js` from 4.1.0 to 4.2.1
  - Upgrades `react-tooltip` from 5.26.3 to 5.29.1

## 6.0.0 - 2025-08-25

### Added

- Added config option `MAP_ZOOM_MAX` to limit map zooming. ([413](https://github.com/Element84/filmdrop-ui/pull/413))
- Added config option `TILE_LAYER_PARAMS` to allow per-collection layer tiling parameters for leaflet. ([413](https://github.com/Element84/filmdrop-ui/pull/413))
- Added dark/Light theme switching ability. ([434](https://github.com/Element84/filmdrop-ui/pull/434))

### Fixed

- Cloud slider not expanding to fill available space. ([416](https://github.com/Element84/filmdrop-ui/pull/416))

### Changed

- Update packages per Snyk and Dependabot. ([417](https://github.com/Element84/filmdrop-ui/pull/417))
- Correct minor README.md errors. ([415](https://github.com/Element84/filmdrop-ui/pull/415))
- Resolve package vulnerabilities. ([415](https://github.com/Element84/filmdrop-ui/pull/415))
- Remove the `upgrade npm` step in the CI `test` job to avoid compatibility problems between the version of Node specified by the `.nvmrc` file and
  the latest `npm` version. ([415](https://github.com/Element84/filmdrop-ui/pull/415))
- ⚠️ **BREAKING CHANGE:** Replaced the configuration options `BASEMAP_URL`,
  `BASEMAP_DARK_THEME`, and `BASEMAP_HTML_ATTRIBUTION` with a single `BASEMAP` object
  for clean basemap configuration that supports optional dark/light mode theme
  switching. See the [README](./README.md) for the new `BASEMAP` object structure.
  ([434](https://github.com/Element84/filmdrop-ui/pull/434))
- ⚠️ **BREAKING CHANGE:** Replaced the boolean configuration option `SHOW_BRAND_LOGO` with
  a `BRAND_LOGO` object for clean configuration that supports optional dark/light mode
  theme switching and removes the hard-coded link href and title. See the
  [README](./README.md) for the new `BRAND_LOGO` object structure.
  ([434](https://github.com/Element84/filmdrop-ui/pull/434))

## 5.7.1 - 2024-09-24

### Added

- Client-side validation to login form fields

### Fixed

- User experience when re-authenticating due to token expiration or unauthorized request

### Changed

- Resolves moderate vulnerabilities in npm packages
  - Upgrades `@typescript-eslint/eslint-plugin` from 6.5 to 7.18
  - Upgrades `@typescript-eslint/parser` from 6.5 to 7.18
  - Upgrades `vite` from 5.1.4 to 5.1.8
  - Removes `@types/vite-plugin-react-svg`

## 5.7.0 - 2024-08-07

### Added

- Simple export feature to allow exporting search results as geojson

### Changed

- Refactor call to action button to reduce prominence and match export button size

### Fixed

- bump version in `package-lock.json` file ot match `package.json`

## 5.6.0 - 2024-08-02

### Added

- Added optional login feature
- Added optional config for ignoring aggregations feature if not supported by the STAC API

### Fixed

- Resolve high vulnerabilities in npm packages
- Fix bug with not showing search result count when Matched is not returned from a STAC API
- Changes from MUI Box to use a Stack component to fix build/rendering bug

### Changed

- Alerts of type `error` now force logout when encountered
- Alerts of type `warning` are used for non logout warnings shown to users

## 5.5.0 - 2024-05-28

### Added

- Support for scene and mosaic tiling `colormap` configuration.

## 5.4.0 - 2024-05-16

### Fixed

- Another instance of STAC API Item link using the first link in the links array,
  instead of looking up the "self" relation link by "rel" value.

## 5.3.0 - 2024-05-14

### Changed

- API calls via `fetch` now include configuration for including authentication.
  This can be changed with the config FETCH_CREDENTIALS, which defaults to the
  browser default of `same-origin`.

## 5.2.0 - 2024-05-08

### Fixed

- UI no longer throws an error if the STAC API does not support a queryables endpoint.
- STAC API Item link used the first link in the links array, instead of looking
  up the "self" relation link by "rel" value

## 5.1.0 - 2024-04-10

### Added

- Added initial console log of application deploy version number read from `package.json`
- Add support for `nodata` to tiling configurations.

## 5.0.2 - 2024-03-06

### Added

- Added `.gitkeep` to empty config directory so it gets put into version control.

## 5.0.1 - 2024-03-04

### Added

- Added `lint_config.py` helper script to assist in validating `config.json` files.

### Changed

- Moved example config out of public so it doesn't get added to build.
- Update readme for config keys showing as `required` to correctly reflect app run requirements.

### Fixed

- Bug fixed for zoom to collection extent running on every collection dropdown re-render.
- Bug fixed for `select scenes` button not changing to item details tab when clicked.

## 5.0.0 - 2024-02-27

### Added

- Added support for `COLLECTIONS` to be defined in the `config.json` file.
- Run search shortcut added for `SPACE` bar key press.
- Added config option for `SHOW_ITEM_AUTO_ZOOM` to render switch that lets user toggle behavior of map center/zooming automatically on selected scene.
- Added config option for `STAC_LINK_ENABLED` to render link out to item in STAC API when set to `true`.
- Added `results not found message` when search results are empty.

### Changed

- Move to vertical filter and search instead of top filters.
- Change `ADVANCED_SEARCH_ENABLED` in config settings to be `SEARCH_BY_GEOM_ENABLED`.
- Cart component from `stac-selector` effort moved to be in top nav bar.
- Top nav bar and components height reduced.
- Search does not re-run automatically on view mode changed, search button must be clicked or `SPACE` key pressed.
- Results info panel relocated to be sticky to top left of map frame.
- Fetch requests to files in hosted app build directory now use relative path.
- Config parameter for `LAUNCH_URL` renamed to `ACTION_BUTTON` and structure changed to be an object.
- Analyze button moved into top nav.
- Scene count design refactored to reduce size.
- `Images not visible...` message moved to be next to search button in bottom left of map pane.
- Results popup now renders in left panel.
- Tabs added to left panel to switch between results and info panels.
- Refactor of loading indicator to specify when imagery overlay is loading instead vs. search loading.
- Style adjusted for switch to be in line with other UI elements.
- Replace date picker library `DateTimeRangePicker` to use `react-datepicker`.
- Collection range is now always visible in search panel.
- Date Range Picker does not get changed on collection change. Only set on initial load and then manually by user.

### Fixed

- Bug fix that made `DEFAULT_COLLECTION` required instead of optional, per the readme. It is now actually optional.
- Fix bug where grid-code aggregation results didn't render if `grid_code_frequency` included a key that didn't match the expected pattern
- Resolved bug with map tooltip not closing on mouseout that lead to extra tooltip rendering.
- Improved responsiveness for mid-size screens.
- Bug fix for when multiple grid-code grids are selected, bug was only showing one grid-code in results.
- Refactor keyboard shortcut for running search. Changed to use `ctrl+space`.
- Date range format now renders and searches correctly using UTC instead of using local timezone.

### Removed

- Auto-search function has been removed since it's behavior was deemed to be undesirable.
- Publish button and modal from an old demo no longer needed for any projects.
- Collapsible feature search results panel removed.

## 4.4.0 - 2023-12-01

### Fixed

- Update link tag for manifest.json so that it uses basic auth credentials, fixes load when running behind CloudFront with basic auth

### Removed

- Special handling of `grid_code_landsat_frequency` aggregation

## 4.3.0 - 2023-10-13

### Fixed

- resolve security @vitejs/plugin-react@4.0.4 vulnerabilities coming from `babel`

### Changed

- Updated max-height of main logo to be 40px

### Added

- Added config option for applying dark style to custom basemap URL

## 4.2.0 - 2023-10-03

### Changed

- Mosaic tiling parameter `bidx` is now passed as multiple parameters
  (e.g., `bidx=1&bidx=2&bidx=3`) instead of a single comma-delimited value
  (e.g., `bidx=1,2,3`). This is to accomodate a change to titler-mosaicjson
  as of v0.14.0

## 4.1.0 - 2023-09-14

### Added

- Added config option for starting map zoom level
- Added config option for starting map center location
- Added config options for enabling and defining reference map layers (only wms currently supported)

## 4.0.1 - 2023-09-12

### Changed

- Bug fix for grid-code not working properly on map click events.

## 4.0.0 - 2023-08-29

### Added

- Add buttons for: `loading all scenes` and `selecting all scenes on map` to show in popup if more than initial load of 200 scenes is matched.
- Add favicon config setting to allow custom favicon to be set.

### Changed

- Migrate vitest coverage provider to use v8 instead of c8.
- Added cache-busting to config and data asset fetching to prevent caching of stale files.
- Update map attribution to show until user interaction.
- Move app title from env variable to config file for completing build once deploy anywhere approach.
- Removed mention of env variables from README as they are no longer used.

## 3.3.0 - 2023-08-17

### Added

- Cart button to `Add all to cart` & `Add/Remove scene from cart` added to search bar if `CART_ENABLED` set to true in `config.json` (WIP feature)
- Cart items are now shown in layer on map if `CART_ENABLED` set to true in `config.json` and Items exist in cart. (WIP feature)

### Changed

- Map legend updated to always show 'Scenes in Cart' symbology when `CART_ENABLED` set to true in `config.json` and Items exist in cart. (WIP feature)
- PopupResults component updated to allow users to minimize/maximize popup results component content.
- Metadata in `PopupResult` changed to show additional properties about the scene if `POPUP_DISPLAY_FIELDS` set in the `config.json`.
- Bug fix to handle grid aggregations that 'landsat' in the title but `grid-code-frequency` in the properties.

## 3.2.0 - 2023-08-02

### Changed

- SHOW_BRAND_LOGO now defaults to `true`.

### Added

- Added Legend

## 3.1.0 - 2023-07-27

### Changed

- Launch modals have been removed along with the `CF_TEMPLATE_URL` config parameter.
  Instead, the 'Launch Your Own' button will redirect to the URL configured for the
  `LAUNCH_URL` parameter

## 3.0.0

### Changed

- Refactor map code and related files
- Refactor API calls
- Moved config reference from `envSetupVars.js` into `search.jsx`
- Geosearch moved under zoom control and changed to be collapsed
- `VITE_ADVANCED_SEARCH_ENABLED` and `VITE_CART_ENABLED` must be set in `config.js`
- Moved config location from `src/assets/config.js` to `public/config/config.json`
- Refactor config to be a json object instead of separate exported constants
- Changed config key names to remove the word `VITE` (leftover from when they were .env vars)
- Refactor `default.js` to remove dead code and rename vars
- Conditionally render E84 FilmDrop Logo based on config var for `SHOW_BRAND_LOGO`
- Consolidate hex legend into single new legend component

### Fixed

- Map selection and popup now close in unison
- Fix styling of popup results component

### Added

- Added 'thumbnail not found' image placeholder
- Added Config feature flags for Advanced Search Options and Cart
- Added draw boundary feature to allow user to draw polygon on map (WIP)
- When polygon drawn, use as search intersects param instead of map viewport bbox
- Added upload geojson feature to allow users to select a geojson file to add to map
- Reusable System Message component for showing app alerts
- Load `config.json` into redux on app load once instead of direct imports
- Add pre-initialization page to handle and show error (and not render app) if config is missing
- Add `SHOW_BRAND_LOGO` config option to optionally hide brand logo
- Added Hawaii DOQQ grid (for NAIP)
- Add new Legend component for map

### Removed

- Delete `envSetupVars.js` after moving functions and const into other files

## 2.0.2 - 2023-05-18

### Fixed

- Publish button was not displaying with boolean true value set.

## 2.0.1 - 2023-05-17

### Fixed

- Legend for geohex aggregation now displays.

## 2.0.0 - 2023-05-16

### Changed

- Rename REACT_APP_MIN_ZOOM_LEVEL to REACT_APP_MOSAIC_MIN_ZOOM_LEVEL
- **Migrate from create-react-app to vite:**
  - Changed npm start, build, and test commands in package.json
  - Rename REACT_APP\_ in .env's to be VITE\_
  - Moved index.html into project root
  - Rename index.html link references, title and src
  - Updated readme to remove cra references
  - Renamed react component files to be .jsx instead of .js
  - Updated leaflet css import path
  - Refactor inputs to `getTilerParams` to reference full .env object before passing into function
  - Change from 'require' to ES6 module import in `colormap.js`
- Pre-commit hook for test changed to use test-pre-commit with `--run` flag
- Bump vite-plugin-svgr from 2.4.0 to 3.2.0
- **Migrated from '.env' to './assets/config.js'**
  - Config vars are now in JSON format
  - You can specify new values when running locally, or during the build process
- Update precision for hex geo-aggregate to be defined per zoom levels instead of set based on a quotient
- Change default styles for gridCode and footprint layers to be defined in `Search.jsx`
- Updated leaflet basemap to try to read from config if set, else default to OpenStreetMap with css darkmode

### Fixed

- Datetime search now searches from midnight UTC on the start date to immediately before midnight
  on the day after the end date (i.e., the last instant on the end date)
- Set ref for `zoomLevelRef.current` on initial map load

### Added

- For high DPI screens (e.g., Retina), scene image tiling is now done at scale of 2 (previously, scale of 1).
- Grid code aggregated results view at medium zoom levels
- Toggle to enable auto-search or manual search with Search Button
- Geo hex aggregated results view at low zoom levels
- Env variable REACT_APP_SEARCH_MIN_ZOOM_LEVELS
- Env variable REACT_APP_COLORMAP
- **Migrate from create-react-app to vite:**
  - Added `vite.config.js`
  - Added eslint-plugin-jsx-a11y
  - Vitest and related testing library libs
  - Added NPM `coverage` and `serve` commands
- Added types for react, react-dom, testing-library\_\_jest-dom, and vite-plugin-react-svg
- Set coverage provider to use c8
- Added setup under test in `vite.config.ts`
- Added `tsconfig.node.json`
- Added reference and excludes sections in `tsconfig.json`
- Reducer to reset redux state back to initialization state for use between tests
- Test ids added for `Content` and `PageHeader` components
- Example tests for `App.jsx` in `App.test.jsx`
- Example test for `PageHeader.jsx` in `PageHeader.test.jsx`
- Added dompurify library for sanitizing before rendering configurable HTML

### Removed

- Types declaration from `tsconfig.json`
- Tests directory from include section in `tsconfig.json`

## v1.1.0 - 2023-05-05

### Added

- Grid code aggregated results view at medium zoom levels
- Toggle to enable auto-search or manual search with Search Button
- Geo hex aggregated results view at low zoom levels

## v1.0.0 - 2023-03-24

### Changed

- Move the viewport to include collection spatial bounds if it is outside those bounds
- Set the date picker to the collection temporal date range if date picker is outside that range

### Added

- Search by geolocation

## v0.5.0 - 2023-03-20

### Changed

- Move mosaic-specific tiler parameters (`mosaic_asset` and `mosaic_color_formula`) into REACT_APP_MOSAIC_TILER_PARAMS (new),
  and rename them to `assets` and `color_formula` to align with scene view tiler parameters.
- Rename REACT_APP_TILER_URL to REACT_APP_SCENE_TILER_URL
- Rename REACT_APP_TILER_PARAMS to REACT_APP_SCENE_TILER_PARAMS

### Added

- Env variable REACT_APP_MOSAIC_TILER_PARAMS
- `rescale`, `colormap_name`, and `expression` tiler parameters

## v0.4.0 - 2023-03-14

### Changed

- Env variable REACT_APP_TILER_PARAMS key `asset_bidx` changed to `bidx`. The format is
  now just a comma-separated list of indexes (e.g., `1,2,3`) rather than of the form `asset-name|1,2,3`

### Added

- Add mosaic view mode if REACT_APP_MOSAIC_TILER_URL (new) is defined
- Env variable REACT_APP_MOSAIC_MAX_ITEMS
- `mosaic_asset` and `mosaic_color_formula` tiler parameters
- Env variable REACT_APP_API_MAX_ITEMS

## Fixed

- Single-file, multi-band mosaic compositing (e.g., NAIP) now works

## v0.3.0 - 2023-03-06

### Changed

- Rename env variable REACT_APP_TITILER to REACT_APP_TILER_URL
- Rename env variable REACT_APP_STAC_API_ENDPOINT to REACT_APP_STAC_API_URL
- Rename env variable REACT_APP_COLLECTIONS to REACT_APP_DEFAULT_COLLECTION
- Rename env variable REACT_APP_DASHBOARD_LINK to REACT_APP_DASHBOARD_BTN_URL
- Rename env variable REACT_APP_ANALYZE_LINK to REACT_APP_ANALYZE_BTN_URL
- Make date/time field required
- Date function to calculate the last 2 weeks
- Make REACT_APP_MIN_ZOOM_LEVEL optional
- Improve use of MIN_ZOOM constant
- Enable cloud cover dependency based on collection

### Added

- Env variable PUBLIC_URL
- Env variable REACT_APP_LOGO_URL
- Env variable REACT_APP_LOGO_ALT
- Env variable REACT_APP_TILER_PARAMS
- Collection dropdown to Search that is dynamically populated from API
- Error indicators for UI elements
- Support for Landsat thumbnail preview
- Functionality for custom Logo and alt description
- Env variable REACT_APP_SHOW_PUBLISH_BTN
- FilmDrop - Element 84 logo
- Minimum zoom level for search
- Env variable REACT_APP_MIN_ZOOM_LEVEL
- Add support for `asset_bidx` tiler configuration
- Env variable REACT_APP_CF_TEMPLATE_URL
- Env variable REACT_APP_APP_NAME

### Removed

- Remove BBOX button
- Make Publish button configurable in env variable
- Remove time from date range
- Remove Search button

## v0.2.0 - 2023-Jan-13

- Start of changelog
