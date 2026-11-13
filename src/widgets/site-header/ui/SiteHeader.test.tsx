import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SiteHeader } from './SiteHeader'

describe('SiteHeader', () => {
  it('본문 바로가기가 맨 앞에 있고 주 메뉴는 제목으로 이름 붙는다', async () => {
    const user = userEvent.setup()
    render(<SiteHeader page="home" />)
    await user.tab()
    expect(screen.getByRole('link', { name: '본문 바로가기' })).toHaveFocus()
    const nav = screen.getByRole('navigation', { name: '주 메뉴' })
    expect(nav).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Layers (레이어)' }),
    ).toHaveAttribute('href', '#layers')
  })

  it('다른 페이지에서는 홍보 페이지의 섹션으로 연결하고 현재 페이지를 표시한다', () => {
    render(<SiteHeader page="studio" />)
    expect(
      screen.getByRole('link', { name: 'Frames (프레임)' }),
    ).toHaveAttribute('href', '/#frames')
    expect(screen.getByRole('link', { name: 'Studio' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('모바일 메뉴 버튼은 펼침 상태를 알리고 Esc로 닫힌다', async () => {
    const user = userEvent.setup()
    render(<SiteHeader page="home" />)
    const button = screen.getByRole('button', { name: '메뉴' })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    await user.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    await user.keyboard('{Escape}')
    expect(button).toHaveAttribute('aria-expanded', 'false')
  })

  it('움직임 버튼은 글자로 상태를 바꿔 알린다', async () => {
    const user = userEvent.setup()
    render(<SiteHeader page="home" showMotionToggle />)
    const toggle = screen.getByRole('button', { name: /움직임 (멈춤|재생)/ })
    const before = toggle.textContent
    await user.click(toggle)
    expect(toggle.textContent).not.toBe(before)
    expect(toggle).not.toHaveAttribute('aria-pressed')
  })
})
