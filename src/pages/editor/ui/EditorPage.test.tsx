import { render, screen, within } from '@testing-library/react'
import { EditorPage } from './EditorPage'

describe('EditorPage', () => {
  it('편집기 소개의 제목과 데모 구간을 순서대로 둔다', () => {
    render(<EditorPage />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveAccessibleName(
      'The Crimson Arc: Draw in layers Move in frames',
    )
    const main = screen.getByRole('main')
    for (const id of ['layers', 'frames', 'export', 'open']) {
      expect(main.querySelector(`#${id}`)).not.toBeNull()
    }
    const nav = screen.getByRole('navigation', { name: '주 메뉴' })
    expect(
      within(nav).getByRole('link', { name: 'Frames (프레임)' }),
    ).toHaveAttribute('href', '#frames')
  })
})
