import { useEffect, useRef } from 'react'
import { useFrameLoop } from '@/shared/lib/frame-loop'
import type { StudioStore } from '../model/studio-store'
import { useStudio } from '../model/use-studio'

/** 재생 중이면 FPS에 맞춰 프레임을 넘깁니다. */
export function usePlayback(store: StudioStore): void {
  const playing = useStudio((state) => state.playing)
  const clock = useRef(0)
  useFrameLoop((dt) => {
    const step = 1 / store.get().artwork.fps
    clock.current += dt
    while (clock.current >= step) {
      clock.current -= step
      store.stepFrame(1)
    }
  }, playing)
}

function isTextField(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      target instanceof HTMLTextAreaElement ||
      (target instanceof HTMLInputElement &&
        ['text', 'number', 'search', 'email', 'url'].includes(target.type)))
  )
}

/** Ctrl(⌘)+Z 되돌리기, Ctrl(⌘)+Shift+Z·Ctrl+Y 다시 하기. 글자 입력 칸에서는 브라우저 기본 동작을 둡니다. */
export function useHistoryShortcuts(store: StudioStore): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.altKey) return
      if (isTextField(event.target)) return
      if (document.querySelector('dialog[open]')) return
      const key = event.key.toLowerCase()
      if (key === 'z') {
        event.preventDefault()
        if (event.shiftKey) store.redo()
        else store.undo()
      } else if (key === 'y') {
        event.preventDefault()
        store.redo()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [store])
}

/** 바꾼 것이 있으면 페이지를 떠나기 전에 브라우저가 확인하게 합니다. */
export function useLeaveGuard(): void {
  const dirty = useStudio((state) => state.dirty)
  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])
}
