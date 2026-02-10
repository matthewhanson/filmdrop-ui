# Future: Components Reading URL State Directly

## Problem

Currently, URL state flows through an extra hop:

```
URL change → useSearch() re-render → useEffect in useUrlStateSync
→ Redux dispatch → useSelector() re-render in component
```

Every URL param change causes **two render cycles** in consuming components.
The sync hook (`useUrlStateSync`) manually diffs each param and dispatches to
Redux, acting as a translation layer between two reactive systems.

## Vision

Components read URL-synced state directly from the router via `useSearch()`,
eliminating the sync hop entirely:

```
URL change → useSearch() re-render in component (done)
```

Redux remains for non-URL state (search results, map instance, config, etc.).

## Migration Path

### Phase 1: `tab` (proof of concept)

`tab` is the simplest param to migrate — it's a string enum (`'search'` |
`'details'`), only read in two components, and has no complex
serialization.

**Components to change:**

1. **`LeftContent.jsx`** — reads `tabSelected` from Redux (via
   `useSelector`). Change to:

   ```jsx
   import { useSearch } from '@tanstack/react-router'
   // ...
   const { tab } = useSearch({ from: '__root__' })
   const tabSelected = tab || 'search'
   ```

2. **`RightContent.jsx`** — dispatches `settabSelected('details')` directly
   to Redux on "Select All Scenes" click. Change to use `useUrlNavigate`'s
   `setTab('details')` instead, which writes to the URL (the source of
   truth). The URL change then triggers a re-render in LeftContent via
   `useSearch`.

**Sync hook change:** Remove the `tab` entry from `SIMPLE_PARAM_HANDLERS`
in `useUrlStateSync.js` and remove `settabSelected` from its imports. The
`tab` param in `useUrlInitialize` initialization (Phase 1) also changes —
instead of dispatching to Redux, it's already in the URL and components
will read it directly on first render.

### Phase 2: Other simple params

After validating the `tab` migration, apply the same pattern to:

- `viz` — read by visualization selector components
- `view` — read by view mode selector

Each follows the same steps: replace `useSelector` with `useSearch`,
replace direct Redux dispatch with `useUrlNavigate` calls.

### Phase 3: Complex params

`col`, `dt`, and queryable filters are more complex because they're used
widely and involve serialization. These can be migrated later or kept in
Redux if the cost/benefit doesn't justify the change.

## Testing Implications

The current test pattern wraps components in `<Provider store={store}>`
but **not** `<RouterProvider>`. When components start using `useSearch()`,
tests have two options:

### Option A: Mock `useSearch` (recommended initially)

```jsx
vi.mock('@tanstack/react-router', () => ({
  useSearch: () => ({ tab: 'search', viz: '' /* ... */ })
}))
```

This is consistent with the existing pattern of mocking router hooks. It
keeps tests fast and isolated.

### Option B: Wrap in RouterProvider

```jsx
import { RouterProvider } from '@tanstack/react-router'
import { router } from '../router'

const setup = () =>
  render(
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  )
```

This provides more integration-level testing but is heavier. Consider
this for a few key integration tests, not every component test.

## When to Stop

Not every piece of Redux state needs to move to URL reading. The
migration is worthwhile for state that:

- Is shareable via URL (already a URL param)
- Is read by few components (small migration surface)
- Has simple serialization (string or number)

State like search results, click results, and map objects should stay in
Redux — they're not URL-representable and are used pervasively.
