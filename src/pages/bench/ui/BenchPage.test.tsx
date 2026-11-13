import { render, screen, within } from '@testing-library/react'
import { COUNTS, TECHNIQUES } from '../model/bench'
import { BenchPage } from './BenchPage'

describe('BenchPage', () => {
  it('입자 수를 행, 그리는 방식을 열로 하는 표를 둔다', () => {
    render(<BenchPage />)
    const table = screen.getByRole('table', { name: /그리는 방식별 평균 FPS/ })
    const headers = within(table)
      .getAllByRole('columnheader')
      .map((cell) => cell.textContent)
    expect(headers).toEqual([
      '입자 수',
      ...TECHNIQUES.map((technique) => technique.name),
    ])
    expect(within(table).getAllByRole('rowheader')).toHaveLength(COUNTS.length)
    expect(
      screen.getByRole('region', { name: /그리는 방식별 평균 FPS/ }),
    ).toHaveAttribute('tabindex', '0')
  })

  it('측정 버튼과 결과를 알리는 상태 영역을 처음부터 둔다', () => {
    render(<BenchPage />)
    expect(
      screen.getByRole('button', { name: '측정 시작 (약 30초)' }),
    ).toBeEnabled()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})
