---
agent: 'PAW-01B Spec Researcher'
---

# Spec Research Prompt: Direct Link Routing to STAC Items

Perform research to answer the following questions about the existing FilmDrop UI codebase and its interaction patterns.

Target Branch: issues/477/direct-link-stac-item
Issue URL: https://github.com/Element84/filmdrop-ui/issues/477
Additional Inputs: none

## Questions

### Current Navigation and State Management

1. How does the application currently handle navigation between the search view and item detail view? What triggers item selection and how is the selected item stored in Redux state?

2. What is the current structure of the Redux state for item data (`clickResults`, `currentPopupResult`, `selectedPopupResultIndex`)? How is item metadata currently populated when a user clicks on a search result?

3. How does the existing map centering logic work when an item is selected? Identify the functions in `mapHelper.js` or related utilities that control map viewport (center, zoom, bounds).

4. What authentication patterns are currently implemented? How does `APP_TOKEN_AUTH_ENABLED` affect application behavior? Where in the codebase are authentication checks performed?

5. How does the application currently construct URLs for external links (Dashboard, Analyze buttons, Launch URL)? Are there any existing URL construction patterns that handle special characters or encoding?

### STAC API Integration

6. What STAC API endpoints does the application currently use? Document the patterns in existing service files (`get-search-service.js`, `get-collections-service.js`, etc.) including how they construct URLs, handle authentication headers, and process responses.

7. Does the application currently fetch individual STAC items (single item endpoint `/collections/{collectionId}/items/{itemId}`)? Or does it only fetch items via search endpoints that return feature collections?

8. How does the application handle STAC API errors in existing service files? What error handling patterns are established (try/catch blocks, promise rejections, error state management)?

### Collection Configuration

9. What is the structure of `COLLECTIONS_CONFIG` in `config.json`? How does the application access collection-specific settings like `sceneTilerParams`, `sceneMinZoom`, and TiTiler configuration?

10. How does the `getCollectionConfig()` helper function work? What does it return when a collection ID is not found in configuration?

### Item Visualization

11. How does the application currently render STAC item imagery on the map using TiTiler? Identify the code that constructs TiTiler URLs and creates Leaflet image overlays.

12. How does the application display item footprints (geometry) on the map? What Leaflet layers or components are used to render GeoJSON geometries?

13. What is the sequence of operations when a user selects an item from search results? Trace the flow from click event through Redux dispatch to map visualization.

### Error Handling

14. How does the `alertHelper.js` utility work? What functions are available for displaying error messages, and how are they integrated with Redux state?

15. How does the application currently handle missing or invalid collection IDs? Are there validation checks before making API calls?

### Component Structure

16. What is the component hierarchy for the main application view? How are Layout components (PageHeader, LeftContent, RightContent, LeafMap) organized and how do they communicate via Redux?

17. How does the existing popup/modal system work for displaying item details? What triggers the display of item details in the left panel (`PopupResults`, `EnhancedDetailsTab`)?

### Optional External / Context

1. What are the browser History API best practices for single-page applications? How should `pushState` and `replaceState` be used to manage navigation state without causing memory leaks or excessive history entries?

2. How does TanStack Router integrate with Redux for state management? Are there recommended patterns for keeping router state synchronized with Redux state?

3. What URL length limitations exist for modern browsers and common sharing platforms (email, Slack, etc.)? What is the practical maximum length for shareable URLs?
