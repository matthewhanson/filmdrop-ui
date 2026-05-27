# LGND fork of FilmDrop UI

This is a fork of [Element84/filmdrop-ui](https://github.com/Element84/filmdrop-ui)
maintained at [matthewhanson/filmdrop-ui](https://github.com/matthewhanson/filmdrop-ui).

The `lgnd/main` branch tracks upstream `main` and carries LGND-specific features
that may not be contributed back upstream. It is consumed by
[filmdrop-iac](https://github.com/matthewhanson/filmdrop-iac) via a release tag
in the `filmdrop_ui_version` variable (currently `lgnd-20260503`).

## Keeping in sync

```bash
git fetch upstream
git checkout lgnd/main
git rebase upstream/main
# resolve any conflicts, then:
git push fork lgnd/main --force-with-lease
```

When cutting a new deployment, tag `lgnd/main` and update `filmdrop_ui_version`
in `filmdrop-iac/variables.tf`.

## Changes on `lgnd/main` vs upstream

### MajorTOM grid reference layer

A new `majortom-grid` service type for `LAYER_LIST_SERVICES` that renders the
ESA MajorTOM grid directly in the browser. Grid cells are computed from the
current viewport on every pan/zoom — no tile server required.

**Files changed:**

- `src/utils/majortomGrid.js` — grid geometry math (`getCellsInBbox`) and Leaflet
  layer factory (`createMajorTomGridLayer`). Draws rectangles into a `featureGroup`
  that redraws on `moveend`, with a configurable `minZoom` and a 5 000-cell safety cap.
- `src/utils/configHelper.js` — parses the new `majortom-grid` service type in
  `parseLayerListConfig`. Extracts `distance_meters`, `offset`, `min_zoom`, and
  `style` from config. Also refactors common layer fields (`combinedLayerName`,
  `layerName`, `layerAlias`, `visibility`, `type`) into a shared object.
- `src/utils/mapHelper.js` — new `createReferenceLayerInstance()` factory that
  dispatches on `refLayer.type` (`wms` or `majortom-grid`), replacing the previous
  inline WMS-only construction in `addReferenceLayersToMap` and
  `toggleReferenceLayerVisibility`.
- `CONFIGURATION.md` — documents the new service type and per-layer config fields.

**Configuration example:**

```json
{
  "LAYER_LIST_SERVICES": [
    {
      "name": "MajorTOM",
      "type": "majortom-grid",
      "layers": [
        {
          "name": "2560m",
          "alias": "MajorTOM 2560m grid",
          "default_visibility": false,
          "distance_meters": 2560,
          "offset": 0,
          "min_zoom": 8
        }
      ]
    }
  ]
}
```

## Previously upstreamed (now merged)

These changes originated on this fork and have been merged into upstream `main`.
They no longer appear in the `lgnd/main` diff.

- **ViewSelector geohex aggregation** (PR [#572](https://github.com/Element84/filmdrop-ui/pull/572)) —
  recognize `centroid_geohex_grid_frequency` as a hex-grid aggregation type.
- **Render config bidx extraction** (PR [#575](https://github.com/Element84/filmdrop-ui/pull/575)) —
  extract `bidx` from the STAC render extension in `autoConfigureRendering`.

## Other branches

| Branch              | Status               | Purpose                                                         |
| ------------------- | -------------------- | --------------------------------------------------------------- |
| `main`              | synced with upstream | Upstream mirror                                                 |
| `lgnd/main`         | active               | LGND integration branch                                         |
| `mah/tiler_updates` | in progress          | OGC Tiles API / titiler support (not yet merged to `lgnd/main`) |
