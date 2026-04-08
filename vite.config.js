import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_DEV_PROXY_TARGET || 'http://localhost:8080'
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/admin/upload': {
          target: env.VITE_ADMIN_SERVICE_URL || 'http://localhost:8082',
          changeOrigin: true,
        },
        '/uploads': {
          target: env.VITE_ADMIN_SERVICE_URL || 'http://localhost:8082',
          changeOrigin: true,
        },
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
