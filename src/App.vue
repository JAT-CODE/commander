<script setup lang="ts">
import GW2Map from '@/components/GW2Map.vue'
import TimeBlock from '@/components/timeBlock.vue'
</script>

<template>
  <div class="app-container">
    <TimeBlock class="time-block" />
    <GW2Map />

  </div>
</template>

<style>
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
}

.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.time-block {
  position: fixed;
  bottom: 0;
  width: 100%;
  z-index: 1000;
}
</style>
