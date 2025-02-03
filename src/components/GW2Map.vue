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

onMounted(() => {
  if (!map.value) {
    map.value = L.map('map', {
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,
      crs: L.CRS.Simple
    }).setView([0, 0], INITIAL_ZOOM)

    // Add coordinate display
    const CoordControl = L.Control.extend({
      onAdd: () => {
        const div = L.DomUtil.create('div', 'coordinate-display')
        div.style.cssText = 'background: rgba(255,255,255,0.8); padding: 4px 8px; border-radius: 4px;'
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

    L.tileLayer(`tiles/${CONTINENT_ID}/${FLOOR_ID}/{z}/{x}/{y}.jpg`, {
      tileSize: 256,
      noWrap: true
    }).on('tileloadstart', (event) => {
      console.log('Loading tile:', event.coords, 'URL:', event.target.getTileUrl(event.coords))
    }).addTo(map.value as L.Map)
  }
})
</script>

<template>
  <div id="map"></div>
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

/* Style the mouse position control */

:deep(.leaflet-control-mouseposition) {

background-color: rgba(255, 255, 255, 0.8);

padding: 4px 8px;

border-radius: 4px;

font-size: 12px;

color: #333;

}

</style>