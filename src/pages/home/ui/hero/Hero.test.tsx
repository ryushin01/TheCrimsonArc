import { act, render, screen } from '@testing-library/react'
import { loadStore } from '../../model/load-store'
import { Hero } from './Hero'

describe('Hero', () => {
  beforeEach(() => loadStore.reset())

  it('제품 이름을 h1으로 두고 시퀀스 구간으로 가는 링크를 준다', () => {
    render(<Hero />)
    expect(
      screen.getByRole('heading', { level: 1, name: 'The Crimson Arc A-01' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: '스크롤해서 살펴보기' }),
    ).toHaveAttribute('href', '#anatomy')
  })

  it('받는 동안만 진행률을 보조기기에 알려 준다', () => {
    render(<Hero />)
    act(() => loadStore.set({ progress: 0.42 }))
    expect(
      screen.getByRole('progressbar', { name: '제품 이미지 불러오기' }),
    ).toHaveAttribute('value', '42')
    act(() => loadStore.set({ progress: 1, done: true }))
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })
})
