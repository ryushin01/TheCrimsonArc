import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TuningPanel } from './TuningPanel'

describe('TuningPanel', () => {
  it('버튼이 패널의 펼침 상태를 알리고, 열면 lil-gui를 불러온다', async () => {
    const user = userEvent.setup()
    render(<TuningPanel />)
    const toggle = screen.getByRole('button', { name: '튜닝' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    const panel = screen.getByRole('region', { name: '3D 튜닝 패널' })
    expect(
      await screen.findByRole('button', { name: 'Arc tuning · lil-gui' }),
    ).toBeInTheDocument()
    expect(panel).toBeVisible()
    await user.click(toggle)
    expect(panel).not.toBeVisible()
  })
})
