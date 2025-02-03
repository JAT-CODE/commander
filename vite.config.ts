import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  server: {
    fs: {
      // Allow serving files from one level up from the package root
      allow: ['..'],
      // Exclude the tiles directory from file watching
      strict: false
    },
    watch: {
      // Exclude tiles from being watched
      ignored: ['**/public/tiles/**']
    }
  }
}) 