import '../styles/index.css'
import { StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'

/** HTML의 #root에 페이지를 그립니다. */
export function mount(page: ReactNode): void {
  const root = document.getElementById('root')
  if (!root) throw new Error('#root 요소가 없습니다.')
  createRoot(root).render(<StrictMode>{page}</StrictMode>)
}
