<script setup lang="ts">
import { onMounted, ref, nextTick } from 'vue'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { gw2Api } from '../services/gw2Api'

// GW2-specific constants
const CONTINENT_ID = 1  // Tyria
const FLOOR_ID = 1     // Main level
const MIN_ZOOM = 2
const MAX_ZOOM = 7
const INITIAL_ZOOM = 3

const map = ref<L.Map | null>(null)
const markers = ref<L.Marker[]>([])
const isLoading = ref(true)
const mapContainer = ref<HTMLElement | null>(null)

type MapLabel = { coords: [number, number], name: string }

// Convert GW2 coordinates to Leaflet coordinates
const convertGW2Coords = (coords: [number, number] | undefined): [number, number] => {
  if (!coords || !Array.isArray(coords)) {
    console.warn('Invalid coordinates:', coords)
    return [0, 0]
  }
  return [-coords[1] / 128, coords[0] / 128]
}

const updateMarkerVisibility = (zoom: number) => {
  markers.value.forEach(marker => {
    if (zoom >= 0) {
      marker.getElement()?.classList.remove('hidden');
    } else {
      marker.getElement()?.classList.add('hidden');
    }
  });
};

const initializeMap = () => {
  if (!mapContainer.value) return;

  map.value = new L.Map(mapContainer.value, {
    crs: L.CRS.Simple,
    minZoom: 2,
    maxZoom: 7,
    zoomControl: false,
    attributionControl: false
  });

  const initialCoords: L.LatLngTuple = [-36000/128, 45000/128];
  const initialZoom = -1;  // Start at zoom level -1 to hide labels initially
  
  map.value.setView(initialCoords, initialZoom);

  // Register custom control position
  const controlCorners = (map.value as any)._controlCorners
  const container = (map.value as any)._controlContainer

  const cornerDiv = L.DomUtil.create('div', 'leaflet-coordtopright', container)
  controlCorners['coordtopright'] = cornerDiv

  // Add coordinate display
  const CoordControl = L.Control.extend({
    options: {
      position: 'topright'
    },
    onAdd: () => {
      const div = L.DomUtil.create('div', 'coordinate-display')
      return div
    }
  })

  const coordDisplay = new CoordControl()
  coordDisplay.addTo(map.value as L.Map)

  // Update coordinates on mousemove
  map.value.on('mousemove', (e) => {
    const div = document.querySelector('.coordinate-display')
    if (div) {
      div.textContent = `Coordinates: ${Math.round(e.latlng.lng * 128)} | ${Math.round(-e.latlng.lat * 128)}`
    }
  })

  // Add tile layer with loading events
  const tileLayer = L.tileLayer(`tiles/${CONTINENT_ID}/${FLOOR_ID}/{z}/{x}/{y}.jpg`, {
    tileSize: 256,
    noWrap: true,
    keepBuffer: 2,
    updateWhenIdle: true,
    updateWhenZooming: false,
    maxNativeZoom: MAX_ZOOM
  })

  // Handle loading states
  tileLayer.on('loading', () => {
    isLoading.value = true
  })

  tileLayer.on('load', () => {
    isLoading.value = false
  })

  // Add tile layer to map
  tileLayer.addTo(map.value as L.Map)

  // Load API data after map is initialized
  loadApiData()

  // Check initial visibility after markers are created
  updateMarkerVisibility(initialZoom);

  // Make sure the zoom handler is set
  map.value.on('zoomend', () => {
    updateMarkerVisibility(map.value?.getZoom() ?? 0);
  });
}

onMounted(async () => {
  try {
    await nextTick()
    
    initializeMap()
  } catch (error) {
    console.error('Error initializing map:', error)
    isLoading.value = false // Ensure loading spinner stops on error
  }
})

const loadApiData = async () => {
  try {
    if (!map.value) {
      throw new Error('Map not initialized')
    }

    await gw2Api.init()
    const floorData = await gw2Api.getMapFloor(CONTINENT_ID, FLOOR_ID)
    const mapsData = await gw2Api.getMaps()
    
    // Calculate maximum bounds from all map coordinates
    const bounds = Object.values(mapsData.maps)
      .filter(map => map.type === 'Public')
      .reduce((acc, map) => {
        const [[x1, y1], [x2, y2]] = map.continent_rect
        return {
          minX: Math.min(acc.minX, x1, x2),
          minY: Math.min(acc.minY, y1, y2),
          maxX: Math.max(acc.maxX, x1, x2),
          maxY: Math.max(acc.maxY, y1, y2)
        }
      }, { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity })

    // Convert to Leaflet bounds and set map bounds
    const corner1 = convertGW2Coords([bounds.minX, bounds.minY])
    const corner2 = convertGW2Coords([bounds.maxX, bounds.maxY])
    map.value.setMaxBounds([corner1, corner2])

    // Pre-calculate label data to avoid doing it on every zoom
    const regionLabelData = Object.entries(floorData?.regions ?? {})
      .filter(([_, region]: [string, any]) => region.name && region.label_coord)
      .map(([_, region]: [string, any]) => ({
        coords: convertGW2Coords(region.label_coord),
        name: region.name
      }))

    const mapLabelData = Object.entries(floorData?.regions ?? {})
      .flatMap(([_, region]: [string, any]) => 
        Object.entries(region.maps ?? {})
          .map(([mapId, _]: [string, any]) => {
            const mapInfo = mapsData.maps[mapId]
            if (mapInfo?.type === 'Public') {
              const [[x1, y1], [x2, y2]] = mapInfo.continent_rect
              return {
                coords: convertGW2Coords([
                  (x1 + x2) / 2,
                  (y1 + y2) / 2
                ]),
                name: mapInfo.map_name
              }
            }
            return null
          })
          .filter(Boolean)
      )

    const createLabels = () => {
      const regionLabels = new L.LayerGroup()
      const mapLabels = new L.LayerGroup()
    
      // Create region labels from pre-calculated data
      regionLabelData.forEach(label => {
        L.marker(label.coords, {
          icon: L.divIcon({
            className: 'region-label',
            html: label.name,
            iconSize: [0, 0],
            iconAnchor: [0, 0]
          }),
          zIndexOffset: 1000,
          interactive: false,
          riseOnHover: false,
          riseOffset: 0,
        }).addTo(regionLabels)
      })

      // Create map labels from pre-calculated data
      mapLabelData.forEach((label: MapLabel | null) => {
        if (label) {
          L.marker(label.coords, {
            icon: L.divIcon({
              className: 'map-label',
              html: label.name,
              iconSize: [0, 0],
              iconAnchor: [0, 0]
            }),
            zIndexOffset: 500,
            interactive: false,
            riseOnHover: false,
            riseOffset: 0,
          }).addTo(mapLabels)
        }
      })

      // Add both layers to map initially
      regionLabels.addTo(map.value as L.Map)
      mapLabels.addTo(map.value as L.Map)

      // Set initial visibility: region labels visible, map labels hidden
      document.querySelectorAll('.region-label').forEach(el => {
        (el as HTMLElement).style.opacity = '1'
      })
      
      document.querySelectorAll('.map-label').forEach(el => {
        (el as HTMLElement).style.opacity = '0'
      })

      return { regionLabels, mapLabels }
    }

    let { regionLabels, mapLabels } = createLabels()
    
    map.value.on('zoomstart', () => {
      document.querySelectorAll('.region-label, .map-label').forEach(el => {
        (el as HTMLElement).style.opacity = '0'
      })
    })

    map.value.on('zoomend', () => {
      const zoom = map.value?.getZoom() ?? 0
      
      // Just update visibility instead of recreating
      document.querySelectorAll('.region-label').forEach(el => {
        (el as HTMLElement).style.opacity = zoom < 4 ? '1' : '0'
      })
      
      document.querySelectorAll('.map-label').forEach(el => {
        (el as HTMLElement).style.opacity = zoom >= 4 ? '1' : '0'
      })
    })

  } catch (error) {
    console.error('Error loading API data:', error)
  }
}
</script>

<template>
  <div ref="mapContainer" class="map-container">
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
    </div>
  </div>
</template>

<style scoped>
.map-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #242424;
  width: 100%;
  height: 100%;
}

.loading-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #333;
  border-top: 3px solid #646cff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Dark theme for Leaflet controls */
:deep(.leaflet-bar) {
  border: none;
}

:deep(.leaflet-bar a) {
  background-color: rgba(26, 26, 26, 0.8);
  color: #fff;
  border: none;
}

:deep(.leaflet-bar a:hover) {
  background-color: rgba(38, 38, 38, 0.9);
  color: #646cff;
}

:deep(.leaflet-bar a.leaflet-disabled) {
  background-color: rgba(26, 26, 26, 0.5);
  color: #666;
}

:deep(.coordinate-display) {
  background-color: rgba(26, 26, 26, 0.8);
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  border: none;
}

:deep(.region-label),
:deep(.map-label) {
  transition: opacity 0.6s ease-in-out, transform 0.3s ease-in-out;
  transform-origin: center;
}

:deep(.region-label) {
  background: none;
  border: none;
  box-shadow: none;
  color: #FFD700;
  font-size: 18px;
  font-weight: bold;
  text-shadow: 
    -1px -1px 0 #000,
    1px -1px 0 #000,
    -1px 1px 0 #000,
    1px 1px 0 #000;
  white-space: nowrap;
}

:deep(.map-label) {
  background: none;
  border: none;
  box-shadow: none;
  color: white;
  font-size: 14px;
  font-weight: bold;
  text-shadow: 
    -1px -1px 0 #000,
    1px -1px 0 #000,
    -1px 1px 0 #000,
    1px 1px 0 #000;
  white-space: nowrap;
}

:deep(.leaflet-control-attribution) {
  display: none;
}
</style>