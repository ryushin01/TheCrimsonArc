import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { DebugPanel, DebugToggle, debugInitiallyOpen } from './DebugPanel'

function Harness() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <DebugToggle
        open={open}
        panelId="debug"
        onToggle={() => setOpen((value) => !value)}
      />
      <DebugPanel id="debug" open={open} />
    </>
  )
}

describe('DebugPanel', () => {
  it('버튼이 패널을 열고 닫으며 aria-expanded로 알린다', async () => {
    render(<Harness />)
    const toggle = screen.getByRole('button', { name: 'Debug' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(toggle).toHaveAttribute('aria-controls', 'debug')
    expect(document.getElementById('debug')).not.toBeVisible()
    await userEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('region', { name: '디버그 패널' })).toBeVisible()
  })

  it('주소에 ?debug가 있으면 열린 채로 시작한다', () => {
    window.history.replaceState(null, '', '/?debug')
    expect(debugInitiallyOpen()).toBe(true)
    window.history.replaceState(null, '', '/')
    expect(debugInitiallyOpen()).toBe(false)
  })
})
