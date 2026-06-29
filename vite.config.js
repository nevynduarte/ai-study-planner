import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    // Split vendor dependencies into separate chunks so app-code deploys don't
    // bust the cache for unchanged React/markdown libraries.  Cloudflare's
    // asset serving (ASSETS binding) sets long-TTL Cache-Control on hashed
    // filenames, so these chunks stay cached at the CDN edge and in the browser
    // until the underlying package versions actually change.
    rollupOptions: {
      output: {
        manualChunks: {
          // React runtime — almost never updates between deploys
          'vendor-react': ['react', 'react-dom'],
          // Markdown pipeline — large but stable; isolated from app-code churn
          'vendor-md': ['react-markdown', 'remark-gfm'],
        },
      },
    },
  },
})
