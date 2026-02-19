import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    target: ['es2015', 'safari11', 'ios11'],
    cssTarget: ['chrome61', 'firefox60', 'safari11', 'edge18'],
  },
})
