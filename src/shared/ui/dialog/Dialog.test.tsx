import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { Dialog } from './Dialog'

function Harness() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        열기
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="새로 만들기"
        description="크기를 정합니다."
      >
        <p>본문</p>
      </Dialog>
    </>
  )
}

describe('Dialog', () => {
  it('제목·설명으로 이름 붙고, 닫으면 연 버튼으로 초점이 돌아간다', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const opener = screen.getByRole('button', { name: '열기' })
    await user.click(opener)
    const dialog = screen.getByRole('dialog', { name: '새로 만들기' })
    expect(dialog).toHaveAccessibleDescription('크기를 정합니다.')
    expect(dialog).toHaveAttribute('open')

    await user.click(screen.getByRole('button', { name: '닫기' }))
    expect(dialog).not.toHaveAttribute('open')
    expect(opener).toHaveFocus()
  })
})
