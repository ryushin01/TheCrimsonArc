import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EDITOR_SECTIONS, PRODUCT_SECTIONS, sectionNav } from '@/shared/config'
import { SiteHeader } from './SiteHeader'

describe('SiteHeader', () => {
  it('본문 바로가기가 맨 앞에 있고 주 메뉴는 제목으로 이름 붙는다', async () => {
    const user = userEvent.setup()
    render(<SiteHeader page="home" nav={sectionNav(PRODUCT_SECTIONS)} />)
    await user.tab()
    expect(screen.getByRole('link', { name: '본문 바로가기' })).toHaveFocus()
    expect(
      screen.getByRole('navigation', { name: '주 메뉴' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Anatomy (360도 분해)' }),
    ).toHaveAttribute('href', '#anatomy')
    expect(
      screen.getByRole('link', { name: 'The Crimson Arc' }),
    ).toHaveAttribute('aria-current', 'page')
  })

  it('다른 페이지의 섹션과 지금 페이지 강조 링크를 표시한다', () => {
    render(
      <SiteHeader
        page="studio"
        nav={sectionNav(EDITOR_SECTIONS, '/editor/')}
        cta={{
          href: '/studio/',
          label: 'Studio',
          title: '스튜디오',
          current: true,
        }}
      />,
    )
    expect(
      screen.getByRole('link', { name: 'Frames (프레임)' }),
    ).toHaveAttribute('href', '/editor/#frames')
    expect(
      screen.getByRole('link', { name: 'Studio (스튜디오)' }),
    ).toHaveAttribute('aria-current', 'page')
  })

  it('모바일 메뉴 버튼은 펼침 상태를 알리고 Esc로 닫힌다', async () => {
    const user = userEvent.setup()
    render(<SiteHeader page="home" nav={sectionNav(PRODUCT_SECTIONS)} />)
    const button = screen.getByRole('button', { name: '메뉴' })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    await user.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    await user.keyboard('{Escape}')
    expect(button).toHaveAttribute('aria-expanded', 'false')
  })

  it('움직임 버튼은 글자로 상태를 바꿔 알린다', async () => {
    const user = userEvent.setup()
    render(<SiteHeader page="home" nav={[]} showMotionToggle />)
    const toggle = screen.getByRole('button', { name: /움직임 (멈춤|재생)/ })
    const before = toggle.textContent
    await user.click(toggle)
    expect(toggle.textContent).not.toBe(before)
    expect(toggle).not.toHaveAttribute('aria-pressed')
  })

  it('페이지 전용 버튼을 강조 링크 앞에 넣는다', () => {
    render(
      <SiteHeader
        page="home"
        nav={[]}
        cta={{
          href: '#colors',
          label: 'Configure',
          title: '색 고르기',
          icon: 'chevron-down',
        }}
        actions={<button type="button">Debug</button>}
      />,
    )
    const debug = screen.getByRole('button', { name: 'Debug' })
    const cta = screen.getByRole('link', { name: 'Configure (색 고르기)' })
    expect(cta).toHaveAttribute('href', '#colors')
    expect(
      debug.compareDocumentPosition(cta) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })
})
