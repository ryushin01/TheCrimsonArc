import { render, screen, within } from '@testing-library/react'
import { HomePage } from './HomePage'

describe('HomePage', () => {
  it('랜드마크와 제목 구조를 갖춘다', () => {
    render(<HomePage />)
    // testing-library는 섹션 안의 <header>까지 banner로 세므로, 주 메뉴를 품은 머리글이 본문 밖에 있는지로 봅니다.
    const siteHeader = screen
      .getByRole('navigation', { name: '주 메뉴' })
      .closest('header')
    expect(siteHeader).not.toBeNull()
    expect(siteHeader?.closest('main, section')).toBeNull()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveAccessibleName(
      'The Crimson Arc CA-01',
    )
    const main = screen.getByRole('main')
    expect(
      within(main)
        .getAllByRole('heading', { level: 2 })
        .map((heading) => heading.textContent),
    ).toEqual([
      '한 바퀴 돌고, 펼쳐 보기',
      '숫자로 보는 CA-01',
      '문자판부터 조명까지, 나만의 조합',
      'CA-01 사양',
      '쇼케이스 뒤의 실험실',
    ])
  })

  it('주 메뉴가 쇼케이스 구간으로 이어지고 Debug 버튼은 패널을 가리킨다', () => {
    render(<HomePage />)
    const nav = screen.getByRole('navigation', { name: '주 메뉴' })
    expect(
      within(nav).getByRole('link', { name: 'Anatomy (360도 분해)' }),
    ).toHaveAttribute('href', '#anatomy')
    const debug = screen.getByRole('button', { name: 'Debug' })
    expect(debug).toHaveAttribute('aria-expanded', 'false')
    expect(
      document.getElementById(debug.getAttribute('aria-controls')!),
    ).not.toBeNull()
  })
})
