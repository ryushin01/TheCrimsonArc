import { render, screen } from '@testing-library/react'
import { Launch } from './Launch'

describe('Launch', () => {
  it('흐르는 글자는 숨기고 제목과 링크만 읽힌다', () => {
    const { container } = render(<Launch />)
    expect(screen.getByRole('heading', { level: 2 })).toHaveAccessibleName(
      'Start your first frame',
    )
    expect(screen.getByRole('link', { name: '스튜디오 열기' })).toHaveAttribute(
      'href',
      '/studio/',
    )
    expect(container.querySelector('[aria-hidden="true"]')).toHaveTextContent(
      'Crimson Arc',
    )
  })
})
