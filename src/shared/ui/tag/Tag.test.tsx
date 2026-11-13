import { render, screen } from '@testing-library/react'
import { Tag } from './Tag'

describe('Tag', () => {
  it('번호와 라벨을 읽히게 하고 장식 막대는 숨긴다', () => {
    const { container } = render(<Tag index="03">Export</Tag>)
    expect(screen.getByText('03')).toBeInTheDocument()
    expect(screen.getByText('Export')).toHaveAttribute('lang', 'en')
    expect(
      container.querySelector('[aria-hidden="true"]'),
    ).toBeEmptyDOMElement()
  })
})
