import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Ensure this proxy configuration is correct
    proxy: {
      '/api': {
        target: 'http://localhost:8080', 
        changeOrigin: true, // <-- Important for some backend frameworks
      },
      // Also proxy WebSocket connections
      '/ws': {
        target: 'http://localhost:8080', 
        ws: true, // <-- Enable WebSocket proxying
        changeOrigin: true,
      },
    },
  },
});