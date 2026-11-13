import { render, screen, within } from '@testing-library/react'
import { ANATOMY_CAPTIONS } from '../../model/content'
import { Anatomy } from './Anatomy'

describe('Anatomy', () => {
  it('시퀀스 장면을 이미지로 설명하고 부품 설명을 순서대로 둔다', () => {
    render(<Anatomy />)
    expect(
      screen.getByRole('img', { name: /한 바퀴 돌아 케이스백/ }),
    ).toBeInTheDocument()
    const list = screen.getByRole('list')
    expect(
      within(list)
        .getAllByRole('heading', { level: 3 })
        .map((heading) => heading.textContent),
    ).toEqual(ANATOMY_CAPTIONS.map((caption) => caption.title))
  })

  it('설명마다 보일 스크롤 구간을 붙여 둔다', () => {
    render(<Anatomy />)
    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveAttribute('data-from', '0')
    expect(items.every((item) => item.dataset.active === 'false')).toBe(true)
  })
})
