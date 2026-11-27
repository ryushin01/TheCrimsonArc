import '../styles/index.css'
import { StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { showFontLoader } from '../lib/fontLoader'
import { registerServiceWorker } from '../lib/serviceWorker'

/** HTML의 #root에 페이지를 그립니다. */
export function mount(page: ReactNode): void {
  const root = document.getElementById('root')
  if (!root) throw new Error('#root 요소가 없습니다.')
  // 한글 에스코어드림(통파일, 굵기마다 약 350KB): 다 받을 때까지 로딩 화면을 덮음. 그동안 페이지는 뒤에서 그려 둠
  // (파일은 HTML의 <link rel="preload">로 이미 받기 시작했습니다. vite.config.ts의 preloadKoreanFont)
  void showFontLoader(`${import.meta.env.BASE_URL}fonts/s-core-dream.css`)
  createRoot(root).render(<StrictMode>{page}</StrictMode>)
  // 한 번 들어온 뒤에는 인터넷이 끊겨도 모든 페이지가 뜨게 합니다(개발 서버에는 sw.js가 없음).
  if (import.meta.env.PROD) registerServiceWorker(import.meta.env.BASE_URL)
}
