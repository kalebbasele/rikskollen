import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/riksdagen': {
        target: 'https://data.riksdagen.se',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/riksdagen/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Origin', 'https://data.riksdagen.se')
          })
        },
      },
    },
  },
})
