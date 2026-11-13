import { render, screen } from '@testing-library/react'
import { DisplayHeading } from './DisplayHeading'

describe('DisplayHeading', () => {
  it('줄 사이에 공백을 넣어 제목 이름이 자연스럽게 읽힌다', () => {
    render(
      <DisplayHeading as="h1" lines={['Draw in layers', 'Move in frames']} />,
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveAccessibleName(
      'Draw in layers Move in frames',
    )
  })

  it('숨긴 접두어를 제목 이름 앞에 붙인다', () => {
    render(
      <DisplayHeading lines={['Draw in layers']} prefix="The Crimson Arc:" />,
    )
    expect(screen.getByRole('heading', { level: 2 })).toHaveAccessibleName(
      'The Crimson Arc: Draw in layers',
    )
  })
})
