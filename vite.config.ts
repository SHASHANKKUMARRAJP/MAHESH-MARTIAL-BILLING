import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['karate-icon.svg'],
      manifest: {
        short_name: "Karate Billing",
        name: "Mahesh Martial Arts - Karate Manager",
        icons: [
          {
            src: "/karate-icon.svg",
            type: "image/svg+xml",
            sizes: "192x192 512x512"
          }
        ],
        start_url: "/",
        background_color: "#0f172a",
        theme_color: "#ea580c",
        display: "standalone",
        orientation: "portrait",
        scope: "/"
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
