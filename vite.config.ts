import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages처럼 하위 경로에 올릴 때 BASE_PATH=/TheCrimsonArc/ 로 빌드합니다.
const base = process.env.BASE_PATH ?? '/'

export default defineConfig({
  base,
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  build: {
    target: 'es2022',
    // three.js가 든 3D 조각은 첫 화면 뒤에 따로 받으므로 경고 기준을 넉넉히 둡니다.
    chunkSizeWarningLimit: 1100,
    rolldownOptions: {
      // 시계 쇼케이스, 편집기 소개, 스튜디오, 성능 비교, 404 페이지를 각각 HTML로 내보냅니다.
      // (render/는 시퀀스를 만드는 개발용 페이지라 넣지 않습니다)
      input: {
        main: 'index.html',
        editor: 'editor/index.html',
        studio: 'studio/index.html',
        bench: 'bench/index.html',
        notFound: '404.html',
      },
    },
  },
  worker: { format: 'es' },
  preview: { port: 4173 },
})
