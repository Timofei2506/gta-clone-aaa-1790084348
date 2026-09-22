import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    cors: true,
    hmr: {
      clientPort: 443
    },
    // @ts-ignore - allow all hosts for E2B preview
    allowedHosts: true as any
  },
  preview: {
    host: '0.0.0.0',
    port: 4173
  },
  optimizeDeps: {
    exclude: ['@dimforge/rapier3d-compat']
  }
})
