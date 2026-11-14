import { render, screen } from '@testing-library/react'
import { Logo } from './Logo'

describe('Logo', () => {
  it('링크 안에서 워드마크가 이름이 되고 심볼은 보조기기에서 숨긴 꾸밈이다', () => {
    const { container } = render(
      <a href="/">
        <Logo />
      </a>,
    )
    expect(screen.getByRole('link')).toHaveAccessibleName('The Crimson Arc')
    expect(container.querySelector('svg')).toHaveAttribute(
      'aria-hidden',
      'true',
    )
  })
})
