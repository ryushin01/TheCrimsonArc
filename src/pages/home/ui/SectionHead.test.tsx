import { render, screen } from '@testing-library/react'
import { SectionHead } from './SectionHead'

describe('SectionHead', () => {
  it('영문 번호 줄과 h2 제목, 소개 문장을 그린다', () => {
    render(
      <SectionHead
        id="t"
        eyebrow="02 · Details"
        title="숫자로 보는 A-01"
        lead="소개"
      />,
    )
    const heading = screen.getByRole('heading', {
      level: 2,
      name: '숫자로 보는 A-01',
    })
    expect(heading).toHaveAttribute('id', 't')
    expect(screen.getByText('02 · Details')).toHaveAttribute('lang', 'en')
    expect(screen.getByText('소개')).toBeInTheDocument()
  })
})
