import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ShareLink } from './ShareLink'

describe('ShareLink', () => {
  it('주소를 복사하고, 같은 결과가 이어져도 다시 읽히게 알린다', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    render(<ShareLink url="https://example.com/?dial=navy#colors" />)
    const button = screen.getByRole('button', { name: '조합 링크 복사' })
    const status = screen.getByRole('status')
    await user.click(button)
    expect(writeText).toHaveBeenCalledWith(
      'https://example.com/?dial=navy#colors',
    )
    const first = status.textContent
    expect(first).toContain('조합 링크를 복사했습니다.')
    await user.click(button)
    expect(status.textContent).toContain('조합 링크를 복사했습니다.')
    expect(status.textContent).not.toBe(first)
  })
})
