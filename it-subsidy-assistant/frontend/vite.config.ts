import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      input: './index.html'
    }
  },
  server: {
    host: true, // 0.0.0.0でリッスン（ネットワーク内のすべてのインターフェース）
    port: 5173,
    strictPort: false,
    open: '/',
    // SPAフォールバック設定 - すべてのルートをindex.htmlに転送
    middlewareMode: false,
    fs: {
      strict: false
    }
  },
  // プレビューサーバーでもSPAフォールバックを有効化
  preview: {
    port: 5173
  }
})
