# STAC API Client

A modular JavaScript client for interacting with STAC (SpatioTemporal Asset Catalog) APIs.

## Overview

This client provides a clean interface for working with STAC APIs, including:

- Fetching catalogs and collections
- Checking conformance classes
- Support for STAC API extensions

## Files

- **`stac-api-client.js`** - Core client functions for interacting with STAC APIs
- **`stac-api-conformance.js`** - Conformance class constants and helpers
- **`index.js`** - Barrel export for easy importing

## Usage

### Basic Usage

```javascript
import { getRootCatalog, getCollections } from './stac-api'

// Fetch the root catalog
const catalog = await getRootCatalog(
  'https://earth-search.aws.element84.com/v1'
)

// Fetch all collections
const collections = await getCollections(
  'https://earth-search.aws.element84.com/v1'
)
```

### Checking Conformance

```javascript
import {
  supportsConformance,
  getConformance,
  checkConformance,
  STAC_API_CORE,
  STAC_API_EXTENSIONS
} from './stac-api'

// Check if API supports a specific conformance class
const hasSearch = await supportsConformance(apiUrl, STAC_API_CORE.ITEM_SEARCH)

// Get all conformance classes
const conformance = await getConformance(apiUrl)
console.log('Supported conformance:', conformance)

// Check multiple conformance classes at once
const support = await checkConformance(apiUrl, [
  STAC_API_CORE.CORE,
  STAC_API_CORE.COLLECTIONS,
  STAC_API_CORE.ITEM_SEARCH,
  STAC_API_EXTENSIONS.QUERY,
  STAC_API_EXTENSIONS.AGGREGATION
])
console.log('Conformance support:', support)
```

### Using Conformance Constants

```javascript
import { STAC_API_CORE, STAC_API_EXTENSIONS } from './stac-api'

// Core STAC API conformance classes
STAC_API_CORE.CORE // https://api.stacspec.org/v1.0.0/core
STAC_API_CORE.COLLECTIONS // https://api.stacspec.org/v1.0.0/collections
STAC_API_CORE.ITEM_SEARCH // https://api.stacspec.org/v1.0.0/item-search

// STAC API Extensions
STAC_API_EXTENSIONS.QUERY // Query extension
STAC_API_EXTENSIONS.FIELDS // Fields selection
STAC_API_EXTENSIONS.SORT // Sorting results
STAC_API_EXTENSIONS.CONTEXT // Result context
STAC_API_EXTENSIONS.FILTER // CQL2 filtering
STAC_API_EXTENSIONS.AGGREGATION // Aggregation
```

## API Reference

### Client Functions

#### `getRootCatalog(apiUrl)`

Fetches the root catalog (landing page) from a STAC API.

**Parameters:**

- `apiUrl` (string) - The base URL of the STAC API

**Returns:** `Promise<Object>` - The root catalog object

**Throws:** Error if the request fails

---

#### `getCollections(apiUrl)`

Fetches all collections from the STAC API.

**Parameters:**

- `apiUrl` (string) - The base URL of the STAC API

**Returns:** `Promise<Object>` - Object containing collections array

**Throws:** Error if the request fails

---

#### `getCollection(apiUrl, collectionId)`

Fetches a single collection by ID.

**Parameters:**

- `apiUrl` (string) - The base URL of the STAC API
- `collectionId` (string) - The ID of the collection to fetch

**Returns:** `Promise<Object>` - The collection object

**Throws:** Error if the request fails

---

#### `supportsConformance(apiUrl, conformanceUri)`

Checks if the API supports a specific conformance class.

**Parameters:**

- `apiUrl` (string) - The base URL of the STAC API
- `conformanceUri` (string) - The conformance URI to check

**Returns:** `Promise<boolean>` - true if supported, false otherwise

**Throws:** Error if the request fails

---

#### `getConformance(apiUrl)`

Gets all conformance classes supported by the API.

**Parameters:**

- `apiUrl` (string) - The base URL of the STAC API

**Returns:** `Promise<string[]>` - Array of conformance URIs

**Throws:** Error if the request fails

---

#### `checkConformance(apiUrl, conformanceUris)`

Checks multiple conformance classes at once.

**Parameters:**

- `apiUrl` (string) - The base URL of the STAC API
- `conformanceUris` (string[]) - Array of conformance URIs to check

**Returns:** `Promise<Object<string, boolean>>` - Object mapping URIs to support status

**Throws:** Error if the request fails

### Conformance Constants

#### `STAC_API_CORE`

Core STAC API conformance classes (required):

- `CORE` - STAC API - Core
- `COLLECTIONS` - Collections endpoint
- `ITEM_SEARCH` - Item Search endpoint
- `OGCAPI_FEATURES` - OGC API Features Core
- `OGCAPI_FEATURES_GEOJSON` - GeoJSON support
- `OGCAPI_FEATURES_OAS30` - OpenAPI 3.0

#### `STAC_API_EXTENSIONS`

Standard STAC API extensions:

- `QUERY` - Enhanced filtering
- `FIELDS` - Field selection
- `SORT` - Sorting results
- `CONTEXT` - Result metadata
- `FILTER` - CQL2 filtering
- `AGGREGATION` - Aggregation
- `TRANSACTION` - Create/Update/Delete

#### `STAC_API_EXTENSIONS_COMMUNITY`

Community extensions:

- `FREE_TEXT` - Free-text search
- `BROWSEABLE` - Browse by datetime
- `CHILDREN` - List child catalogs/collections
- `COLLECTION_SEARCH` - Collection search

### Helpers

#### `getConformanceName(uri)`

Gets the constant name for a conformance URI.

**Parameters:**

- `uri` (string) - The conformance URI

**Returns:** `string|null` - The constant name or null if not found

## Testing

Tests are included for all functions and use Vitest:

```bash
npm test stac-api-client
npm test stac-api-conformance
```

## Future Library Extraction

This module is designed to be extracted into a standalone npm package. The structure follows best practices:

- Clean separation of concerns (client vs conformance)
- Comprehensive JSDoc documentation
- Full test coverage
- Barrel exports via index.js
- No external dependencies (uses native fetch)

When extracting:

1. Move the entire `stac-api` directory to a new package
2. Add `package.json` with appropriate metadata
3. Publish to npm
4. Import anywhere: `import { getRootCatalog } from '@your-org/stac-api-client'`

## Resources

- [STAC API Specification](https://github.com/radiantearth/stac-api-spec)
- [STAC API Extensions](https://stac-api-extensions.github.io/)
- [STAC Specification](https://stacspec.org/)
