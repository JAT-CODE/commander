<script setup lang="ts">
import { onMounted, ref } from 'vue'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// GW2-specific constants
const CONTINENT_ID = 1  // Tyria
const FLOOR_ID = 1     // Main level
const MIN_ZOOM = 0
const MAX_ZOOM = 7
const INITIAL_ZOOM = 4

const map = ref<L.Map | null>(null)
const isLoading = ref(true)

onMounted(() => {
  if (!map.value) {
    map.value = L.map('map', {
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,
      crs: L.CRS.Simple,
      fadeAnimation: true,
      zoomAnimation: true,
      preferCanvas: true,
      attributionControl: false
    }).setView([0, 0], INITIAL_ZOOM)

    // Add coordinate display
    const CoordControl = L.Control.extend({
      onAdd: () => {
        const div = L.DomUtil.create('div', 'coordinate-display')
        div.style.cssText = 'background: rgba(26, 26, 26, 0.8); padding: 4px 8px; border-radius: 4px; color: #fff;'
        return div
      }
    })
    const coordDisplay = new CoordControl({ position: 'topright' })
    coordDisplay.addTo(map.value as L.Map)

    map.value.on('mousemove', (e) => {
      const div = document.querySelector('.coordinate-display')
      if (div) {
        div.textContent = `Coordinates: ${Math.round(e.latlng.lng * 128)} | ${Math.round(-e.latlng.lat * 128)}`
      }
    })

    const tileLayer = L.tileLayer(`tiles/${CONTINENT_ID}/${FLOOR_ID}/{z}/{x}/{y}.jpg`, {
      tileSize: 256,
      noWrap: true,
      keepBuffer: 2,
      updateWhenIdle: true,
      updateWhenZooming: false,
      maxNativeZoom: MAX_ZOOM,
      attribution: ''
    })

    // Loading events
    tileLayer.on('loading', () => { isLoading.value = true })
    tileLayer.on('load', () => { isLoading.value = false })

    tileLayer.addTo(map.value as L.Map)
  }
})
</script>

<template>
  <div id="map">
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <div class="loading-text">Loading map...</div>
    </div>
  </div>
</template>

<style scoped>
#map {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #242424;
}

.loading-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #333;
  border-top: 3px solid #646cff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 8px;
}

.loading-text {
  color: #fff;
  font-size: 12px;
  text-align: center;
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
</style>