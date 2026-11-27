import { render } from '@testing-library/react'
import { useRef } from 'react'
import { chapterBottom, chapterProgress, useChapter } from './chapters'

/** 문서 위치 top·높이 height인 섹션을 그려 구간으로 등록합니다. */
function Chapter({ top, height }: { top: number; height: number }) {
  const ref = useRef<HTMLElement>(null)
  useChapter('about', ref)
  return (
    <section
      ref={(element) => {
        ref.current = element
        if (element)
          element.getBoundingClientRect = () =>
            DOMRect.fromRect({ x: 0, y: top, width: 100, height })
      }}
    />
  )
}

describe('chapters', () => {
  it('등록하지 않은 구간은 진행도 0, 끝 위치 null', () => {
    expect(chapterProgress('process', 'through', 0, 800)).toBe(0)
    expect(chapterBottom('process')).toBeNull()
  })

  it('세 방식으로 구간 진행도를 계산하고, 사라지면 지운다', () => {
    const { unmount } = render(<Chapter top={1000} height={2000} />)
    expect(chapterBottom('about')).toBe(3000)
    // through: 위쪽이 화면 아래(200 + 800 = 1000)에 들어올 때 0
    expect(chapterProgress('about', 'through', 200, 800)).toBe(0)
    expect(chapterProgress('about', 'through', 1600, 800)).toBeCloseTo(0.5)
    // pinned: 위쪽이 화면 위에 닿을 때 0, 끝이 화면 아래에 닿을 때(3000 - 800) 1
    expect(chapterProgress('about', 'pinned', 1000, 800)).toBe(0)
    expect(chapterProgress('about', 'pinned', 2200, 800)).toBe(1)
    // leaving: 아래쪽이 화면 위로 나갈 때 1
    expect(chapterProgress('about', 'leaving', 2000, 800)).toBeCloseTo(0.5)
    expect(chapterProgress('about', 'leaving', 9000, 800)).toBe(1)

    unmount()
    expect(chapterBottom('about')).toBeNull()
  })
})
