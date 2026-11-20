import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { INTRO_SEEN_KEY } from '../../lib/intro'
import { INTRO_ENTER_MS, Intro } from './Intro'

async function openIntro(onDone = vi.fn()) {
  render(<Intro onDone={onDone} />)
  const dialog = await screen.findByRole('dialog', { name: 'The Crimson Arc' })
  await screen.findByRole('img', {
    name: '매트 블랙 문자판, 비드블라스트 스틸 케이스, 블랙 가죽 스트랩',
  })
  return { dialog: dialog as HTMLDialogElement, onDone }
}

describe('첫 화면 인트로', () => {
  afterEach(() => {
    vi.useRealTimers()
    window.sessionStorage.clear()
    delete document.documentElement.dataset.intro
  })

  it('열리면 애쉬 코어 소개와 열두 조합을 보여 주고 입장 버튼에 초점을 둔다', async () => {
    const { dialog } = await openIntro()
    expect(dialog.open).toBe(true)
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAccessibleDescription(
      '세계 최초의 특수합금 무브먼트 애쉬 코어(Ash Core)를 품은 A-01의 열두 가지 얼굴',
    )
    const lineup = screen.getByRole('list', { name: 'A-01 열두 가지 조합' })
    expect(lineup.querySelectorAll('li')).toHaveLength(12)
    expect(lineup.querySelector('img')).toHaveAttribute(
      'src',
      expect.stringMatching(/lineup\/00\.webp$/),
    )
    expect(screen.getByRole('button', { name: '입장하기' })).toHaveFocus()
    expect(document.documentElement.dataset.intro).toBe('open')
    expect(window.sessionStorage.getItem(INTRO_SEEN_KEY)).toBe('seen')
  })

  it('입장하기를 누르면 들어가기 연출을 마친 뒤 닫고 첫 화면을 돌려준다', async () => {
    const { dialog, onDone } = await openIntro()
    vi.useFakeTimers()
    fireEvent.click(screen.getByRole('button', { name: '입장하기' }))
    expect(dialog).toHaveAttribute('data-phase', 'entering')
    act(() => {
      vi.advanceTimersByTime(INTRO_ENTER_MS - 1)
    })
    expect(onDone).not.toHaveBeenCalled()
    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(dialog.open).toBe(false)
    expect(onDone).toHaveBeenCalledTimes(1)
    expect(document.documentElement.dataset.intro).toBeUndefined()
  })

  it.each([
    [
      '아래 화살표',
      (dialog: HTMLElement) => fireEvent.keyDown(dialog, { key: 'ArrowDown' }),
    ],
    [
      '휠을 아래로',
      (dialog: HTMLElement) => fireEvent.wheel(dialog, { deltaY: 80 }),
    ],
    ['화면 누르기', (dialog: HTMLElement) => fireEvent.click(dialog)],
    [
      '화면을 위로 밀기',
      (dialog: HTMLElement) => {
        fireEvent.touchStart(dialog, { touches: [{ clientY: 500 }] })
        fireEvent.touchMove(dialog, { touches: [{ clientY: 420 }] })
      },
    ],
  ])('%s로도 들어간다', async (_, trigger) => {
    const { dialog } = await openIntro()
    trigger(dialog)
    expect(dialog).toHaveAttribute('data-phase', 'entering')
  })

  it('휠을 위로 굴리면 들어가지 않는다', async () => {
    const { dialog } = await openIntro()
    fireEvent.wheel(dialog, { deltaY: -120 })
    expect(dialog).toHaveAttribute('data-phase', 'open')
  })

  it('Esc로 닫으면 연출 없이 바로 첫 화면을 돌려준다', async () => {
    const { dialog, onDone } = await openIntro()
    // 브라우저는 Esc에 cancel·close를 보냅니다. jsdom에서는 close()로 대신합니다.
    act(() => dialog.close())
    expect(onDone).toHaveBeenCalledTimes(1)
    expect(document.documentElement.dataset.intro).toBeUndefined()
  })

  it('close 이벤트가 늦게 와도(렌더링이 느린 기기) 닫히는 순간 바로 첫 화면을 돌려준다', async () => {
    const { dialog, onDone } = await openIntro()
    // Esc를 누르면 브라우저는 그 자리에서 닫고(open 속성을 뺌), close 이벤트는 다음 렌더링 뒤에 보냅니다.
    act(() => dialog.removeAttribute('open'))
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1))
    expect(document.documentElement.dataset.intro).toBeUndefined()
    // 늦게 도착한 close 이벤트로 두 번 돌려주지 않습니다.
    act(() => {
      dialog.dispatchEvent(new Event('close'))
    })
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('Ctrl+휠·트랙패드 핀치(확대)는 막지 않고 들어가기로도 보지 않는다', async () => {
    const { dialog } = await openIntro()
    const notPrevented = fireEvent.wheel(dialog, { deltaY: 120, ctrlKey: true })
    expect(notPrevented).toBe(true)
    expect(dialog).toHaveAttribute('data-phase', 'open')
  })

  it('두 손가락 핀치나 확대한 화면을 옮기는 손짓은 위로 밀기로 보지 않는다', async () => {
    const { dialog } = await openIntro()
    fireEvent.touchStart(dialog, {
      touches: [{ clientY: 500 }, { clientY: 300 }],
    })
    fireEvent.touchMove(dialog, {
      touches: [{ clientY: 400 }, { clientY: 200 }],
    })
    expect(dialog).toHaveAttribute('data-phase', 'open')

    const viewport = window.visualViewport
    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      value: { scale: 2 },
    })
    try {
      fireEvent.touchStart(dialog, { touches: [{ clientY: 500 }] })
      fireEvent.touchMove(dialog, { touches: [{ clientY: 400 }] })
      expect(dialog).toHaveAttribute('data-phase', 'open')
    } finally {
      Object.defineProperty(window, 'visualViewport', {
        configurable: true,
        value: viewport,
      })
    }
  })

  it('<dialog>를 열 수 없는 브라우저면 인트로 없이 첫 화면을 돌려준다', async () => {
    const showModal = HTMLDialogElement.prototype.showModal
    HTMLDialogElement.prototype.showModal = undefined as unknown as () => void
    const onDone = vi.fn()
    try {
      render(<Intro onDone={onDone} />)
      await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1))
      expect(document.documentElement.dataset.intro).toBeUndefined()
    } finally {
      HTMLDialogElement.prototype.showModal = showModal
    }
  })

  it('들어간 뒤 이어지는 관성 휠·누르고 있던 키 반복은 입력이 끊길 때까지 페이지를 내리지 않는다', async () => {
    const { dialog, onDone } = await openIntro()
    vi.useFakeTimers()
    fireEvent.keyDown(dialog, { key: 'ArrowDown' })
    act(() => {
      vi.advanceTimersByTime(INTRO_ENTER_MS)
    })
    expect(onDone).toHaveBeenCalledTimes(1)

    // 닫힌 직후의 관성 휠과 키 반복은 막습니다.
    expect(fireEvent.wheel(window, { deltaY: 40 })).toBe(false)
    expect(fireEvent.keyDown(window, { key: 'ArrowDown', repeat: true })).toBe(
      false,
    )
    // 새로 누른 키는 막지 않습니다.
    expect(fireEvent.keyDown(window, { key: 'ArrowDown' })).toBe(true)
    // 입력이 잠깐 끊기면 다시 스크롤할 수 있습니다.
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(fireEvent.wheel(window, { deltaY: 40 })).toBe(true)
  })

  it('@property를 모르는 브라우저에서만 하늘을 원형 구멍 대신 페이드로 걷어 낸다', async () => {
    vi.stubGlobal('CSS', {})
    try {
      const { dialog } = await openIntro()
      expect(dialog).toHaveAttribute('data-sky', 'fade')
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('@property를 아는 브라우저는 원형 구멍으로만 연다', async () => {
    vi.stubGlobal('CSS', { registerProperty: () => {} })
    try {
      const { dialog } = await openIntro()
      expect(dialog).not.toHaveAttribute('data-sky')
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
