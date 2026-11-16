import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChronoControls } from './ChronoControls'

describe('ChronoControls', () => {
  it('2시·4시 푸셔를 이름 있는 버튼 묶음으로 두고, 결과는 처음부터 있는 상태 영역에 알린다', async () => {
    const onStartStop = vi.fn()
    const onReset = vi.fn()
    const { rerender } = render(
      <ChronoControls
        running
        message=""
        onStartStop={onStartStop}
        onReset={onReset}
      />,
    )
    expect(
      screen.getByRole('group', { name: '크로노그래프' }),
    ).toBeInTheDocument()
    const status = screen.getByRole('status')
    expect(status).toBeEmptyDOMElement()
    await userEvent.click(screen.getByRole('button', { name: '2시 푸셔 정지' }))
    await userEvent.click(
      screen.getByRole('button', { name: '4시 푸셔 초기화' }),
    )
    expect(onStartStop).toHaveBeenCalledOnce()
    expect(onReset).toHaveBeenCalledOnce()
    rerender(
      <ChronoControls
        running={false}
        message="크로노그래프를 멈췄습니다. 3초"
        onStartStop={onStartStop}
        onReset={onReset}
      />,
    )
    // 글자가 바뀌므로 aria-pressed는 쓰지 않습니다.
    const button = screen.getByRole('button', { name: '2시 푸셔 시작' })
    expect(button).not.toHaveAttribute('aria-pressed')
    expect(screen.getByRole('status')).toBe(status)
    expect(status).toHaveTextContent('크로노그래프를 멈췄습니다. 3초')
  })
})
