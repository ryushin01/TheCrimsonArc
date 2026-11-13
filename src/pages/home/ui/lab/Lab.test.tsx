import { render, screen } from '@testing-library/react'
import { ROUTES } from '@/shared/config'
import { Lab } from './Lab'

describe('Lab', () => {
  it('성능 비교·편집기·스튜디오·Storybook으로 가는 링크를 둔다', () => {
    render(<Lab />)
    expect(
      screen.getByRole('link', { name: 'Canvas · DOM · SVG 성능 비교' }),
    ).toHaveAttribute('href', ROUTES.bench)
    expect(
      screen.getByRole('link', { name: '프레임 애니메이션 편집기 소개' }),
    ).toHaveAttribute('href', ROUTES.editor)
    expect(
      screen.getByRole('link', { name: 'Canvas 2D 픽셀 스튜디오' }),
    ).toHaveAttribute('href', ROUTES.studio)
    expect(screen.getAllByRole('listitem')).toHaveLength(4)
  })
})
