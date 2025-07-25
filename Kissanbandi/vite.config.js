import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Enable network access
    port: 5173, // Default Vite port
    strictPort: true, // Don't try other ports if 5173 is taken
    proxy: {
      '/api': {
        target: 'https://bogat.onrender.com',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
