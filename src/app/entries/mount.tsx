import '../styles/index.css'
import { StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { attachFonts } from '../lib/attachFonts'

/** HTML의 #root에 페이지를 그립니다. */
export function mount(page: ReactNode): void {
  const root = document.getElementById('root')
  if (!root) throw new Error('#root 요소가 없습니다.')
  createRoot(root).render(<StrictMode>{page}</StrictMode>)
  // 한글 에스코어드림(통파일, 굵기마다 약 350KB)은 첫 화면 뒤에 붙임
  attachFonts(`${import.meta.env.BASE_URL}fonts/s-core-dream.css`)
}
