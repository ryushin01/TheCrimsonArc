import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Colors, describeConfig } from './Colors'

describe('Colors', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/')
    vi.restoreAllMocks()
  })
  it('지금 조합을 상태 메시지와 3D 무대 이름으로 알려 준다', async () => {
    render(<Colors />)
    // 무대 안내와 조합 설명, 상태 영역이 둘이라 조합 설명을 글로 찾습니다.
    const status = screen.getByText(
      /매트 블랙 문자판, 비드블라스트 스틸 케이스/,
    )
    expect(status).toHaveAttribute('role', 'status')
    expect(status).toHaveTextContent(
      '매트 블랙 문자판, 비드블라스트 스틸 케이스',
    )
    await userEvent.click(screen.getByRole('radio', { name: '딥 네이비' }))
    await userEvent.click(screen.getByRole('radio', { name: '야광' }))
    expect(status).toHaveTextContent('딥 네이비 문자판')
    expect(status).toHaveTextContent('야광 조명')
    expect(
      screen.getByRole('img', { name: /딥 네이비 문자판.*A-01 \(앞면\)/ }),
    ).toBeInTheDocument()
  })

  it('보는 방향을 바꾸면 무대 이름에 반영한다', async () => {
    render(<Colors />)
    await userEvent.click(screen.getByRole('radio', { name: '뒷면' }))
    expect(screen.getByRole('img', { name: /\(뒷면\)$/ })).toBeInTheDocument()
  })

  it('공유 주소로 들어오면 그 조합으로 시작한다', () => {
    window.history.replaceState(
      null,
      '',
      '/?dial=crimson&strap=bracelet&view=side',
    )
    render(<Colors />)
    expect(screen.getByRole('radio', { name: '크림슨 래커' })).toBeChecked()
    expect(
      screen.getByRole('radio', { name: 'H-링크 브레이슬릿' }),
    ).toBeChecked()
    expect(screen.getByRole('radio', { name: '옆면' })).toBeChecked()
  })

  it('고른 조합을 기록을 늘리지 않고 주소에 담는다', async () => {
    window.history.replaceState(null, '', '/#colors')
    const length = window.history.length
    render(<Colors />)
    await userEvent.click(screen.getByRole('radio', { name: '블랙 DLC' }))
    await userEvent.click(screen.getByRole('radio', { name: '뒷면' }))
    expect(window.location.search).toBe('?case=dlc&view=back')
    expect(window.location.hash).toBe('#colors')
    expect(window.history.length).toBe(length)
    await userEvent.click(
      screen.getByRole('radio', { name: '비드블라스트 스틸' }),
    )
    await userEvent.click(screen.getByRole('radio', { name: '앞면' }))
    expect(window.location.search).toBe('')
  })

  it('조합 링크를 복사하고 결과를 알린다', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    render(<Colors />)
    await user.click(screen.getByRole('radio', { name: '노을' }))
    await user.click(screen.getByRole('button', { name: '조합 링크 복사' }))
    expect(writeText).toHaveBeenCalledWith(
      `${window.location.origin}/?light=sunset#colors`,
    )
    await waitFor(() =>
      expect(screen.getByText(/조합 링크를 복사했습니다/)).toHaveAttribute(
        'role',
        'status',
      ),
    )
  })

  it('복사하지 못하면 주소 표시줄을 쓰라고 알린다', async () => {
    const user = userEvent.setup()
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    })
    render(<Colors />)
    await user.click(screen.getByRole('button', { name: '조합 링크 복사' }))
    expect(
      await screen.findByText(/주소 표시줄의 주소를 복사해 주세요/),
    ).toBeInTheDocument()
  })

  it('2시 푸셔로 크로노그래프를 멈추고 시작하며, 4시 푸셔로 0으로 되돌린다', async () => {
    const user = userEvent.setup()
    render(<Colors />)
    // 움직임이 켜져 있으면 처음에는 도는 중입니다.
    const startStop = screen.getByRole('button', { name: '2시 푸셔 정지' })
    await user.click(startStop)
    expect(startStop).toHaveAccessibleName('2시 푸셔 시작')
    expect(
      screen.getByText(/크로노그래프를 멈췄습니다\. \d+(분 \d+)?초/),
    ).toHaveAttribute('role', 'status')
    await user.click(screen.getByRole('button', { name: '4시 푸셔 초기화' }))
    expect(
      screen.getByText('크로노그래프를 0으로 되돌렸습니다.'),
    ).toBeInTheDocument()
    await user.click(startStop)
    expect(startStop).toHaveAccessibleName('2시 푸셔 정지')
    await user.click(screen.getByRole('button', { name: '4시 푸셔 초기화' }))
    expect(screen.getByText(/플라이백/)).toBeInTheDocument()
  })

  it('조합을 한 문장으로 설명한다', () => {
    expect(
      describeConfig({
        dial: 'snow',
        case: 'dlc',
        strap: 'crimson',
        light: 'sunset',
      }),
    ).toBe('스노우 화이트 문자판, 블랙 DLC 케이스, 크림슨 가죽, 노을 조명')
  })
})
