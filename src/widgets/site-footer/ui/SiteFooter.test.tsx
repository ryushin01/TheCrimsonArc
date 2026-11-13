import { render, screen } from '@testing-library/react'
import { SiteFooter } from './SiteFooter'

describe('SiteFooter', () => {
  it('바닥글 메뉴와 가상 제품 안내를 보여 준다', () => {
    render(<SiteFooter page="other" />)
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    expect(
      screen.getByRole('navigation', { name: 'Explore' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Export (GIF 내보내기)' }),
    ).toHaveAttribute('href', '/#export')
    expect(screen.getByText('가상의 제품입니다.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'GitHub 저장소' })).toHaveAttribute(
      'href',
      'https://github.com/ryushin01/TheCrimsonArc',
    )
  })
})
