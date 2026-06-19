import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: '../frontend/public',
    emptyOutDir: false,
    lib: {
      entry: 'src/widget.js',
      name: 'ChatPlatformWidget',
      fileName: () => 'widget.js',
      formats: ['iife'],   // Self-contained — no module import needed
    },
    rollupOptions: {
      // No external deps — everything bundled in
    },
    minify: true,
  },
})
