import '../styles/index.css'
import { StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { showFontLoader } from '../lib/fontLoader'

/** HTML의 #root에 페이지를 그립니다. */
export function mount(page: ReactNode): void {
  const root = document.getElementById('root')
  if (!root) throw new Error('#root 요소가 없습니다.')
  // 한글 에스코어드림(통파일, 굵기마다 약 350KB): 다 받을 때까지 로딩 화면을 덮음. 그동안 페이지는 뒤에서 그려 둠
  void showFontLoader(`${import.meta.env.BASE_URL}fonts/s-core-dream.css`)
  createRoot(root).render(<StrictMode>{page}</StrictMode>)
}
