import { render, screen } from '@testing-library/react'
import { Process } from './Process'

describe('Process', () => {
  it('네 단계 목차가 각 섹션으로 연결된다', () => {
    render(<Process />)
    const links = screen.getAllByRole('link')
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '#layers',
      '#frames',
      '#export',
      '#open',
    ])
  })
})
