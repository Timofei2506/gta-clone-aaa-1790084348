import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    hmr: {
      clientPort: 443
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 4173
  },
  optimizeDeps: {
    exclude: ['@dimforge/rapier3d-compat']
  }
})
