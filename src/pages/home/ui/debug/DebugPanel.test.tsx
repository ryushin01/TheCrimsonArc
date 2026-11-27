import { act, render, screen } from '@testing-library/react'
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

  it('열려 있으면 메인 스레드 FPS와 첫 화면 그리는 곳을 0.5초마다 새로 보여 준다', async () => {
    // 프레임만 가짜 시계로 돌려, 실제 시간이 얼마나 흘렀는지와 상관없이 0.5초 갱신을 늘 거칩니다.
    vi.useFakeTimers({
      toFake: ['requestAnimationFrame', 'cancelAnimationFrame'],
    })
    try {
      render(<DebugPanel id="debug" open />)
      const mode = await screen.findByRole('textbox', {
        name: '첫 화면 그리는 곳',
      })
      const fps = screen.getByRole('textbox', { name: '메인 스레드 FPS' })
      expect(mode).toHaveDisplayValue('-')
      act(() => {
        vi.advanceTimersByTime(1200)
      })
      // 첫 화면 캔버스를 띄우지 않았으므로 '멈춤', FPS는 가짜 프레임(약 60fps)으로 잰 값입니다.
      expect(mode).toHaveDisplayValue('멈춤')
      expect(fps).toHaveDisplayValue(/^[1-9]\d*$/)
    } finally {
      vi.useRealTimers()
    }
  })

  it('lil-gui를 받기 전에 사라지면 패널을 만들지 않는다', async () => {
    const { unmount } = render(<DebugPanel id="debug" open />)
    unmount()
    // 컴포넌트가 부른 것과 같은 모듈 요청이 끝난 뒤(같은 약속)까지 기다립니다.
    await import('lil-gui')
    await act(async () => {})
    expect(screen.queryByText('Debug · lil-gui')).not.toBeInTheDocument()
  })

  it('주소에 ?debug가 있으면 열린 채로 시작한다', () => {
    window.history.replaceState(null, '', '/?debug')
    expect(debugInitiallyOpen()).toBe(true)
    window.history.replaceState(null, '', '/')
    expect(debugInitiallyOpen()).toBe(false)
  })
})
