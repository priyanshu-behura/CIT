import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // SpaceUI/Base UI components use Tailwind v4 CSS custom functions (--spacing())
    // which lightningcss (Vite 8 default) cannot parse. Disable CSS minification
    // to avoid build failures. JS/HTML are still minified normally.
    cssMinify: false,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
