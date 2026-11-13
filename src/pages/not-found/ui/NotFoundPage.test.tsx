import { render, screen } from '@testing-library/react'
import { NotFoundPage } from './NotFoundPage'

describe('NotFoundPage', () => {
  it('제목과 돌아갈 링크를 보여 준다', () => {
    render(<NotFoundPage />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveAccessibleName(
      '404: Frame not found',
    )
    expect(screen.getByRole('link', { name: '첫 화면으로' })).toHaveAttribute(
      'href',
      '/',
    )
    expect(screen.getByRole('main')).toBeInTheDocument()
  })
})
