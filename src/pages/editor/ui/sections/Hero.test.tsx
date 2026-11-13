import { render, screen } from '@testing-library/react'
import { Hero } from './Hero'

describe('Hero', () => {
  it('브랜드 이름이 들어간 h1과 스튜디오·둘러보기 링크를 보여 준다', () => {
    render(<Hero />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveAccessibleName(
      'The Crimson Arc: Draw in layers Move in frames',
    )
    expect(screen.getByRole('link', { name: '스튜디오 열기' })).toHaveAttribute(
      'href',
      '/studio/',
    )
    expect(screen.getByRole('link', { name: '둘러보기' })).toHaveAttribute(
      'href',
      '#about',
    )
  })
})
