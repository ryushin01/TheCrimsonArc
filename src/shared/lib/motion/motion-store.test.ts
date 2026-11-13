import { act, renderHook } from '@testing-library/react'
import { motionStore, useMotion } from './motion-store'

describe('motionStore', () => {
  it('정지 상태를 바꾸면 구독자와 html 속성에 반영하고 저장한다', () => {
    const { result } = renderHook(() => useMotion())
    act(() => result.current.setPaused(true))
    expect(result.current.paused).toBe(true)
    expect(document.documentElement.dataset.motion).toBe('paused')
    expect(window.localStorage.getItem('crimson-arc:motion')).toBe('paused')

    act(() => motionStore.setPaused(false))
    expect(result.current.paused).toBe(false)
    expect(document.documentElement.dataset.motion).toBe('playing')
  })
})
