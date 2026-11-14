import { render, screen } from '@testing-library/react'
import { DETAIL_STEPS } from '../../model/content'
import { Details } from './Details'

describe('Details', () => {
  it('단계를 순서 목록으로 두고 처음 단계를 지금 단계로 표시한다', () => {
    render(<Details />)
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(DETAIL_STEPS.length)
    expect(items[0]).toHaveAttribute('aria-current', 'step')
    expect(items[1]).not.toHaveAttribute('aria-current')
  })

  it('입자 무대를 지금 모양으로 설명한다', () => {
    render(<Details />)
    expect(
      screen.getByRole('img', { name: '입자로 그린 A-01 시계 실루엣' }),
    ).toBeInTheDocument()
  })
})
