import { render, screen, within } from '@testing-library/react'
import { SPEC_GROUPS } from '../../model/content'
import { Specs } from './Specs'

describe('Specs', () => {
  it('사양 묶음마다 제목과 이름-값 목록을 둔다', () => {
    render(<Specs />)
    for (const group of SPEC_GROUPS) {
      const region = screen.getByRole('region', { name: group.title })
      expect(within(region).getAllByRole('term')).toHaveLength(
        group.items.length,
      )
      expect(within(region).getAllByRole('definition')).toHaveLength(
        group.items.length,
      )
    }
    expect(screen.getByText('28,800vph (4Hz)')).toBeInTheDocument()
  })

  it('가상의 제품임을 밝힌다', () => {
    render(<Specs />)
    expect(screen.getByText(/가상의 제품입니다/)).toBeInTheDocument()
  })
})
