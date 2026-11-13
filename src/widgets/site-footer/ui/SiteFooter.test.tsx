import { render, screen } from '@testing-library/react'
import { SiteFooter } from './SiteFooter'

describe('SiteFooter', () => {
  it('제품 섹션, 실험실 링크, 가상 제품 안내를 보여 준다', () => {
    render(<SiteFooter page="editor" />)
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    expect(
      screen.getByRole('navigation', { name: 'Explore' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Colors (색·재질)' }),
    ).toHaveAttribute('href', '/#colors')
    expect(
      screen.getByRole('link', {
        name: 'Editor (프레임 애니메이션 편집기 소개)',
      }),
    ).toHaveAttribute('aria-current', 'page')
    expect(screen.getByText('가상의 제품입니다.')).toBeInTheDocument()
  })

  it('실험실 메뉴에 성능 비교 페이지를 두고 지금 페이지를 표시한다', () => {
    render(<SiteFooter page="bench" />)
    expect(
      screen.getByRole('link', { name: 'Bench (Canvas·DOM·SVG 성능 비교)' }),
    ).toHaveAttribute('aria-current', 'page')
  })
})
