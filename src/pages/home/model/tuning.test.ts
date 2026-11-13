import { act, renderHook } from '@testing-library/react'
import { DEFAULT_TUNING, tuningStore, useTuningValue } from './tuning'

describe('tuningStore', () => {
  afterEach(() => tuningStore.reset())

  it('바꾼 값만 구독자에게 알리고 기본값으로 되돌린다', () => {
    const { result } = renderHook(() => useTuningValue('sliceCount'))
    expect(result.current).toBe(DEFAULT_TUNING.sliceCount)
    act(() => tuningStore.set({ sliceCount: 7 }))
    expect(result.current).toBe(7)
    act(() => tuningStore.reset())
    expect(result.current).toBe(DEFAULT_TUNING.sliceCount)
  })
})
