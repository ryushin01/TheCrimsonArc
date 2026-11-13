import { render, screen, within } from '@testing-library/react'
import { About } from './About'

describe('About', () => {
  it('네 기능 주석을 순서 있는 목록과 제목으로 읽힌다', () => {
    render(<About />)
    expect(screen.getByRole('heading', { level: 2 })).toHaveAccessibleName(
      'What is Crimson Arc?',
    )
    const items = within(screen.getByRole('list')).getAllByRole('listitem')
    expect(items).toHaveLength(4)
    expect(
      screen.getByRole('heading', { level: 3, name: '한 번에 내보내는 GIF' }),
    ).toBeInTheDocument()
  })
})
