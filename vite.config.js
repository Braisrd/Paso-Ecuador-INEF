import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

import legacy from '@vitejs/plugin-legacy'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    legacy({
      targets: ['defaults', 'not IE 11'],
    }),
  ],
  build: {
    // Modern bundle also needs to be safe for slightly older browsers
    target: ['es2015', 'safari11', 'ios11'],
    cssTarget: 'safari11',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        pure_funcs: ['console.info', 'console.debug']
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          firebase: ['firebase/app', 'firebase/firestore', 'firebase/storage', 'firebase/messaging'],
          vendor: ['react', 'react-dom', 'react-router-dom', 'lucide-react']
        }
      }
    }
  },
})
