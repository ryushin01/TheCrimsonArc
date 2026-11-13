import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NewArtworkDialog, validateField } from './NewArtworkDialog'

describe('NewArtworkDialog', () => {
  it('validateField는 원인과 방법을 알려 준다', () => {
    expect(validateField('너비', '', 8, 256)).toBe(
      '너비을(를) 입력하세요. 8에서 256 사이의 정수입니다.',
    )
    expect(validateField('너비', '3.5', 8, 256)).toContain(
      '8에서 256 사이의 정수로 입력하세요',
    )
    expect(validateField('너비', '64', 8, 256)).toBeNull()
  })

  it('잘못된 값은 aria-invalid와 설명으로 알리고, 고치면 만든다', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn()
    render(<NewArtworkDialog open onClose={vi.fn()} onCreate={onCreate} />)
    const width = screen.getByRole('spinbutton', { name: '너비' })
    expect(width).not.toHaveAttribute('aria-invalid')

    await user.clear(width)
    await user.type(width, '999')
    await user.click(screen.getByRole('button', { name: '만들기' }))
    expect(onCreate).not.toHaveBeenCalled()
    expect(width).toHaveAttribute('aria-invalid', 'true')
    expect(width).toHaveAccessibleDescription(
      /너비은\(는\) 8에서 256 사이의 정수로 입력하세요/,
    )
    expect(width).toHaveFocus()

    await user.click(screen.getByRole('button', { name: '32×32' }))
    await user.click(screen.getByRole('button', { name: '만들기' }))
    expect(onCreate).toHaveBeenCalledWith({ width: 32, height: 32, fps: 12 })
  })
})
