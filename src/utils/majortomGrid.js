import * as L from 'leaflet'

const EARTH_RADIUS_METERS = 6378137

function getLatitudeGrid(distanceMeters, offset) {
  const arcPoleToPole = Math.PI * EARTH_RADIUS_METERS
  const n = Math.ceil(arcPoleToPole / distanceMeters)
  const step = 180 / n
  const latitudes = new Array(n)
  for (let i = 0; i < n; i++) latitudes[i] = -90 + i * step
  if (offset !== 0) {
    const latOffset = step * offset
    for (let i = 0; i < n; i++) latitudes[i] -= latOffset
  }
  return latitudes
}

function getLongitudeGrid(latitudeDeg, distanceMeters, offset) {
  const radius = EARTH_RADIUS_METERS * Math.cos((latitudeDeg * Math.PI) / 180)
  const circumference = 2 * Math.PI * radius
  const n = Math.max(1, Math.ceil(circumference / distanceMeters))
  const step = 360 / n
  const longitudes = new Array(n)
  for (let i = 0; i < n; i++) longitudes[i] = -180 + i * step
  if (offset !== 0) {
    const lonOffset = step * offset
    for (let i = 0; i < n; i++) longitudes[i] += lonOffset
  }
  return longitudes
}

function overlappingIndices(values, min, max) {
  const spacing = values[1] - values[0]
  const indices = []
  for (let i = 0; i < values.length; i++) {
    const next = i + 1 < values.length ? values[i + 1] : values[i] + spacing
    if (values[i] <= max && next >= min) indices.push(i)
  }
  return indices
}

export function getCellsInBbox({
  minLon,
  minLat,
  maxLon,
  maxLat,
  distanceMeters,
  offset = 0
}) {
  // Date-line crossing is not handled; clamp to ±180.
  minLon = Math.max(minLon, -180)
  maxLon = Math.min(maxLon, 180)
  minLat = Math.max(minLat, -90)
  maxLat = Math.min(maxLat, 90)

  const latitudes = getLatitudeGrid(distanceMeters, offset)
  const latIndices = overlappingIndices(latitudes, minLat, maxLat)
  const latSpacing = latitudes[1] - latitudes[0]

  const cells = []
  for (const latIdx of latIndices) {
    const south = latitudes[latIdx]
    const north =
      latIdx + 1 < latitudes.length ? latitudes[latIdx + 1] : south + latSpacing

    const longitudes = getLongitudeGrid(south, distanceMeters, offset)
    const lonSpacing = longitudes[1] - longitudes[0]
    const lonIndices = overlappingIndices(longitudes, minLon, maxLon)

    for (const lonIdx of lonIndices) {
      let west = longitudes[lonIdx]
      if (west >= 180) west -= 360
      if (west < -180) west += 360
      const east =
        lonIdx + 1 < longitudes.length
          ? longitudes[lonIdx + 1]
          : west + lonSpacing
      cells.push({ south, north, west, east })
    }
  }
  return cells
}

const DEFAULT_STYLE = {
  color: '#7f8fa6',
  weight: 1,
  fill: false,
  interactive: false
}

const MAX_CELLS = 5000

export function createMajorTomGridLayer(map, config) {
  const distanceMeters = config.distanceMeters
  const offset = config.offset || 0
  const minZoom = config.minZoom ?? 8
  const style = { ...DEFAULT_STYLE, ...(config.style || {}) }

  const featureGroup = L.featureGroup()

  const redraw = () => {
    featureGroup.clearLayers()
    if (map.getZoom() < minZoom) return
    const bounds = map.getBounds()
    const cells = getCellsInBbox({
      minLon: bounds.getWest(),
      minLat: bounds.getSouth(),
      maxLon: bounds.getEast(),
      maxLat: bounds.getNorth(),
      distanceMeters,
      offset
    })
    if (cells.length > MAX_CELLS) {
      // Defensive cap: should not trigger when minZoom is set sensibly.
      return
    }
    for (const cell of cells) {
      L.rectangle(
        [
          [cell.south, cell.west],
          [cell.north, cell.east]
        ],
        style
      ).addTo(featureGroup)
    }
  }

  featureGroup.on('add', () => {
    map.on('moveend', redraw)
    redraw()
  })
  featureGroup.on('remove', () => {
    map.off('moveend', redraw)
  })

  return featureGroup
}
