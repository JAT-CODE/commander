<script setup lang="ts">
import GW2Map from './components/GW2Map.vue'
</script>

<template>
  <div class="container">
    <div class="map-container">
      <GW2Map />
    </div>
  </div>
</template>

<style scoped>
.container {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.map-container {
  flex: 1;
  width: 100%;
  position: relative;
}

h1 {
  padding: 1rem;
  margin: 0;
}
</style>
