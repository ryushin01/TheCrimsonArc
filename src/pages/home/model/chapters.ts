import { type RefObject, useEffect } from 'react'
import { clamp } from '@/shared/lib/math'
import { scrollStore } from '@/shared/lib/scroll'

/** 3D 무대가 따라가는 스크롤 구간 */
export type ChapterId = 'hero' | 'about' | 'process' | 'frames' | 'flipbook'

interface ChapterBox {
  top: number
  height: number
}

const boxes = new Map<ChapterId, ChapterBox>()
const elements = new Map<ChapterId, HTMLElement>()

function measure(id: ChapterId) {
  const element = elements.get(id)
  if (!element) return
  const rect = element.getBoundingClientRect()
  boxes.set(id, { top: rect.top + window.scrollY, height: rect.height })
}

function measureAll() {
  for (const id of elements.keys()) measure(id)
}

let observer: ResizeObserver | null = null

/** 섹션의 문서 안 위치를 재 두고, 크기가 바뀌면 다시 잽니다. (매 프레임 레이아웃을 읽지 않으려는 것) */
export function useChapter(
  id: ChapterId,
  ref: RefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    const element = ref.current
    if (!element) return
    elements.set(id, element)
    measure(id)
    if (!observer) {
      observer = new ResizeObserver(measureAll)
      observer.observe(document.body)
      window.addEventListener('resize', measureAll)
      window.addEventListener('load', measureAll)
    }
    observer.observe(element)
    return () => {
      observer?.unobserve(element)
      elements.delete(id)
      boxes.delete(id)
    }
  }, [id, ref])
}

/**
 * 구간 진행도 (0~1)
 * - through: 섹션 위쪽이 화면 아래에 들어올 때 0, 아래쪽이 화면 위로 나갈 때 1
 * - pinned: 섹션 위쪽이 화면 위에 닿을 때 0, 섹션 끝이 화면 아래에 닿을 때 1 (sticky 연출용)
 * - leaving: 섹션 위쪽이 화면 위에 닿을 때 0, 아래쪽이 화면 위로 나갈 때 1 (첫 화면용)
 */
export function chapterProgress(
  id: ChapterId,
  mode: 'through' | 'pinned' | 'leaving',
  scrollY = scrollStore.get().y,
  viewportHeight = window.innerHeight,
): number {
  const box = boxes.get(id)
  if (!box) return 0
  if (mode === 'through') {
    return clamp(
      (scrollY + viewportHeight - box.top) / (box.height + viewportHeight),
    )
  }
  if (mode === 'leaving') {
    return clamp((scrollY - box.top) / Math.max(1, box.height))
  }
  return clamp((scrollY - box.top) / Math.max(1, box.height - viewportHeight))
}

/** 섹션이 끝나는 문서 위치 (3D 무대를 멈출 지점 계산용) */
export function chapterBottom(id: ChapterId): number | null {
  const box = boxes.get(id)
  return box ? box.top + box.height : null
}
