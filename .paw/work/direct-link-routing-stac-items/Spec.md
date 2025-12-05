# Feature Specification: Direct Link Routing to STAC Items

**Branch**: issues/477/direct-link-stac-item  |  **Created**: 2025-12-05  |  **Status**: Draft
**Input Brief**: Add a client side router so that users can link directly to viewing STAC items without needing to go through search first

## Overview

FilmDrop UI currently requires users to perform a search before they can view specific STAC items, making it impossible to share direct links to interesting imagery or satellite scenes. This feature introduces client-side routing that enables users to navigate directly to specific items via URL, transforming FilmDrop from a session-based search tool into a fully linkable web application.

When a user discovers a compelling satellite scene—perhaps a dramatic weather event captured by Sentinel-2 or a specific location in high-resolution imagery—they want to share that exact view with colleagues, embed it in documentation, or bookmark it for later reference. With direct link routing, copying the browser's URL and sharing it will "just work." Recipients opening the link will immediately see the item visualized on the map, with its footprint displayed and imagery rendered if TiTiler is configured for that collection.

This capability extends beyond simple item viewing. Users browsing through multiple items will experience standard web navigation patterns: the browser's back button returns to previously viewed items, the forward button revisits items they navigated away from, and the URL bar always reflects their current context. This familiar browsing experience makes FilmDrop feel like a native web application rather than a single-page application with opaque state. The feature also lays groundwork for future enhancements like deep-linking search results, enabling users to share not just individual items but entire curated searches with specific date ranges, cloud cover filters, and geographic boundaries.

## Objectives

- Enable users to access specific STAC items directly via URL without requiring search interaction (Rationale: this is the core value proposition—making FilmDrop content shareable and linkable)
- Support standard browser navigation patterns including back/forward buttons and history management (Rationale: users expect web applications to respect browser navigation conventions)
- Preserve application state and user context during navigation transitions (Rationale: seamless navigation enhances user experience and maintains workflow continuity)
- Maintain FilmDrop's configuration-driven architecture without introducing hardcoded routing assumptions (Rationale: FilmDrop supports diverse STAC APIs and deployment scenarios that require flexibility)

## User Scenarios & Testing

### User Story P1 – Share Specific Item via Direct URL

**Narrative**: A disaster response analyst identifies a critical satellite scene showing flood extent from a recent weather event. They need to share this specific scene with emergency management teams who require immediate access to the imagery without navigating through search interfaces. The analyst copies the URL, sends it via email or chat, and recipients instantly view the scene on the map with full visualization capabilities.

**Independent Test**: Navigate to a URL matching the pattern `/item/:collectionId/:itemId` and verify that the specified STAC item loads, displays its footprint on the map, and renders imagery if the collection has TiTiler configuration.

**Acceptance Scenarios**:
1. Given a user has a URL containing collection ID "sentinel-2-l2a" and item ID "S2A_17SNB_20230617_0_L2A", When they navigate to that URL, Then the application fetches item metadata from the STAC API and displays the item on the map
2. Given a user opens a direct item link for a valid item, When the item loads successfully, Then the map automatically centers on the item's geometry and adjusts zoom to frame the item's extent
3. Given a user opens a direct item link for a collection configured with TiTiler parameters, When the item loads, Then the item's imagery renders on the map using the collection's configured band combinations and color formulas
4. Given a user bookmarks an item URL, When they return to that bookmark days later, Then the same item loads and displays regardless of any previous search state or session data

---

### User Story P2 – Navigate Between Items with Browser History

**Narrative**: A researcher is reviewing multiple satellite scenes from different dates to analyze land use changes over time. They click through several items from search results, examining each one's imagery and metadata. When they want to compare a current scene with a previous one, they instinctively press the browser's back button. The application responds naturally, restoring the previous item's visualization without re-executing the original search query.

**Independent Test**: Open three different item links in sequence by navigating to distinct `/item/:collectionId/:itemId` URLs, then use the browser back button twice and forward button once. Each navigation should restore the appropriate item view with its map visualization.

**Acceptance Scenarios**:
1. Given a user has viewed item A then navigated to item B via direct link, When they press the browser back button, Then item A is restored with its geometry displayed on the map and the URL reflects item A's route
2. Given a user has navigated backward from item B to item A, When they press the browser forward button, Then they return to item B with its visualization restored
3. Given a user performs a search yielding multiple results, When they click an item from results to view details, Then the URL updates to the item route and navigating back returns them to the search results page with all filters, results, and map viewport preserved

---

### User Story P3 – Handle Error Conditions Gracefully

**Narrative**: A user receives a shared link to a STAC item but the item ID was mistyped in the URL. Instead of encountering a broken application or cryptic error, they see a helpful message explaining that the item could not be found, while the map remains functional allowing them to navigate to search or explore other items manually.

**Independent Test**: Navigate to an item URL with a non-existent item ID and verify that an error banner appears with a clear message, the application remains functional, and the user can navigate to other routes without refreshing the page.

**Acceptance Scenarios**:
1. Given a user navigates to an item URL with an item ID that does not exist, When the STAC API returns a 404 response, Then an error banner displays with the message "Item not found" and the map remains visible and interactive
2. Given a user opens an item URL for a collection that does not exist in the configuration, When the application validates the collection ID, Then an error banner displays explaining the collection is not configured
3. Given a user navigates to an item URL but the STAC API is temporarily unavailable, When the fetch request times out or returns a 5xx error, Then an error banner displays a user-friendly message explaining the service is unavailable and suggesting retry

---

### Edge Cases

- **Item IDs with Special Characters**: Item IDs containing colons, slashes, or dots (e.g., "S2A_17SNB_20230617:0/L2A.tif") must be properly encoded using `encodeURIComponent()` when constructing URLs and decoded with `decodeURIComponent()` when parsing route parameters to prevent routing errors
- **Collection Not Configured**: When routing to an item from a collection ID that does not exist in `config.json`, the application displays an error banner stating "Collection not configured" without attempting to fetch from the STAC API
- **Authentication Requirements**: When `APP_TOKEN_AUTH_ENABLED` is true in configuration, the router checks an additional route protection flag in `config.json`; if route protection is enabled and no authentication token exists in localStorage, the user is redirected to login with the target item URL preserved for post-authentication redirect
- **Offline or Network Failure**: When a user navigates to an item URL while offline or experiencing network issues, the application displays an error banner explaining the connectivity problem and allows retry without requiring page refresh
- **Configuration Changes**: If a user bookmarks an item URL but the collection's TiTiler configuration changes in `config.json` before they return to the bookmark, the item loads successfully using the updated configuration rather than failing or caching stale settings

## Requirements

### Functional Requirements

- **FR-001**: System MUST implement client-side routing to enable URL-based navigation without triggering full page reloads (Stories: P1, P2)
- **FR-002**: System MUST support URL pattern `/item/:collectionId/:itemId` to directly access STAC items (Stories: P1)
- **FR-003**: System MUST encode item IDs using `encodeURIComponent()` when constructing item URLs and decode using `decodeURIComponent()` when parsing route parameters to handle special characters like colons and slashes common in STAC item IDs (Stories: P1, P3)
- **FR-004**: System MUST create a new service function following existing service patterns to fetch item metadata from STAC API endpoint `/collections/{collectionId}/items/{itemId}`, including authentication headers when `APP_TOKEN_AUTH_ENABLED` is true and credentials configuration from `appConfig.FETCH_CREDENTIALS` (Stories: P1; Research: No existing service fetches individual items)
- **FR-005**: System MUST validate that the collection ID exists in `config.json` using `getCollectionConfig(collectionId, paramName)` helper before attempting to fetch item metadata, checking any required parameter like `sceneMinZoom` which returns `undefined` for unconfigured collections (Stories: P3; Research: Function handles both modern and legacy config formats)
- **FR-006**: System MUST display the item's geometry footprint on the map using `L.geoJSON(feature, {style: clickedFootprintLayerStyle})` and adding to `clickedSceneHighlightLayer` consistent with existing map-click selection (Stories: P1; Research: This maintains visual consistency with existing selection behavior)
- **FR-007**: System MUST render item imagery by calling `debounceTitilerOverlay(item)` which uses collection's `sceneTilerParams` from `COLLECTIONS_CONFIG` to construct TiTiler URLs and create tile layers (Stories: P1; Research: Reuses existing visualization logic with 800ms debounce)
- **FR-008**: System MUST automatically center and zoom the map by calling existing `zoomToItemExtent(item)` function which converts item bbox to Leaflet bounds and calls `map.fitBounds()`, respecting `SHOW_ITEM_AUTO_ZOOM` configuration flag (Stories: P1; Research: Maintains consistency with user-configured auto-centering behavior)
- **FR-009**: System MUST update the browser URL when users navigate to view item details through TanStack Router's navigation APIs, preserving navigation history (Stories: P1, P2)
- **FR-010**: System MUST preserve browser history to support back/forward button navigation between items via TanStack Router's history management (Stories: P2)
- **FR-011**: System MUST restore previous item visualization when user navigates backward, using TanStack Router's loader/cache mechanisms to avoid redundant fetches when possible while maintaining correct Redux state population (Stories: P2)
- **FR-012**: System MUST handle item fetch errors gracefully by calling `showApplicationAlert(severity, message, duration)` from `alertHelper.js` to display error banners that integrate with existing `SystemMessage` component rendering (Stories: P3; Research: Utility manages Redux states `showApplicationAlert`, `applicationAlertMessage`, `applicationAlertSeverity`)
- **FR-013**: When item fetch returns 404, system MUST call `showApplicationAlert('error', 'Item not found')` to display persistent error banner, keep map visible and interactive, and NOT automatically redirect to another route (Stories: P3)
- **FR-014**: When collection ID validation via `getCollectionConfig()` returns `undefined`, system MUST call `showApplicationAlert('info', 'Collection not configured')` without attempting STAC API fetch (Stories: P3)
- **FR-015**: System MUST check `APP_TOKEN_AUTH_ENABLED` configuration flag and localStorage for 'APP_AUTH_TOKEN' to determine if authentication is required for item routes, following the same pattern as existing STAC API services (Stories: P3; Research: Consistent authentication pattern across all services)
- **FR-016**: When route protection is enabled and user is not authenticated (no 'APP_AUTH_TOKEN' in localStorage), system MUST redirect to login and preserve target item URL via TanStack Router's redirect mechanism for post-authentication return (Stories: P3)
- **FR-017**: System SHOULD preserve full search state (filters, results, map viewport) when navigating from search results to item view and back, leveraging Redux state persistence and TanStack Router's state management (Stories: P2)
- **FR-018**: System MUST populate Redux states `clickResults` (array containing fetched item), `currentPopupResult` (the fetched item), and `selectedPopupResultIndex` (set to 0) when loading item via direct URL to maintain compatibility with existing `PopupResults` and `EnhancedDetailsTab` components (Stories: P1; Research: These three states control all item display throughout the application)

### Key Entities

- **Route**: URL pattern mapping to application views, including item detail route `/item/:collectionId/:itemId`, search route, and home route
- **Item Context**: State object containing collection ID, item ID, fetched item GeoJSON, item geometry, and item assets for the currently displayed item
- **Navigation History**: Browser history entries managed through the History API (pushState/replaceState) enabling back/forward navigation

## Success Criteria

- **SC-001**: Users can navigate to a STAC item directly via URL pattern `/item/:collectionId/:itemId` without performing any search interaction, with the new service function successfully fetching item data and populating `clickResults`, `currentPopupResult`, and `selectedPopupResultIndex` Redux states (FR-001, FR-002, FR-004, FR-018)
- **SC-002**: Item detail URLs load and display the item on the map within 3 seconds on standard network connections with latency under 200ms, with footprint rendered on `clickedSceneHighlightLayer` and map centered via `zoomToItemExtent()` (FR-004, FR-006, FR-008)
- **SC-003**: Browser back button successfully navigates to previously viewed items, restoring their visualization state through TanStack Router's history management and Redux state updates (FR-010, FR-011)
- **SC-004**: Browser forward button successfully navigates to next items in history after using back button, maintaining visualization consistency (FR-010, FR-011)
- **SC-005**: Shared item URLs work correctly when opened by other users in different sessions, displaying the same item visualization with proper authentication handling when `APP_TOKEN_AUTH_ENABLED` is configured (FR-001, FR-002, FR-004, FR-006, FR-015)
- **SC-006**: URL changes occur without full page reloads, maintaining single-page application behavior through TanStack Router's client-side navigation (FR-001)
- **SC-007**: Error states for non-existent items (404), unconfigured collections, and network failures display helpful messages via `showApplicationAlert()` utility rendering in `SystemMessage` component without breaking application functionality (FR-012, FR-013, FR-014)
- **SC-008**: Application remains responsive and interactive during route navigation, with `imageOverlayLoading` state showing spinner for TiTiler rendering and error banners displaying clearly without blocking user interaction (FR-004, FR-006, FR-007, FR-012)
- **SC-009**: Item IDs containing special characters (colons, slashes, dots) are correctly encoded/decoded using `encodeURIComponent()`/`decodeURIComponent()`, allowing items like "S2A_17SNB_20230617:0/L2A.tif" to be accessed via URL (FR-003)
- **SC-010**: Existing `PopupResults` and `EnhancedDetailsTab` components display routed item details identically to map-click selection, demonstrating seamless integration with existing UI (FR-006, FR-007, FR-018)

## Assumptions

- **STAC API Individual Item Endpoint**: The STAC API supports GET requests for individual items at the standard STAC API endpoint `/collections/{collectionId}/items/{itemId}` per STAC specification (Research: No existing FilmDrop service fetches individual items; all items currently come from search endpoints returning FeatureCollections)
- **Item ID Encoding**: Item IDs will be encoded using standard `encodeURIComponent()` for URL construction and decoded with `decodeURIComponent()` when parsing routes, handling special characters like colons and slashes that commonly appear in STAC item identifiers (Research: Existing code does not perform URL encoding for external links; this is a new requirement for routing)
- **Browser History API**: Browser History API (pushState/replaceState) is available in all supported browsers; FilmDrop UI already requires modern browsers for Leaflet and React features, so this is consistent with existing requirements; TanStack Router will manage History API interactions
- **Routing Library**: TanStack Router will be used for client-side routing, providing type-safe routing, modern React integration, and built-in state management capabilities that integrate with Redux; this choice was confirmed during requirements gathering with user preference for letting the library handle History API best practices
- **Authentication Pattern**: Authentication tokens stored in localStorage with `APP_TOKEN_AUTH_ENABLED` flag will be reused for item fetch requests using the same header pattern as existing services: `Authorization: Bearer ${JWT}` (Research: All STAC API services follow this consistent authentication pattern)
- **Route Protection**: Route protection behavior for item URLs is configuration-driven via a flag in `config.json`, allowing deployments to choose whether direct item links require authentication; when enabled and user is not authenticated, redirect to login occurs with post-authentication return URL preserved
- **Redux State Integration**: Existing Redux state management will be extended to track current route context; item routing will populate the same `clickResults`, `currentPopupResult`, and `selectedPopupResultIndex` states used by map-click selection to maintain compatibility with existing `PopupResults` and `EnhancedDetailsTab` components (Research: These three Redux states control all item display throughout the application)
- **Map Auto-Centering**: Map viewport centering will respect the existing `SHOW_ITEM_AUTO_ZOOM` configuration flag to maintain consistency with user expectations; the existing `zoomToItemExtent()` function will be reused for map centering logic (Research: This function already handles bbox-to-bounds conversion and calls `map.fitBounds()`)
- **Collection Configuration Validation**: Collection ID validation will use the existing `getCollectionConfig()` helper which returns `undefined` for unconfigured collections, checking any required parameter like `sceneMinZoom` to verify collection exists before attempting API fetch (Research: Function supports both modern `COLLECTIONS_CONFIG` and legacy format with automatic migration)
- **Error Display**: Error handling will use the existing `showApplicationAlert(severity, message, duration)` utility from `alertHelper.js` to display error banners for item fetch failures, collection validation errors, and network issues (Research: Function integrates with Redux state `showApplicationAlert`, `applicationAlertMessage`, `applicationAlertSeverity` and renders `SystemMessage` component at app root)
- **Item Visualization Reuse**: Item visualization will trigger the same rendering flow as map-click selection by calling `debounceTitilerOverlay()` for imagery rendering and using `L.geoJSON(feature, {style: clickedFootprintLayerStyle})` for footprint display on `clickedSceneHighlightLayer` (Research: This maintains consistency with existing visualization and respects collection-specific TiTiler configuration)
- **Fetch Credentials**: Item fetch service will use `credentials: appConfig.FETCH_CREDENTIALS || 'same-origin'` pattern consistent with all existing STAC API services (Research: All services include this configuration for cookie/credential handling)

## Scope

**In Scope**:
- Client-side routing implementation using TanStack Router
- Item detail route (`/item/:collectionId/:itemId`) with full visualization capabilities
- Browser history management for back/forward navigation between items
- Error handling for item fetch failures, invalid collections, and authentication requirements
- URL encoding/decoding for item IDs with special characters
- Integration with existing Redux state management for route context
- Configuration-driven route protection supporting authentication requirements

**Out of Scope**:
- Deep-linking search results with URL-encoded query parameters (User Story P3 from original issue; deferred to future iteration)
- Server-side rendering or pre-rendering of item routes for SEO
- Route-based code splitting or lazy loading of components
- Custom 404 page design; error handling uses existing error banner system
- Migration of existing application components to route-based structure beyond what's necessary for item viewing
- Changes to STAC API interactions beyond adding single-item fetch endpoint calls
- Analytics or tracking of URL sharing patterns

## Dependencies

- TanStack Router library (to be added as npm dependency for client-side routing with History API management)
- Existing Redux store for state management, specifically states: `clickResults`, `currentPopupResult`, `selectedPopupResultIndex`, `tabSelected`, `imageOverlayLoading`, `showApplicationAlert`, `applicationAlertMessage`, `applicationAlertSeverity`
- STAC API support for individual item endpoints (`/collections/{collectionId}/items/{itemId}`) following STAC specification
- Existing `alertHelper.js` utility providing `showApplicationAlert(severity, message, duration)` for error banner display
- Existing `configHelper.js` utilities providing `getCollectionConfig(collectionId, paramName)` for collection configuration validation and access with automatic legacy format migration
- Existing `mapHelper.js` utilities providing `zoomToItemExtent(item)`, `addImageOverlay(item)`, `debounceTitilerOverlay(item)`, `clearMapSelection()`, and footprint styling constants
- Existing `PopupResults` component for item detail display in left panel
- Existing `EnhancedDetailsTab` component for expanded item property and asset display
- Existing `SystemMessage` component for rendering error banners at application root level
- Leaflet FeatureGroup layers: `clickedSceneHighlightLayer` for footprints, `clickedSceneImageLayer` for TiTiler imagery

## Risks & Mitigations

- **Risk**: TanStack Router integration may conflict with existing React component structure or Redux patterns, particularly around how Redux state drives current tab-based navigation via `tabSelected` state. **Impact**: Development delays and potential refactoring of components; routing state and Redux state could become desynchronized. **Mitigation**: Begin with minimal routing implementation for item detail route only; populate existing Redux states (`clickResults`, `currentPopupResult`, `selectedPopupResultIndex`) to trigger existing component rendering; use TanStack Router primarily for URL management and History API while maintaining Redux as source of truth for application state; research confirms existing components communicate only via Redux, so no parent-child prop refactoring needed.

- **Risk**: URL-encoded item IDs may become excessively long for items with complex identifiers, potentially exceeding the practical 2,000 character limit for shareable URLs mentioned in research. **Impact**: URLs may be truncated or difficult to share via certain channels like email or Slack. **Mitigation**: Use standard `encodeURIComponent()` which handles special characters efficiently; research shows actual STAC item IDs follow predictable patterns (e.g., "S2A_17SNB_20230617_0_L2A") which encode to reasonable lengths; monitor production usage; document known character length estimates in implementation phase.

- **Risk**: Direct item links may expose items that users expect to be access-controlled, especially in deployments with `APP_TOKEN_AUTH_ENABLED` where search endpoints are protected but individual item endpoints might not be consistently secured at STAC API level. **Impact**: Potential security or privacy concerns if sensitive imagery is directly linkable without authentication. **Mitigation**: Implement configuration-driven route protection flag in `config.json`; require authentication for item routes when flag is enabled using localStorage 'APP_AUTH_TOKEN' check following existing service patterns; new item fetch service will include `Authorization: Bearer ${JWT}` header consistent with all existing services (research confirms consistent authentication pattern); preserve target URL via TanStack Router redirect for post-login return.

- **Risk**: Browser history navigation may behave unexpectedly if users navigate between items from different collections with conflicting map configurations, or if `clearMapSelection()` and layer management becomes desynchronized during back/forward navigation. **Impact**: Poor user experience with incorrect map zoom, missing imagery, visual glitches, or footprints from previous items remaining visible. **Mitigation**: Call `clearMapSelection()` before rendering each routed item to clear `clickedSceneHighlightLayer` and `clickedSceneImageLayer`; derive zoom and center from item geometry using `zoomToItemExtent()` rather than preserving previous viewport; validate collection configuration via `getCollectionConfig()` on each load to ensure proper TiTiler parameters; research confirms collection config helper handles format migration automatically so configuration will be consistent.

- **Risk**: Creating a new item fetch service introduces potential for inconsistency with existing STAC API service patterns, particularly around error handling, authentication headers, and credentials configuration. **Impact**: Authentication failures, CORS issues, or inconsistent error reporting that confuses users. **Mitigation**: Follow exact pattern documented in research: use fetch with `credentials: appConfig.FETCH_CREDENTIALS || 'same-origin'`, add authentication headers conditionally when `APP_TOKEN_AUTH_ENABLED` is true and 'APP_AUTH_TOKEN' exists in localStorage, implement promise-based error handling with `.then()/.catch()` chains consistent with existing services, use `showApplicationAlert()` for user-facing errors instead of only console logging.

## References

- Issue: https://github.com/Element84/filmdrop-ui/issues/477
- Research: .paw/work/direct-link-routing-stac-items/SpecResearch.md (2025-12-05, Complete)
- External: STAC API Specification - https://github.com/radiantearth/stac-api-spec (Item endpoint standard)

### Research Insights Summary

The research phase documented 17 areas of existing system behavior that inform this specification:

**Navigation & State Management**: FilmDrop currently has no URL-based routing; all navigation is Redux state-driven. Item selection occurs via `mapClickHandler` which stores items in `clickResults` array, sets `currentPopupResult` to active item, and uses `selectedPopupResultIndex` for navigation between multiple clicked items. The `PopupResults` component manages UI display.

**API Patterns**: All STAC API services follow consistent patterns with fetch requests, optional JWT Bearer authentication when `APP_TOKEN_AUTH_ENABLED` is true, and promise-based error handling. No existing service fetches individual items—all items come from `/search` endpoints returning FeatureCollections. A new service will be needed following established patterns.

**Configuration Access**: Collection-specific settings are accessed via `getCollectionConfig(collectionId, paramName)` which supports both modern `COLLECTIONS_CONFIG` and legacy parameter formats with automatic migration. Returns `undefined` for unconfigured collections, providing validation mechanism.

**Visualization**: Item imagery is rendered using TiTiler via `addImageOverlay()` which constructs URLs to `/stac/tiles/{z}/{x}/{y}` endpoints. Footprints display using `L.geoJSON()` on `clickedSceneHighlightLayer`. Map centering uses `zoomToItemExtent()` which calls `map.fitBounds()` on item bbox, respecting `SHOW_ITEM_AUTO_ZOOM` configuration.

**Component Architecture**: Application uses Redux for all component communication; no parent-child props for data sharing. Left panel has tab-based system ('filters', 'details', 'enhanced') controlled by `tabSelected` state. Existing `PopupResults` and `EnhancedDetailsTab` components will display routed items naturally when Redux state is populated correctly.

**Error Handling**: The `showApplicationAlert(severity, message, duration)` utility displays system messages via error banner. Currently used sparingly in services but provides the mechanism needed for user-facing error messages during routing failures.

## Glossary

- **STAC**: SpatioTemporal Asset Catalog, a specification for describing geospatial information
- **TiTiler**: Dynamic tile server for Cloud Optimized GeoTIFFs, used by FilmDrop for imagery rendering
- **Item**: A STAC Item represents a single spatiotemporal asset, typically a satellite scene or imagery capture
- **Collection**: A STAC Collection groups related items, such as all scenes from a specific satellite mission
- **Route**: A URL pattern that maps to a specific application view or component
- **encodeURIComponent**: JavaScript function that encodes special characters in URL components
