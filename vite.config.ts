import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  build: {
    target: 'es2022',
    // three.js가 든 3D 무대 조각은 첫 화면 뒤에 따로 받으므로 경고 기준을 넉넉히 둡니다.
    chunkSizeWarningLimit: 1100,
    rolldownOptions: {
      // 홍보 페이지, 스튜디오, 404 페이지를 각각 HTML로 내보냅니다.
      input: {
        main: 'index.html',
        studio: 'studio/index.html',
        notFound: '404.html',
      },
    },
  },
  worker: { format: 'es' },
  preview: { port: 4173 },
})
