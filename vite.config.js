import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Backend her istekte data/db.json'ı yeniden yazıyor. Bu dosya istemci modül
    // grafiğinde olmasa da Vite'ın izleyicisini tetikleyip sayfayı komple
    // yeniliyor; bu da seçili odayı, bulunulan katı ve form durumunu sıfırlıyor.
    watch: {
      ignored: ['**/data/**'],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
})
