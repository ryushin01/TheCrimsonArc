import { render, screen } from '@testing-library/react'
import { Specs } from './Specs'

describe('Specs', () => {
  it('실제 기능 여섯 가지를 카드 제목으로 보여 준다', () => {
    render(<Specs />)
    expect(
      screen
        .getAllByRole('heading', { level: 3 })
        .map((heading) => heading.textContent),
    ).toEqual([
      '레이어 8장',
      '프레임 48장',
      'GIF89a 내보내기',
      '이미지 열기',
      '되돌리기 50단계',
      '키보드로 그리기',
    ])
  })
})
