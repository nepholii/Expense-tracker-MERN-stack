import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // default Vite port (you can change if needed)
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // backend URL
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
