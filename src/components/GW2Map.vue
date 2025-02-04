<script setup lang="ts">
import { onMounted, ref } from 'vue'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { gw2Api } from '../services/gw2Api'

// GW2-specific constants
const CONTINENT_ID = 1  // Tyria
const FLOOR_ID = 1     // Main level
const MIN_ZOOM = 0
const MAX_ZOOM = 7
const INITIAL_ZOOM = 4

const map = ref<L.Map | null>(null)
const isLoading = ref(true)
const mapContainer = ref<HTMLElement | null>(null)

// Convert GW2 coordinates to Leaflet coordinates
const convertGW2Coords = (coords: [number, number] | undefined): [number, number] => {
  if (!coords || !Array.isArray(coords)) {
    console.warn('Invalid coordinates:', coords)
    return [0, 0]
  }
  return [-coords[1] / 128, coords[0] / 128]
}

onMounted(() => {
  try {
    if (!mapContainer.value) {
      throw new Error('Map container not found')
    }

    // Initialize map first
    map.value = L.map(mapContainer.value, {
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,
      crs: L.CRS.Simple,
      fadeAnimation: true,
      zoomAnimation: true,
      preferCanvas: true,
      attributionControl: false
    }).setView([0, 0], INITIAL_ZOOM)

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
    
    if (floorData?.regions) {
      Object.entries(floorData.regions).forEach(([regionId, region]: [string, any]) => {
        if (region.name && region.label_coord) {
          const [lat, lng] = convertGW2Coords(region.label_coord)
          L.marker([lat, lng], {
            icon: L.divIcon({
              className: 'region-label',
              html: region.name,
              iconSize: [0, 0],
              iconAnchor: [0, 0]
            })
          }).addTo(map.value as L.Map)
        }
      })
    }

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
  background-color: rgba(26, 26, 26, 0.8) !important;
  color: #fff !important;
  border: none !important;
}

:deep(.leaflet-control-zoom-in),
:deep(.leaflet-control-zoom-out) {
  border-bottom: 1px solid #333 !important;
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
</style>